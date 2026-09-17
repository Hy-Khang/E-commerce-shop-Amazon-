import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RICH_TEXT_CONTENT_CLASS } from '@/common/utils/sanitize.util';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editorProps: {
      attributes: {
        class: `min-h-[9rem] px-3 py-2 text-sm text-slate-900 focus:outline-none dark:text-slate-100 ${RICH_TEXT_CONTENT_CLASS}`,
      },
    },
    onUpdate: ({ editor }) => {
      // Empty editor serializes to "<p></p>" — normalize to "" so the field is truly empty.
      onChange(editor.getText().trim() === '' ? '' : editor.getHTML());
    },
  });

  // Sync external value changes (e.g. the product loads asynchronously on the edit
  // page). Skip while focused to avoid clobbering the caret mid-typing.
  useEffect(() => {
    if (!editor) return;
    const next = value || '';
    if (next !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const charCount = editor.getText().length;

  return (
    <div className="rounded-lg border border-slate-200 bg-white transition-colors focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 px-1.5 py-1 dark:border-slate-700">
        <ToolbarButton icon={Bold} label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton icon={Italic} label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton icon={Underline} label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <ToolbarButton icon={Strikethrough} label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton icon={List} label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarButton icon={ListOrdered} label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      </div>
      <EditorContent editor={editor} />
      <div className="border-t border-slate-200 px-3 py-1 text-right text-[11px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
        {charCount} characters
      </div>
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, active, onClick }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      // Prevent the button from stealing focus (which would close the selection) before the command runs.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded p-1.5 transition-colors ${
        active
          ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
