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
