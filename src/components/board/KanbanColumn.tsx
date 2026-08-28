'use client'

import { Draggable, Droppable } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { Application } from '@/lib/types'
import ApplicationCard from './ApplicationCard'

interface KanbanColumnProps {
  columnId: string
  title: string
  applications: Application[]
  color?: string
  onCardClick: (application: Application) => void
  onAddClick: () => void
}

export default function KanbanColumn({
  columnId,
  title,
  applications,
  color = '#6366F1',
  onCardClick,
  onAddClick,
}: KanbanColumnProps) {
  return (
    <section className="relative flex h-[calc(100dvh-190px)] min-h-[440px] max-h-[780px] w-[300px] min-w-[300px] shrink-0 flex-col after:absolute after:-right-2 after:inset-y-0 after:w-px after:bg-[var(--border)] last:after:hidden sm:w-[320px] sm:min-w-[320px] lg:w-[max(280px,calc((100vw-204px)/4))]">
      <header className="relative flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] px-1">
        <span className="absolute -bottom-px left-1 h-[2px] w-9" style={{ backgroundColor: color }} aria-hidden="true" />
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} aria-hidden="true" />
          <h2 className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">{title}</h2>
          <span className="text-[11px] font-semibold tabular-nums text-[var(--text-tertiary)]">
            {applications.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
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
            className={`mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[8px] px-0.5 py-2 transition-[background-color,box-shadow] duration-150 ${
              snapshot.isDraggingOver
                ? 'bg-[var(--accent-subtle)] shadow-[inset_0_0_0_2px_var(--accent-border)]'
                : ''
            }`}
          >
            {applications.map((application, index) => (
              <Draggable
                key={application.id}
                draggableId={application.id}
                index={index}
                disableInteractiveElementBlocking
              >
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={`mb-2 cursor-grab rounded-[8px] transition-[box-shadow,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:cursor-grabbing ${
                      dragSnapshot.isDragging
                        ? 'z-50 opacity-95 shadow-[var(--shadow-lg)] ring-2 ring-[var(--accent-border)]'
                        : ''
                    }`}
                    title="Başka bir statüye taşımak için sürükle"
                  >
                    <ApplicationCard
                      application={application}
                      onClick={() => onCardClick(application)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {applications.length === 0 && !snapshot.isDraggingOver ? (
              <div className="flex min-h-36 flex-1 flex-col items-center justify-center rounded-[8px] border border-dashed border-[var(--border)] px-6 text-center">
                <p className="text-xs font-medium text-[var(--text-secondary)]">Henüz başvuru yok</p>
                <button type="button" onClick={onAddClick} className="mt-1.5 text-[11px] font-semibold text-[var(--text-tertiary)] underline decoration-[var(--border-strong)] underline-offset-4 hover:text-[var(--text-primary)]">
                  İlk başvuruyu ekle
                </button>
              </div>
            ) : null}
          </div>
        )}
      </Droppable>
    </section>
  )
}
