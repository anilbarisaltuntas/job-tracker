'use client'

import { Draggable, Droppable } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { Application } from '@/lib/types'
import ApplicationCard from './ApplicationCard'

interface KanbanColumnProps {
  columnId: string
  title: string
  emoji: string
  applications: Application[]
  color?: string
  onCardClick: (application: Application) => void
  onAddClick: () => void
}

export default function KanbanColumn({
  columnId,
  title,
  emoji,
  applications,
  color = '#6366F1',
  onCardClick,
  onAddClick,
}: KanbanColumnProps) {
  return (
    <section className="flex h-[calc(100dvh-190px)] min-h-[420px] max-h-[760px] w-[300px] min-w-[300px] shrink-0 flex-col overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-column)] shadow-[var(--shadow-xs)] sm:w-[320px] sm:min-w-[320px] lg:w-[calc(25vw-51px)] lg:min-w-[300px]">
      <header className="relative m-2 mb-1 flex shrink-0 items-center justify-between overflow-hidden rounded-[9px] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
        <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: color }} aria-hidden="true" />
        <div className="flex min-w-0 items-center gap-2 pl-1">
          <span className="text-[15px]" aria-hidden="true">{emoji}</span>
          <h2 className="truncate text-[13px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">{title}</h2>
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[5px] border border-[var(--border)] bg-[var(--badge-bg)] px-1.5 text-[10px] font-bold text-[var(--text-secondary)]">
            {applications.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          aria-label={`${title} sütununa başvuru ekle`}
          title="Başvuru ekle"
        >
          <Plus aria-hidden="true" size={15} strokeWidth={2.4} />
        </button>
      </header>

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`mx-1.5 mb-1.5 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[9px] border px-1.5 py-2 transition-[background-color,border-color,box-shadow] duration-150 ${
              snapshot.isDraggingOver
                ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)] shadow-[inset_0_0_0_1px_var(--accent-border)]'
                : 'border-transparent'
            }`}
          >
            {snapshot.isDraggingOver ? (
              <div className="mb-2 flex h-9 shrink-0 items-center justify-center rounded-[7px] border border-dashed border-[var(--accent-border)] bg-[var(--bg-elevated)] text-xs font-bold text-[var(--accent-strong)]">
                Buraya bırak
              </div>
            ) : null}

            {applications.map((application, index) => (
              <Draggable key={application.id} draggableId={application.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={`mb-2.5 rounded-[12px] transition-[transform,box-shadow,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                      dragSnapshot.isDragging
                        ? 'z-50 scale-[1.025] opacity-95 shadow-[var(--shadow-lg)] ring-2 ring-[var(--accent-border)]'
                        : ''
                    }`}
                  >
                    <ApplicationCard
                      application={application}
                      accentColor={color}
                      onClick={() => onCardClick(application)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {applications.length === 0 && !snapshot.isDraggingOver ? (
              <div className="flex min-h-28 flex-1 flex-col items-center justify-center rounded-[9px] border border-dashed border-[var(--border)] bg-[var(--bg-surface)]/40 px-4 text-center">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">Bu sütun boş</p>
                <p className="mt-1 text-[11px] leading-4 text-[var(--text-tertiary)]">Bir kartı buraya sürükle veya yeni başvuru ekle.</p>
              </div>
            ) : null}

            {!snapshot.isDraggingOver ? (
              <button
                type="button"
                onClick={onAddClick}
                className="mt-auto flex min-h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-dashed border-[var(--border)] text-xs font-semibold text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <Plus aria-hidden="true" size={14} />
                Başvuru ekle
              </button>
            ) : null}
          </div>
        )}
      </Droppable>
    </section>
  )
}
