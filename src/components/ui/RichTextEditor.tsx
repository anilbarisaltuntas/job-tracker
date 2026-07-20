'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  const btnClass = "rounded px-2 py-1 text-xs font-medium transition-colors border"
  const activeClass = "bg-blue-500/20 text-blue-500 border-blue-500/30"
  const inactiveClass = "text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--border-hover)]"

  return (
    <div className="flex flex-wrap gap-2 rounded-t-xl border-b p-2" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`${btnClass} ${editor.isActive('bold') ? activeClass : inactiveClass}`}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`${btnClass} ${editor.isActive('italic') ? activeClass : inactiveClass} italic`}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`${btnClass} ${editor.isActive('strike') ? activeClass : inactiveClass} line-through`}
      >
        S
      </button>
      <div className="mx-1 w-px bg-[var(--border)]" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${btnClass} ${editor.isActive('bulletList') ? activeClass : inactiveClass}`}
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${btnClass} ${editor.isActive('orderedList') ? activeClass : inactiveClass}`}
      >
        1. List
      </button>
    </div>
  )
}

export default function RichTextEditor({ content, onChange, placeholder = 'Notlarınızı buraya yazın...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor focus:outline-none min-h-[120px] p-4 text-[var(--text-primary)] text-sm',
      },
    },
  })

  return (
    <div 
      className="overflow-hidden rounded-xl transition-all"
      style={{
        backgroundColor: 'var(--input-bg)',
        border: '1px solid var(--input-border)',
      }}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
