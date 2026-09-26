import { renderMarkdown } from "@/lib/markdown";
import { cmsSrcSet } from "@/lib/images";

export type BlockType =
  | "paragraph"
  | "heading"
  | "list"
  | "quote"
  | "image"
  | "separator";

export type EditorBlock = {
  id: string;
  type: BlockType;
  content: string;
  level?: 2 | 3;
  ordered?: boolean;
  items?: string[];
  url?: string;
  alt?: string;
  caption?: string;
  citation?: string;
};

export type BlockDocument = {
  version: 1;
  blocks: EditorBlock[];
};

export function createBlockId() {
  return `b_${Math.random().toString(36).slice(2, 10)}`;
}

export function createBlock(
  type: BlockType,
  partial: Partial<EditorBlock> = {},
): EditorBlock {
  const { type: _ignored, ...rest } = partial;
  const base: EditorBlock = {
    id: createBlockId(),
    type,
    content: "",
    ...rest,
  };

  if (type === "heading") {
    return { ...base, level: partial.level ?? 2, content: partial.content ?? "" };
  }
  if (type === "list") {
    return {
      ...base,
      ordered: partial.ordered ?? false,
      items: partial.items ?? [""],
      content: "",
    };
  }
  if (type === "image") {
    return {
      ...base,
      url: partial.url ?? "",
      alt: partial.alt ?? "",
      caption: partial.caption ?? "",
      content: "",
    };
  }
  if (type === "quote") {
    return {
      ...base,
      content: partial.content ?? "",
      citation: partial.citation ?? "",
    };
  }
  if (type === "separator") {
    return { ...base, content: "" };
  }
  return { ...base, content: partial.content ?? "" };
}

export function emptyDocument(): EditorBlock[] {
  return [createBlock("paragraph")];
}

export function isBlockDocument(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) return false;
  try {
    const parsed = JSON.parse(trimmed) as Partial<BlockDocument>;
    return parsed.version === 1 && Array.isArray(parsed.blocks);
  } catch {
    return false;
  }
}

export function parseBlocks(raw: string): EditorBlock[] {
  if (!raw.trim()) return emptyDocument();
  if (!isBlockDocument(raw)) {
    // Legacy markdown → single paragraph blocks by blank line
    const chunks = raw
      .replace(/\r\n/g, "\n")
      .split(/\n{2,}/)
      .map((c) => c.trim())
      .filter(Boolean);
    if (!chunks.length) return emptyDocument();
    return chunks.map((chunk) => {
      const heading = /^(#{1,3})\s+(.+)$/m.exec(chunk);
      if (heading && !chunk.includes("\n")) {
        const level = Math.min(3, Math.max(2, heading[1].length)) as 2 | 3;
        return createBlock("heading", { level, content: heading[2] });
      }
      return createBlock("paragraph", { content: chunk });
    });
  }
  const doc = JSON.parse(raw) as BlockDocument;
  return doc.blocks.length ? doc.blocks : emptyDocument();
}

export function serializeBlocks(blocks: EditorBlock[]): string {
  const doc: BlockDocument = { version: 1, blocks };
  return JSON.stringify(doc);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineHtml(text: string) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
}

export function renderBlocksHtml(blocks: EditorBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading": {
          const level = block.level === 3 ? 3 : 2;
          return `<h${level}>${inlineHtml(block.content)}</h${level}>`;
        }
        case "list": {
          const tag = block.ordered ? "ol" : "ul";
          const items = (block.items ?? [])
            .filter((item) => item.trim())
            .map((item) => `<li>${inlineHtml(item)}</li>`)
            .join("");
          return `<${tag}>${items}</${tag}>`;
        }
        case "quote": {
          const cite = block.citation?.trim()
            ? `<cite>${inlineHtml(block.citation)}</cite>`
            : "";
          return `<blockquote><p>${inlineHtml(block.content)}</p>${cite}</blockquote>`;
        }
        case "image": {
          if (!block.url?.trim()) return "";
          const caption = block.caption?.trim()
            ? `<figcaption>${inlineHtml(block.caption)}</figcaption>`
            : "";
          return `<figure><img src="${escapeHtml(block.url)}" srcset="${escapeHtml(cmsSrcSet(block.url))}" sizes="(min-width: 768px) 720px, 100vw" alt="${escapeHtml(block.alt ?? "")}" loading="lazy" decoding="async" />${caption}</figure>`;
        }
        case "separator":
          return "<hr />";
        case "paragraph":
        default:
          if (!block.content.trim()) return "";
          return `<p>${inlineHtml(block.content).replace(/\n/g, "<br />")}</p>`;
      }
    })
    .filter(Boolean)
    .join("\n");
}

