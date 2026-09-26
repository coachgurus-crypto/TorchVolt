"use client";

import {
  ArrowDown,
  ArrowUp,
  Heading2,
  ImageIcon,
  List,
  Minus,
  Plus,
  Quote,
  Trash2,
  Type,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  BLOCK_CATALOG,
  clipboardToBlocks,
  createBlock,
  isStructuredPaste,
  type BlockType,
  type EditorBlock,
} from "@/lib/blocks";

const ICONS: Record<BlockType, typeof Type> = {
  paragraph: Type,
  heading: Heading2,
  list: List,
  quote: Quote,
  image: ImageIcon,
  separator: Minus,
};

export function BlockEditor({
  blocks,
  onChange,
  onSuggestTitle,
}: {
  blocks: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
  /** When paste starts with a document title / H1 */
  onSuggestTitle?: (title: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    blocks[0]?.id ?? null,
  );
  const [inserterAt, setInserterAt] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setSelectedId(null);
        setInserterAt(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function updateBlock(id: string, patch: Partial<EditorBlock>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= blocks.length) return;
    const copy = [...blocks];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  }

  function removeBlock(id: string) {
    if (blocks.length <= 1) {
      onChange([createBlock("paragraph")]);
      setSelectedId(null);
      return;
    }
    const idx = blocks.findIndex((b) => b.id === id);
    const next = blocks.filter((b) => b.id !== id);
    onChange(next);
    setSelectedId(next[Math.max(0, idx - 1)]?.id ?? null);
  }

  function insertBlock(type: BlockType, at: number) {
    const block =
      type === "heading"
        ? createBlock("heading", { level: 2 })
        : createBlock(type);
    const copy = [...blocks];
    copy.splice(at, 0, block);
    onChange(copy);
    setSelectedId(block.id);
    setInserterAt(null);
  }

  function transformBlock(id: string, type: BlockType) {
    const current = blocks.find((b) => b.id === id);
    if (!current) return;
    const next = createBlock(type, {
      content: current.content,
      level: type === "heading" ? current.level ?? 2 : undefined,
      items:
        type === "list"
          ? current.items?.length
            ? current.items
            : current.content
              ? current.content.split("\n")
              : [""]
          : undefined,
      url: current.url,
      alt: current.alt,
      caption: current.caption,
      citation: current.citation,
      ordered: current.ordered,
    });
    next.id = current.id;
    onChange(blocks.map((b) => (b.id === id ? next : b)));
  }

  function applyPaste(atId: string, html: string | undefined, plain: string | undefined) {
    const { title, blocks: pasted } = clipboardToBlocks(html, plain);
    if (title && onSuggestTitle) onSuggestTitle(title);

    const idx = blocks.findIndex((b) => b.id === atId);
    if (idx < 0) {
      onChange(pasted);
      setSelectedId(pasted[0]?.id ?? null);
      return;
    }

    const current = blocks[idx];
    const currentEmpty =
      (current.type === "paragraph" || current.type === "heading") &&
      !current.content.trim();

    const copy = [...blocks];
    if (currentEmpty) {
      copy.splice(idx, 1, ...pasted);
    } else {
      copy.splice(idx + 1, 0, ...pasted);
    }
    onChange(copy);
    setSelectedId(pasted[0]?.id ?? null);
  }

  return (
    <div ref={rootRef} className="gutenberg-editor">
      <div className="mx-auto max-w-[680px] px-2 pb-24 pt-2">
        {blocks.map((block, index) => {
          const selected = selectedId === block.id;
          return (
            <div key={block.id} className="group/row relative">
              <InserterLine
                open={inserterAt === index}
                onToggle={() =>
                  setInserterAt((v) => (v === index ? null : index))
                }
                onPick={(type) => insertBlock(type, index)}
              />

              <div
                className={`group relative rounded-md transition-colors ${
                  selected ? "bg-white/[0.03]" : "hover:bg-white/[0.015]"
                }`}
                onMouseDown={() => setSelectedId(block.id)}
              >
                {selected ? (
                  <BlockToolbar
                    block={block}
                    canUp={index > 0}
                    canDown={index < blocks.length - 1}
                    onTransform={(type) => transformBlock(block.id, type)}
                    onMove={(dir) => moveBlock(index, dir)}
                    onRemove={() => removeBlock(block.id)}
                    onChangeLevel={(level) => updateBlock(block.id, { level })}
                    onToggleOrdered={() =>
                      updateBlock(block.id, { ordered: !block.ordered })
                    }
                  />
                ) : null}

                <div className="px-1 py-1.5 sm:px-2">
                  <BlockFields
                    block={block}
                    selected={selected}
                    onChange={(patch) => updateBlock(block.id, patch)}
                    onRequestInsert={() => {
                      insertBlock("paragraph", index + 1);
                    }}
                    onSlash={() => setInserterAt(index + 1)}
                    onPasteRich={(html, plain) => {
                      applyPaste(block.id, html, plain);
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <InserterLine
          open={inserterAt === blocks.length}
          onToggle={() =>
            setInserterAt((v) => (v === blocks.length ? null : blocks.length))
          }
          onPick={(type) => insertBlock(type, blocks.length)}
        />
      </div>
    </div>
  );
}

function InserterLine({
  open,
  onToggle,
  onPick,
}: {
  open: boolean;
  onToggle: () => void;
  onPick: (type: BlockType) => void;
}) {
  return (
    <div className="relative h-2">
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-hover/row:opacity-100">
        <button
          type="button"
          onClick={onToggle}
          className={`studio-plus mr-2 flex h-5 w-5 items-center justify-center rounded border border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-200 ${
            open ? "is-open border-amber-400/40 bg-amber-400/10 text-amber-300" : ""
          }`}
          aria-label="Add block"
        >
          <Plus className="h-3 w-3" />
        </button>
        <div className="h-px flex-1 bg-white/5" />
      </div>
      {open ? (
        <div className="studio-pop absolute left-0 z-20 mt-4 w-[min(100%,18rem)] rounded-lg border border-white/10 bg-[#18181b] p-1 shadow-2xl shadow-black/50">
          <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Insert
          </p>
          <div className="grid gap-px">
            {BLOCK_CATALOG.map((item) => {
              const Icon = ICONS[item.type];
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => onPick(item.type)}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition hover:bg-white/5"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-zinc-300">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-medium text-zinc-100">
                      {item.label}
                    </span>
                    <span className="block text-[11px] text-zinc-500">
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BlockToolbar({
  block,
  canUp,
  canDown,
  onTransform,
  onMove,
  onRemove,
  onChangeLevel,
  onToggleOrdered,
}: {
  block: EditorBlock;
  canUp: boolean;
  canDown: boolean;
  onTransform: (type: BlockType) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onChangeLevel: (level: 2 | 3) => void;
  onToggleOrdered: () => void;
}) {
  return (
    <div className="studio-pop absolute -top-9 left-1 z-10 flex items-center gap-px rounded-md border border-white/10 bg-[#18181b] p-0.5 shadow-xl shadow-black/40">
      <select
        value={block.type}
        onChange={(e) => onTransform(e.target.value as BlockType)}
        className="h-7 rounded border-0 bg-transparent px-1.5 text-[11px] font-medium text-zinc-200 outline-none"
        aria-label="Transform block"
      >
        {BLOCK_CATALOG.map((item) => (
          <option key={item.type} value={item.type}>
            {item.label}
          </option>
        ))}
      </select>

      {block.type === "heading" ? (
        <div className="ml-0.5 flex overflow-hidden rounded border border-white/10">
          <button
            type="button"
            onClick={() => onChangeLevel(2)}
            className={`h-7 px-1.5 text-[11px] font-medium ${
              block.level !== 3 ? "bg-white/10 text-white" : "text-zinc-400"
            }`}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => onChangeLevel(3)}
            className={`h-7 px-1.5 text-[11px] font-medium ${
              block.level === 3 ? "bg-white/10 text-white" : "text-zinc-400"
            }`}
          >
            H3
          </button>
        </div>
      ) : null}

      {block.type === "list" ? (
        <button
          type="button"
          onClick={onToggleOrdered}
          className="h-7 px-2 text-[11px] font-medium text-zinc-300"
        >
          {block.ordered ? "1." : "•"}
        </button>
      ) : null}

      <span className="mx-0.5 h-3.5 w-px bg-white/10" />

      <button
        type="button"
        disabled={!canUp}
        onClick={() => onMove(-1)}
        className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-20"
        aria-label="Move up"
      >
        <ArrowUp className="h-3 w-3" />
      </button>
      <button
        type="button"
        disabled={!canDown}
        onClick={() => onMove(1)}
        className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-20"
        aria-label="Move down"
      >
        <ArrowDown className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
        aria-label="Remove block"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function BlockFields({
  block,
  selected,
  onChange,
  onRequestInsert,
  onSlash,
  onPasteRich,
}: {
  block: EditorBlock;
  selected: boolean;
  onChange: (patch: Partial<EditorBlock>) => void;
  onRequestInsert: () => void;
  onSlash?: () => void;
  onPasteRich?: (html: string | undefined, plain: string | undefined) => void;
}) {
  function handlePaste(e: React.ClipboardEvent) {
    if (!onPasteRich) return;
    const html = e.clipboardData.getData("text/html") || undefined;
    const plain = e.clipboardData.getData("text/plain") || undefined;
    if (!isStructuredPaste(html, plain)) {
      // Still strip accidental leading markdown hashes on simple paste
      if (plain && /^#{1,6}\s+/.test(plain) && !plain.includes("\n")) {
        e.preventDefault();
        const cleaned = plain.replace(/^#{1,6}\s+/, "");
        onChange({ content: (block.content || "") + cleaned });
      }
      return;
    }
    e.preventDefault();
    onPasteRich(html, plain);
  }

  if (block.type === "separator") {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="h-px flex-1 bg-white/10" />
      </div>
    );
  }

  if (block.type === "heading") {
    return (
      <input
        value={block.content}
        onChange={(e) => onChange({ content: e.target.value })}
        onPaste={handlePaste}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onRequestInsert();
          }
        }}
        placeholder="Heading"
        className={`w-full border-0 bg-transparent text-zinc-50 outline-none placeholder:text-zinc-600 ${
          block.level === 3
            ? "text-[22px] font-medium tracking-[-0.03em]"
            : "text-[28px] font-semibold tracking-[-0.035em]"
        }`}
      />
    );
  }

  if (block.type === "quote") {
    return (
      <div className="border-l-2 border-amber-400/70 pl-4">
        <textarea
          value={block.content}
          onChange={(e) => onChange({ content: e.target.value })}
          onPaste={handlePaste}
          placeholder="Quote"
          rows={2}
          className="w-full resize-none border-0 bg-transparent text-[17px] italic leading-7 text-zinc-300 outline-none placeholder:text-zinc-600"
        />
        <input
          value={block.citation ?? ""}
          onChange={(e) => onChange({ citation: e.target.value })}
          placeholder="Citation"
          className="mt-1 w-full border-0 bg-transparent text-[13px] text-zinc-500 outline-none placeholder:text-zinc-700"
        />
      </div>
    );
  }

  if (block.type === "list") {
    const items = block.items ?? [""];
    return (
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-2 w-4 shrink-0 text-center text-[13px] text-zinc-500">
              {block.ordered ? `${i + 1}.` : "•"}
            </span>
            <input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange({ items: next });
              }}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const next = [...items];
                  next.splice(i + 1, 0, "");
                  onChange({ items: next });
                }
                if (e.key === "Backspace" && item === "" && items.length > 1) {
                  e.preventDefault();
                  onChange({ items: items.filter((_, idx) => idx !== i) });
                }
              }}
              placeholder="List"
              className="w-full border-0 bg-transparent py-1 text-[17px] leading-7 text-zinc-200 outline-none placeholder:text-zinc-600"
            />
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className="space-y-2">
        {block.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.url}
            alt={block.alt || ""}
            className="max-h-72 w-full rounded-md object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-white/10 text-[13px] text-zinc-600">
            Image URL
          </div>
        )}
        <input
          value={block.url ?? ""}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://"
          className={`w-full rounded-md border bg-white/[0.03] px-2.5 py-1.5 font-mono text-[12px] text-zinc-300 outline-none placeholder:text-zinc-600 ${
            selected ? "border-white/15" : "border-white/8"
          }`}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={block.alt ?? ""}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Alt"
            className="rounded-md border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-[12px] text-zinc-300 outline-none"
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="Caption"
            className="rounded-md border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-[12px] text-zinc-300 outline-none"
          />
        </div>
      </div>
    );
  }

  return (
    <textarea
      value={block.content}
      onChange={(e) => {
        const value = e.target.value;
        if (value === "/" && onSlash) {
          onChange({ content: "" });
          onSlash();
          return;
        }
        onChange({ content: value });
      }}
      onPaste={handlePaste}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onRequestInsert();
        }
      }}
      placeholder="Write, or paste from Docs — or type / for blocks"
      rows={Math.min(8, Math.max(1, block.content.split("\n").length))}
      className="w-full resize-none border-0 bg-transparent text-[17px] leading-[1.75] text-zinc-200 outline-none placeholder:text-zinc-600"
    />
  );
}
