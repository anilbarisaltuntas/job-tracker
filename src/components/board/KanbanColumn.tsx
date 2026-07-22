'use client'

/**
 * KANBAN COLUMN — Bir Kanban Sütunu
 * 
 * Droppable → Bu alan kartların "bırakılabileceği" bir hedeftir.
 * İçinde ApplicationCard'ları listeler.
 * 
 * Props açıklaması:
 * - columnId: durum kodu (ör: 'applied_message_sent')
 * - title: Türkçe başlık (ör: 'Başvuruldu - Mesaj Atıldı')
 * - emoji: sütun ikonu
 * - color: üst çizgi rengi
 * - bgColor: arka plan rengi
 * - applications: bu sütundaki başvurular
 * - onCardClick: kart tıklanınca çağrılır
 * - onAddClick: "Ekle" butonuna tıklanınca çağrılır
 */

import { Droppable, Draggable } from '@hello-pangea/dnd'
import { Application } from '@/lib/types'
import ApplicationCard from './ApplicationCard'

interface KanbanColumnProps {
  columnId: string
  title: string
  emoji: string
  applications: Application[]
  onCardClick: (application: Application) => void
  onAddClick: () => void
}

export default function KanbanColumn({
  columnId,
  title,
  emoji,
  applications,
  onCardClick,
  onAddClick,
}: KanbanColumnProps) {
  return (
    <div className="flex h-[400px] w-full flex-col">
      {/* Sütun başlığı */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">{emoji}</span>
          <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          {/* Başvuru sayısı badge'i */}
          <span
            className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium"
            style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}
          >
            {applications.length}
          </span>
        </div>

        {/* Yeni başvuru ekleme butonu */}
        <button
          onClick={onAddClick}
          className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          title="Yeni başvuru ekle"
        >
          +
        </button>
      </div>

      {/* DROPPABLE ALAN */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 overflow-y-auto rounded-xl p-1 transition-colors ${
              snapshot.isDraggingOver ? 'bg-white/[0.02]' : ''
            }`}
          >
            {applications.map((app, index) => (
              /*
                DRAGGABLE — Sürüklenebilir Eleman
                
                draggableId → her kartın benzersiz kimliği
                index → sütun içindeki sırası
                
                provided.draggableProps → sürükleme için gerekli özellikler
                provided.dragHandleProps → "tutma noktası" (tüm karta uyguladık)
              */
              <Draggable key={app.id} draggableId={app.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`transition-transform ${
                      snapshot.isDragging ? 'rotate-2 scale-105' : ''
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
            {provided.placeholder}

            {/* Sütun boşken göster */}
            {applications.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Henüz başvuru yok</p>
                <button
                  onClick={onAddClick}
                  className="mt-2 text-xs text-blue-500 hover:text-blue-400"
                >
                  + Başvuru Ekle
                </button>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