/** Render stored post content (block JSON or legacy markdown). */
export function renderPostContent(raw: string): string {
  if (isBlockDocument(raw)) {
    return renderBlocksHtml(parseBlocks(raw));
  }
  return renderMarkdown(raw);
}

export const BLOCK_CATALOG: {
  type: BlockType;
  label: string;
  description: string;
}[] = [
  {
    type: "paragraph",
    label: "Paragraph",
    description: "Start writing with plain text.",
  },
  {
    type: "heading",
    label: "Heading",
    description: "Section title for structure.",
  },
  {
    type: "list",
    label: "List",
    description: "Bulleted or numbered items.",
  },
  {
    type: "quote",
    label: "Quote",
    description: "Highlight a pull quote.",
  },
  {
    type: "image",
    label: "Image",
    description: "Embed an image from a URL.",
  },
  {
    type: "separator",
    label: "Separator",
    description: "A horizontal divider line.",
  },
];

export type PasteResult = {
  /** Suggested post title when paste started with an H1 */
  title?: string;
  blocks: EditorBlock[];
};

/** Strip markdown heading markers and tidy clipboard text. */
export function cleanClipboardText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function textContentOf(el: Element): string {
  return cleanClipboardText(el.textContent);
}

function unwrapGoogleWrappers(body: HTMLElement) {
  // Docs often wraps everything in <b style="font-weight:normal"> or similar.
  for (let i = 0; i < 6; i += 1) {
    if (body.children.length !== 1) break;
    const only = body.children[0] as HTMLElement;
    const tag = only.tagName;
    if (!["B", "SPAN", "DIV", "FONT", "CENTER"].includes(tag)) break;
    while (only.firstChild) body.insertBefore(only.firstChild, only);
    only.remove();
  }
}

function blocksFromNodes(nodes: Iterable<ChildNode>): EditorBlock[] {
  const out: EditorBlock[] = [];

  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = cleanClipboardText(node.textContent);
      if (text) out.push(createBlock("paragraph", { content: text }));
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "br") continue;

    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
      const content = textContentOf(el);
      if (!content) continue;
      // Body editor uses H2/H3 only — H1 becomes H2 (title handled separately).
      const level: 2 | 3 = tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6" ? 3 : 2;
      out.push(createBlock("heading", { level, content }));
      continue;
    }

    if (tag === "p" || tag === "div" || tag === "section" || tag === "article") {
      // Prefer structured children when present (nested lists/headings).
      const hasBlockChild = Array.from(el.children).some((c) =>
        /^(H[1-6]|UL|OL|BLOCKQUOTE|HR|TABLE|P|DIV)$/i.test(c.tagName),
      );
      if (hasBlockChild) {
        out.push(...blocksFromNodes(el.childNodes));
      } else {
        const content = textContentOf(el);
        if (content) out.push(createBlock("paragraph", { content }));
      }
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      const items = Array.from(el.querySelectorAll(":scope > li"))
        .map((li) => textContentOf(li))
        .filter(Boolean);
      if (items.length) {
        out.push(createBlock("list", { ordered: tag === "ol", items }));
      }
      continue;
    }

    if (tag === "blockquote") {
      const content = textContentOf(el);
      if (content) out.push(createBlock("quote", { content }));
      continue;
    }

    if (tag === "hr") {
      out.push(createBlock("separator"));
      continue;
    }

    if (tag === "li") {
      const content = textContentOf(el);
      if (content) out.push(createBlock("list", { items: [content] }));
      continue;
    }

    // Fallback: recurse or plain text
    if (el.children.length) {
      out.push(...blocksFromNodes(el.childNodes));
    } else {
      const content = textContentOf(el);
      if (content) out.push(createBlock("paragraph", { content }));
    }
  }

  return out;
}

