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
  color: string
  bgColor: string
  applications: Application[]
  onCardClick: (application: Application) => void
  onAddClick: () => void
}

export default function KanbanColumn({
  columnId,
  title,
  emoji,
  color,
  bgColor,
  applications,
  onCardClick,
  onAddClick,
}: KanbanColumnProps) {
  return (
    <div className="flex h-full w-[320px] min-w-[320px] flex-col rounded-xl border border-slate-700/50 bg-slate-800/50">
      {/* Sütun başlığı */}
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {/* Başvuru sayısı badge'i */}
          <span
            className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {applications.length}
          </span>
        </div>

        {/* Yeni başvuru ekleme butonu */}
        <button
          onClick={onAddClick}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          title="Yeni başvuru ekle"
        >
          +
        </button>
      </div>

      {/* 
        DROPPABLE ALAN
        
        Droppable, @hello-pangea/dnd'nin "bırakılabilir alan" bileşeni.
        droppableId → bu sütunun benzersiz kimliği (durum kodu)
        
        "render props" pattern'i kullanır:
        (provided, snapshot) => ... şeklinde bir fonksiyon alır.
        - provided.innerRef → DOM referansı (kütüphanenin elementi bulması için)
        - provided.droppableProps → gerekli HTML özellikleri
        - provided.placeholder → sürüklenen kartın boşluğunu tutar
        - snapshot.isDraggingOver → üzerine kart sürükleniyor mu?
      */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 overflow-y-auto p-3 transition-colors ${
              snapshot.isDraggingOver ? 'bg-slate-700/30' : ''
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
                <p className="text-sm text-slate-500">Henüz başvuru yok</p>
                <button
                  onClick={onAddClick}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
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
