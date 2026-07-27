'use client'

/**
 * KANBAN COLUMN — WOW Design
 * 
 * Droppable → Bu alan kartların "bırakılabileceği" bir hedeftir.
 * İçinde ApplicationCard'ları listeler.
 */

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
  return (
    <div className="flex h-[550px] w-full flex-col rounded-3xl p-3 shadow-[inset_0_4px_20px_rgba(0,0,0,0.1)] backdrop-blur-md"
         style={{ backgroundColor: 'var(--bg-surface)' }}>
      
      {/* Sütun başlığı */}
      <div className="mb-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20 text-sm shadow-sm backdrop-blur-lg">
            {emoji}
          </span>
          <h2 className="text-[14px] font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          
          <span
            className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] px-1.5 text-[11px] font-extrabold text-white shadow-[0_0_8px_var(--glow-color)]"
          >
            {applications.length}
          </span>
        </div>

        {/* Yeni başvuru ekleme butonu */}
        <button
          onClick={onAddClick}
          className="group flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-elevated)] transition-all hover:scale-110 hover:bg-gradient-to-r hover:from-[var(--accent)] hover:to-[var(--accent-secondary)] hover:shadow-[0_0_12px_var(--glow-color)]"
          style={{ border: '1px solid var(--border)' }}
          title="Yeni başvuru ekle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)] group-hover:text-white transition-colors">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      {/* DROPPABLE ALAN */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 overflow-y-auto rounded-2xl p-2 transition-all duration-300 ${
              snapshot.isDraggingOver ? 'bg-[var(--accent-subtle)] shadow-[inset_0_0_20px_var(--glow-accent)]' : ''
            }`}
          >
            <div className="animate-stagger">
              {applications.map((app, index) => (
                <Draggable key={app.id} draggableId={app.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`mb-3 transition-transform ${
                        snapshot.isDragging ? 'rotate-2 scale-105 z-50 shadow-2xl' : ''
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

            {/* Sütun boşken göster */}
            {applications.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-surface-hover)] text-center">
                <p className="text-[13px] font-medium opacity-60" style={{ color: 'var(--text-tertiary)' }}>Buraya Bırak</p>
              </div>
            )}

            {/* Her zaman görünecek Ekle butonu */}
            {!snapshot.isDraggingOver && (
              <button
                onClick={onAddClick}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-[12px] font-bold transition-all hover:scale-[1.02] hover:border-transparent hover:bg-gradient-to-r hover:from-[var(--accent)] hover:to-[var(--accent-secondary)] hover:text-white hover:shadow-[0_0_15px_var(--glow-color)]"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-strong)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Başvuru Ekle
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
