'use client'

import { useState } from 'react'
import { SavedJob } from '@/lib/types'
import { useStatuses } from '@/hooks/useStatuses'

interface MoveToBoardModalProps {
  job: SavedJob
  onClose: () => void
  onConfirm: (statusId: string) => void
}

export default function MoveToBoardModal({ job, onClose, onConfirm }: MoveToBoardModalProps) {
  const { statuses, loading } = useStatuses()
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  // Sütunları sıralı göster
  const sortedStatuses = [...statuses].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div 
        className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold text-green-500">
            🎉 Tebrikler!
          </h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-500/10" style={{ color: 'var(--text-tertiary)' }}>
            ✕
          </button>
        </div>

        <div className="p-6">
          <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>{job.company_name}</strong> için hazırlıkları tamamladınız. 
            Bu ilanı panoda hangi sütuna taşımak istersiniz?
          </p>

          {loading ? (
            <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>Sütunlar yükleniyor...</p>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Panodaki Hedef Statü</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="" disabled>Statü Seçin...</option>
                {sortedStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.emoji} {status.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-500/10"
              style={{ color: 'var(--text-tertiary)' }}
            >
              İptal
            </button>
            <button
              onClick={() => selectedStatus && onConfirm(selectedStatus)}
              disabled={!selectedStatus}
              className="rounded-xl px-5 py-2 text-sm font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
            >
              Panoya Taşı
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