/** Convert HTML clipboard (Google Docs, Word, browsers) into editor blocks. */
export function htmlClipboardToBlocks(html: string): PasteResult {
  if (typeof DOMParser === "undefined") {
    return { blocks: plainClipboardToBlocks(html.replace(/<[^>]+>/g, " ")).blocks };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  unwrapGoogleWrappers(doc.body);
  const blocks = blocksFromNodes(doc.body.childNodes).filter((b) => {
    if (b.type === "separator") return true;
    if (b.type === "list") return (b.items ?? []).some((i) => i.trim());
    if (b.type === "image") return Boolean(b.url?.trim());
    return Boolean(b.content?.trim());
  });

  if (!blocks.length) return { blocks: emptyDocument() };

  // First H1-equivalent (stored as H2 from Docs title) → suggest as post title
  let title: string | undefined;
  if (blocks[0]?.type === "heading" && blocks[0].level === 2) {
    // Heuristic: treat first heading as title when the HTML had an h1
    const hadH1 = /<h1[\s>]/i.test(html);
    if (hadH1) {
      title = blocks[0].content;
      blocks.shift();
    }
  }

  return {
    title,
    blocks: blocks.length ? blocks : emptyDocument(),
  };
}

/** Convert plain / markdown-ish clipboard into editor blocks (no leftover #). */
export function plainClipboardToBlocks(raw: string): PasteResult {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return { blocks: emptyDocument() };

  const lines = text.split("\n");
  const blocks: EditorBlock[] = [];
  let title: string | undefined;
  let i = 0;

  const flushList = (ordered: boolean, items: string[]) => {
    if (items.length) blocks.push(createBlock("list", { ordered, items }));
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (heading) {
      const hashes = heading[1].length;
      const content = cleanClipboardText(heading[2]);
      if (hashes === 1 && !title && blocks.length === 0) {
        title = content;
      } else {
        const level: 2 | 3 = hashes >= 3 ? 3 : 2;
        blocks.push(createBlock("heading", { level, content }));
      }
      i += 1;
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(trimmed);
    if (quote) {
      const parts = [cleanClipboardText(quote[1])];
      i += 1;
      while (i < lines.length) {
        const q = /^>\s?(.*)$/.exec(lines[i].trim());
        if (!q) break;
        parts.push(cleanClipboardText(q[1]));
        i += 1;
      }
      blocks.push(createBlock("quote", { content: parts.filter(Boolean).join(" ") }));
      continue;
    }

    const ul = /^[-*•]\s+(.+)$/.exec(trimmed);
    if (ul) {
      const items = [cleanClipboardText(ul[1])];
      i += 1;
      while (i < lines.length) {
        const next = /^[-*•]\s+(.+)$/.exec(lines[i].trim());
        if (!next) break;
        items.push(cleanClipboardText(next[1]));
        i += 1;
      }
      flushList(false, items);
      continue;
    }

    const ol = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (ol) {
      const items = [cleanClipboardText(ol[1])];
      i += 1;
      while (i < lines.length) {
        const next = /^\d+[.)]\s+(.+)$/.exec(lines[i].trim());
        if (!next) break;
        items.push(cleanClipboardText(next[1]));
        i += 1;
      }
      flushList(true, items);
      continue;
    }

    if (trimmed === "---" || trimmed === "***") {
      blocks.push(createBlock("separator"));
      i += 1;
      continue;
    }

    // Paragraph: gather until blank line
    const parts = [cleanClipboardText(trimmed)];
    i += 1;
    while (i < lines.length && lines[i].trim()) {
      const peek = lines[i].trim();
      if (
        /^(#{1,6})\s+/.test(peek) ||
        /^[-*•]\s+/.test(peek) ||
        /^\d+[.)]\s+/.test(peek) ||
        /^>\s?/.test(peek)
      ) {
        break;
      }
      parts.push(cleanClipboardText(peek));
      i += 1;
    }
    const content = parts.filter(Boolean).join(" ");
    if (content) blocks.push(createBlock("paragraph", { content }));
  }

  return {
    title,
    blocks: blocks.length ? blocks : emptyDocument(),
  };
}

/** Prefer HTML from Docs/Word; fall back to plain text. */
export function clipboardToBlocks(
  html: string | undefined,
  plain: string | undefined,
): PasteResult {
  const plainText = plain ?? "";
  const rich = (html ?? "").trim();
  const hasUsefulHtml =
    rich.length > 0 &&
    /<(p|h[1-6]|ul|ol|li|blockquote|div|span)[\s>]/i.test(rich) &&
    !/^<!--StartFragment-->\s*<!--EndFragment-->$/i.test(rich);

  if (hasUsefulHtml) {
    const fromHtml = htmlClipboardToBlocks(rich);
    if (fromHtml.blocks.length > 1 || fromHtml.title || fromHtml.blocks[0]?.content) {
      return fromHtml;
    }
  }

  return plainClipboardToBlocks(plainText);
}

/** True when clipboard should replace the current block instead of inserting characters. */
export function isStructuredPaste(html: string | undefined, plain: string | undefined): boolean {
  const text = plain ?? "";
  const rich = html ?? "";
  if (/<(h[1-6]|ul|ol|li|blockquote|p)[\s>]/i.test(rich)) return true;
  if (text.includes("\n")) return true;
  if (/^#{1,6}\s+/m.test(text)) return true;
  if (/^[-*•]\s+/m.test(text)) return true;
  if (/^\d+[.)]\s+/m.test(text)) return true;
  return false;
}
