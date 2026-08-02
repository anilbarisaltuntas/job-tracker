'use client'

/**
 * KANBAN COLUMN — Modern Minimalist Design (Fixed Height + Smart Expand/Collapse)
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

const INITIAL_SHOW_COUNT = 5

export default function KanbanColumn({
  columnId,
  title,
  emoji,
  applications,
  color = '#2563EB',
  bgColor = '#EFF6FF',
  onCardClick,
  onAddClick,
}: KanbanColumnProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="flex max-h-[calc(100vh-210px)] min-h-[280px] w-full flex-col rounded-xl border border-transparent bg-[var(--bg-column)] transition-colors hover:border-[var(--border)] overflow-hidden">
      
      {/* Sütun başlığı */}
      <div className="m-2 mb-2 flex shrink-0 items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[15px] opacity-70 grayscale">{emoji}</span>
          <h2 className="text-[14px] font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          
          <span
            className="ml-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--badge-bg)] px-1.5 text-[11px] font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            {applications.length}
          </span>
        </div>

        {/* Yeni başvuru ekleme butonu */}
        <button
          onClick={onAddClick}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          title="Yeni başvuru ekle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              className={`flex-1 space-y-2 overflow-y-auto px-2 py-1 transition-colors duration-200 rounded-b-lg ${
                snapshot.isDraggingOver ? 'bg-[var(--badge-bg)]' : ''
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
                        className={`mb-2 transition-all ${
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
                  className="my-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-2 text-xs font-semibold shadow-sm transition-all hover:bg-[var(--badge-bg)]"
                  style={{ color: 'var(--text-primary)' }}
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
                <div className="flex h-24 flex-col items-center justify-center text-center mt-2">
                  <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Burada başvuru yok</p>
                </div>
              )}

              {/* Her zaman görünecek Ekle butonu */}
              {!snapshot.isDraggingOver && (
                <button
                  onClick={onAddClick}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-md py-2 text-[11px] font-medium transition-colors hover:bg-[var(--badge-bg)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
