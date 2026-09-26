import DOMPurify from "isomorphic-dompurify";
import { isBlockDocument, parseBlocks, renderBlocksHtml } from "@/lib/blocks";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "hr",
  "img",
  "figure",
  "figcaption",
  "code",
  "pre",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title", "class", "colspan", "rowspan"];

/** Sanitize HTML for safe blog rendering. */
export function sanitizePostHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

function endsSentence(text: string) {
  return /[.!?:;…]"?$/.test(text.trim());
}

function looksLikeWrap(text: string) {
  const t = text.trim();
  if (!t) return false;
  if (endsSentence(t)) return false;
  const words = t.split(/\s+/).filter(Boolean);
  return words.length <= 12 && t.length < 90;
}

/** Short cell-like lines from a Docs table that lost its structure. */
function looksLikeTableCell(text: string) {
  const t = text.trim();
  if (!t) return false;
  if (endsSentence(t)) return false;
  const words = t.split(/\s+/).filter(Boolean);
  return words.length <= 8 && t.length < 80;
}

/**
 * Google Docs / PDF copies often emit one <p> per visual line.
 * Merge consecutive short paragraphs that look like soft-wrapped lines.
 */
export function mergeBrokenParagraphs(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = doc.getElementById("root");
  if (!root) return html;

  const kids = Array.from(root.childNodes).filter((n) => {
    if (n.nodeType === Node.ELEMENT_NODE) return true;
    if (n.nodeType === Node.TEXT_NODE) return Boolean((n.textContent || "").trim());
    return false;
  });
  const out: Node[] = [];
  let pending: HTMLParagraphElement | null = null;

  for (const node of kids) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "P") {
      const p = node as HTMLParagraphElement;
      const text = (p.textContent || "").replace(/\u00a0/g, " ").trim();
      if (!text) {
        if (pending) {
          out.push(pending);
          pending = null;
        }
        continue;
      }

      if (pending && looksLikeWrap(pending.textContent || "")) {
        pending.innerHTML = `${pending.innerHTML.replace(/\s+$/, "")} ${p.innerHTML.replace(/^\s+/, "")}`;
        continue;
      }

      if (pending) out.push(pending);
      pending = p.cloneNode(true) as HTMLParagraphElement;
      continue;
    }

    if (pending) {
      out.push(pending);
      pending = null;
    }
    out.push(node.cloneNode(true));
  }
  if (pending) out.push(pending);

  const wrap = doc.createElement("div");
  for (const n of out) wrap.appendChild(n);
  return wrap.innerHTML;
}

/**
 * Rebuild 2-column comparison tables that were pasted as one cell per <p>.
 * Example: "Brand" / "Best For" / "Deye" / "Best all-round…" → <table>
 */
export function rebuildPastedTables(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = doc.getElementById("root");
  if (!root) return html;

  // Element children only — renderBlocksHtml joins with "\n", which becomes
  // whitespace text nodes that would otherwise break cell-run detection.
  const nodes = Array.from(root.childNodes).filter((n) => {
    if (n.nodeType === Node.ELEMENT_NODE) return true;
    if (n.nodeType === Node.TEXT_NODE) return Boolean((n.textContent || "").trim());
    return false;
  });
  const out: Node[] = [];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];
    if (
      node.nodeType !== Node.ELEMENT_NODE ||
      (node as Element).tagName !== "P" ||
      !looksLikeTableCell((node as Element).textContent || "")
    ) {
      out.push(node.cloneNode(true));
      i += 1;
      continue;
    }

    const run: HTMLParagraphElement[] = [];
    let j = i;
    while (j < nodes.length) {
      const n = nodes[j];
      if (
        n.nodeType !== Node.ELEMENT_NODE ||
        (n as Element).tagName !== "P" ||
        !looksLikeTableCell((n as Element).textContent || "")
      ) {
        break;
      }
      run.push(n as HTMLParagraphElement);
      j += 1;
    }

    // Need at least header + 2 rows (6 cells) for a 2-col table
    if (run.length >= 6 && run.length % 2 === 0) {
      const table = doc.createElement("table");
      table.className = "cms-table";
      const thead = doc.createElement("thead");
      const headerRow = doc.createElement("tr");
      const th1 = doc.createElement("th");
      th1.innerHTML = run[0].innerHTML;
      const th2 = doc.createElement("th");
      th2.innerHTML = run[1].innerHTML;
      headerRow.appendChild(th1);
      headerRow.appendChild(th2);
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = doc.createElement("tbody");
      for (let k = 2; k < run.length; k += 2) {
        const tr = doc.createElement("tr");
        const td1 = doc.createElement("td");
        td1.innerHTML = run[k].innerHTML;
        const td2 = doc.createElement("td");
        td2.innerHTML = run[k + 1].innerHTML;
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      out.push(table);
      i = j;
      continue;
    }

    out.push(run[0].cloneNode(true));
    i += 1;
  }

  const wrap = doc.createElement("div");
  for (const n of out) wrap.appendChild(n);
  return wrap.innerHTML;
}

/** Normalize editor HTML before save/render. */
export function normalizeEditorHtml(html: string): string {
  const cleaned = sanitizePostHtml(html || "");
  if (!cleaned.trim() || cleaned === "<p></p>") return "";
  // Tables first — merging wrap lines would glue cell pairs together.
  return mergeBrokenParagraphs(rebuildPastedTables(cleaned));
}

/** Load any stored format into editor HTML. */
export function contentToEditorHtml(raw: string): string {
  if (!raw?.trim()) return "";
  if (isBlockDocument(raw)) {
    return normalizeEditorHtml(renderBlocksHtml(parseBlocks(raw)));
  }
  if (raw.trim().startsWith("{")) {
    try {
      JSON.parse(raw);
      return normalizeEditorHtml(renderBlocksHtml(parseBlocks(raw)));
    } catch {
      /* fall through */
    }
  }
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return normalizeEditorHtml(raw);
  }
  const parts = raw
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts
    .map((p) => {
      const heading = /^(#{1,3})\s+(.+)$/.exec(p);
      if (heading && !p.includes("\n")) {
        const level = Math.min(3, Math.max(2, heading[1].length));
        return `<h${level}>${escapeText(heading[2])}</h${level}>`;
      }
      return `<p>${escapeText(p).replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}

function escapeText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Public render path for blog posts. */
export function renderStoredContent(raw: string): string {
  if (!raw?.trim()) return "";
  if (isBlockDocument(raw)) {
    return sanitizePostHtml(
      mergeBrokenParagraphs(
        rebuildPastedTables(renderBlocksHtml(parseBlocks(raw))),
      ),
    );
  }
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return sanitizePostHtml(mergeBrokenParagraphs(rebuildPastedTables(raw)));
  }
  return sanitizePostHtml(contentToEditorHtml(raw));
}
