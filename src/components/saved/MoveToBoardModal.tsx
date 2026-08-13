'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, Check, CheckCircle2, X } from 'lucide-react'
import { SavedJob } from '@/lib/types'
import { useStatuses } from '@/hooks/useStatuses'
import { Button } from '@/components/ui/Button'

interface MoveToBoardModalProps {
  job: SavedJob
  onClose: () => void
  onConfirm: (statusId: string) => void
  isSubmitting?: boolean
}

export default function MoveToBoardModal({ job, onClose, onConfirm, isSubmitting = false }: MoveToBoardModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const { statuses, loading } = useStatuses()
  const [selectedStatus, setSelectedStatus] = useState('')
  const completedSteps = [job.is_cv_updated, job.is_message_drafted, job.is_applied].filter(Boolean).length
  const isReady = completedSteps === 3
  const sortedStatuses = useMemo(
    () => [...statuses].sort((first, second) => first.order_index - second.order_index),
    [statuses]
  )

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSubmitting, onClose])

  return (
    <div onMouseDown={event => event.target === event.currentTarget && !isSubmitting && onClose()} className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="move-to-board-title" tabIndex={-1} className="my-auto w-full max-w-lg overflow-hidden rounded-[14px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] outline-none">
        <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-[9px] border ${isReady ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border-amber-500/20 bg-amber-500/10 text-amber-500'}`}>
              {isReady ? <CheckCircle2 aria-hidden="true" size={18} /> : <AlertCircle aria-hidden="true" size={18} />}
            </span>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${isReady ? 'text-emerald-500' : 'text-amber-500'}`}>
                {isReady ? 'Başvuruya hazır' : `${completedSteps}/3 hazırlık tamamlandı`}
              </p>
              <h2 id="move-to-board-title" className="mt-0.5 text-base font-bold tracking-[-0.02em] text-[var(--text-primary)]">Panoya taşı</h2>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting} aria-label="Pencereyi kapat">
            <X aria-hidden="true" size={17} />
          </Button>
        </div>

        <div className="p-5">
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            <strong className="font-semibold text-[var(--text-primary)]">{job.company_name}</strong> · {job.position}
          </p>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            {isReady
              ? 'Başvuruyu panoda hangi aşamada başlatmak istediğini seç.'
              : 'Hazırlık adımları tamamlanmadı. Yine de ilanı panoya taşıyabilirsin.'}
          </p>

          <div className="mt-5">
            <p id="target-status-label" className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">Hedef durum</p>
            <div role="radiogroup" aria-labelledby="target-status-label" className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <div className="h-12 animate-pulse rounded-[9px] bg-[var(--bg-column)]" />
              ) : sortedStatuses.length === 0 ? (
                <div className="rounded-[9px] border border-dashed border-[var(--border-strong)] px-3 py-4 text-center text-sm text-[var(--text-tertiary)]">
                  Kullanılabilir pano durumu bulunamadı.
                </div>
              ) : sortedStatuses.map(status => {
                const isSelected = selectedStatus === status.id

                return (
                  <button
                    key={status.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedStatus(status.id)}
                    disabled={isSubmitting}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-[9px] border px-3 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--text-primary)]'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <span className="text-base" aria-hidden="true">{status.emoji}</span>
                    <span className="min-w-0 flex-1 truncate">{status.title}</span>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--input-border)] text-transparent'}`}>
                      <Check aria-hidden="true" size={12} strokeWidth={3} />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Vazgeç</Button>
            <Button variant="primary" onClick={() => selectedStatus && onConfirm(selectedStatus)} disabled={!selectedStatus || loading || isSubmitting}>
              {isSubmitting ? 'Panoya ekleniyor...' : 'Panoya taşı'}
              <ArrowRight aria-hidden="true" size={15} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
