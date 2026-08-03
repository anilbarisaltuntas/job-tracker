'use client'

/**
 * KANBAN COLUMN — Modern SaaS Design (Fixed Height + Smart Expand/Collapse + Color Accents)
 */

import { useState } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { Application } from '@/lib/types'
import ApplicationCard from './ApplicationCard'

interface KanbanColumnProps {
  columnId: string
  title: string
  emoji: string
  applications: Application[]
  color?: string
  bgColor?: string
  onCardClick: (application: Application) => void
  onAddClick: () => void
}

const INITIAL_SHOW_COUNT = 3

export default function KanbanColumn({
  columnId,
  title,
  emoji,
  applications,
  color = '#6366F1',
  bgColor = '#EFF6FF',
  onCardClick,
  onAddClick,
}: KanbanColumnProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="flex max-h-[calc(100vh-210px)] min-h-[280px] w-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-column)] transition-colors hover:border-[var(--border-strong)] overflow-hidden shadow-xs">
      
      {/* Sütun başlığı */}
      <div 
        className="m-2 mb-2 flex shrink-0 items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2.5 shadow-2xs relative overflow-hidden"
      >
        {/* Sol tarafta sütuna özel renkli aksan barı */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1" 
          style={{ backgroundColor: color }}
        />

        <div className="flex items-center gap-2 pl-1">
          <span className="text-[15px]">{emoji}</span>
          <h2 className="text-[13px] font-bold tracking-tight text-[var(--text-primary)]">{title}</h2>
          
          <span
            className="ml-1 flex h-5 min-w-[22px] items-center justify-center rounded-full bg-[var(--badge-bg)] px-1.5 text-[11px] font-bold border border-[var(--border)] text-[var(--text-secondary)]"
          >
            {applications.length}
          </span>
        </div>

        {/* Yeni başvuru ekleme butonu */}
        <button
          onClick={onAddClick}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--badge-bg)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border)]"
          title="Yeni başvuru ekle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      {/* DROPPABLE ALAN */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => {
          const shouldShowAll = isExpanded || snapshot.isDraggingOver
          const visibleApps = shouldShowAll ? applications : applications.slice(0, INITIAL_SHOW_COUNT)
          const hiddenCount = applications.length - INITIAL_SHOW_COUNT

          return (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 space-y-2.5 overflow-y-auto px-2 py-1 transition-colors duration-200 rounded-b-xl ${
                snapshot.isDraggingOver ? 'bg-[var(--accent-subtle)]' : ''
              }`}
            >
              <div className="animate-stagger">
                {visibleApps.map((app, index) => (
                  <Draggable key={app.id} draggableId={app.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`mb-2.5 transition-all ${
                          snapshot.isDragging ? 'rotate-1 scale-102 z-50 opacity-90' : ''
                        }`}
                      >
                        <ApplicationCard
                          application={app}
                          onClick={() => onCardClick(app)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
              </div>
              {provided.placeholder}

              {/* Daha Fazla Göster / Daralt Butonu */}
              {applications.length > INITIAL_SHOW_COUNT && !snapshot.isDraggingOver && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="my-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] py-2 text-xs font-semibold shadow-2xs transition-all hover:bg-[var(--badge-bg)] hover:border-[var(--border-strong)] text-[var(--text-primary)]"
                >
                  {isExpanded ? (
                    <span>👆 Daha Az Göster</span>
                  ) : (
                    <span>👇 +{hiddenCount} Başvuru Daha Göster</span>
                  )}
                </button>
              )}

              {/* Sütun boşken göster */}
              {applications.length === 0 && !snapshot.isDraggingOver && (
                <div className="flex h-28 flex-col items-center justify-center text-center mt-2 border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-surface)]/30">
                  <p className="text-[12px] font-medium text-[var(--text-tertiary)]">Burada başvuru yok</p>
                </div>
              )}

              {/* Her zaman görünecek Ekle butonu */}
              {!snapshot.isDraggingOver && (
                <button
                  onClick={onAddClick}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)]/50 py-2.5 text-[12px] font-semibold text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Başvuru Ekle
                </button>
              )}
            </div>
          )
        }}
      </Droppable>
    </div>
  )
}
