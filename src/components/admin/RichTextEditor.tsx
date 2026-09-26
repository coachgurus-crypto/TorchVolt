"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Table2,
  Undo2,
} from "lucide-react";
import { useEffect } from "react";
import { mergeBrokenParagraphs, normalizeEditorHtml, rebuildPastedTables } from "@/lib/richText";

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your article… Paste from Google Docs works.",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-md",
        },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: "cms-table",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "rich-editor-surface ProseMirror min-h-[28rem] max-w-none px-1 py-2 text-[17px] leading-[1.75] text-zinc-200 outline-none",
      },
      transformPastedHTML(html) {
        return mergeBrokenParagraphs(rebuildPastedTables(html));
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(normalizeEditorHtml(ed.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = normalizeEditorHtml(editor.getHTML());
    const next = normalizeEditorHtml(value || "");
    if (current === next) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-[28rem] rounded-lg border border-white/[0.06] bg-[#111113] px-4 py-6 text-[13px] text-zinc-500">
        Loading editor…
      </div>
    );
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }

  function setImage() {
    if (!editor) return;
    const url = window.prompt("Image URL", "https://");
    if (!url?.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  }

  function insertTable() {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 2, withHeaderRow: true })
      .run();
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-[#111113]">
      <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-0.5 border-b border-white/[0.06] bg-[#111113] px-2 py-1.5">
        <ToolBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <Sep />
        <ToolBtn
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolBtn>
        <Sep />
        <ToolBtn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Numbered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          label="Quote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          label="Divider"
        >
          <Minus className="h-3.5 w-3.5" />
        </ToolBtn>
        <Sep />
        <ToolBtn active={editor.isActive("link")} onClick={setLink} label="Link">
          <Link2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={setImage} label="Image">
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("table")} onClick={insertTable} label="Insert table">
          <Table2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <Sep />
        <ToolBtn
          onClick={() => editor.chain().focus().undo().run()}
          label="Undo"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().redo().run()}
          label="Redo"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>
      <div className="px-4 pb-8 pt-3 sm:px-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Sep() {
  return <span className="mx-1 h-4 w-px bg-white/10" />;
}

function ToolBtn({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
        active
          ? "bg-white/10 text-zinc-50"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}
