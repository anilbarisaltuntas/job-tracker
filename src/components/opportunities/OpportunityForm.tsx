'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type {
  Opportunity,
  OpportunityFormData,
  OpportunityStatus,
} from '@/lib/types'
import {
  OPPORTUNITY_FORMATS,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TYPES,
} from '@/lib/opportunity-options'
import { Button } from '@/components/ui/Button'

interface OpportunityFormProps {
  opportunity?: Opportunity | null
  defaultStatus: OpportunityStatus
  onClose: () => void
  onSaved: () => void
  onDelete?: (opportunity: Opportunity) => Promise<void>
}

function initialFormData(opportunity: Opportunity | null | undefined, defaultStatus: OpportunityStatus): OpportunityFormData {
  return {
    title: opportunity?.title ?? '',
    organizer: opportunity?.organizer ?? '',
    opportunity_type: opportunity?.opportunity_type ?? 'networking_event',
    event_format: opportunity?.event_format ?? 'online',
    status: opportunity?.status ?? defaultStatus,
    event_date: opportunity?.event_date ?? '',
    application_date: opportunity?.application_date ?? '',
    location: opportunity?.location ?? '',
    opportunity_url: opportunity?.opportunity_url ?? '',
    notes: opportunity?.notes ?? '',
  }
}

function normalizeUrl(value: string) {
  const candidate = value.trim()
  if (!candidate) return null
  const url = new URL(candidate.includes('://') ? candidate : `https://${candidate}`)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid-protocol')
  return url.toString()
}

const fieldClassName = 'h-10 w-full rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-border)] focus:ring-2 focus:ring-[var(--accent-subtle)]'
const labelClassName = 'mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]'

export default function OpportunityForm({
  opportunity,
  defaultStatus,
  onClose,
  onSaved,
  onDelete,
}: OpportunityFormProps) {
  const supabase = useMemo(() => createClient(), [])
  const [formData, setFormData] = useState(() => initialFormData(opportunity, defaultStatus))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [loading, onClose])

  const setField = <Key extends keyof OpportunityFormData>(key: Key, value: OpportunityFormData[Key]) => {
    setFormData(current => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    let opportunityUrl: string | null
    try {
      opportunityUrl = normalizeUrl(formData.opportunity_url || '')
    } catch {
      setError('Bağlantı geçerli bir web adresi olmalı.')
      setLoading(false)
      return
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      setError('Oturum doğrulanamadı. Sayfayı yenileyip tekrar dene.')
      setLoading(false)
      return
    }

    const payload = {
      title: formData.title.trim(),
      organizer: formData.organizer.trim(),
      opportunity_type: formData.opportunity_type,
      event_format: formData.event_format,
      status: formData.status,
      event_date: formData.event_date || null,
      application_date: formData.application_date || null,
      location: formData.location?.trim() || null,
      opportunity_url: opportunityUrl,
      notes: formData.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const result = opportunity
      ? await supabase.from('opportunities').update(payload).eq('id', opportunity.id).eq('user_id', user.id).select('id').single()
      : await supabase.from('opportunities').insert({ ...payload, user_id: user.id, kanban_order: 0 }).select('id').single()

    if (result.error) {
      setError('Program kaydedilemedi. Bilgileri kontrol edip tekrar dene.')
      setLoading(false)
      return
    }

    onSaved()
  }

  const handleDelete = async () => {
    if (!opportunity || !onDelete) return
    setLoading(true)
    setError(null)
    try {
      await onDelete(opportunity)
    } catch {
      setError('Program silinemedi. Lütfen tekrar dene.')
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/55" onMouseDown={event => { if (event.target === event.currentTarget && !loading) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="opportunity-form-title" className="flex h-full w-full max-w-2xl flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[var(--accent-subtle)] text-[var(--accent-strong)]">
              <Sparkles aria-hidden="true" size={17} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Programlar</p>
              <h2 id="opportunity-form-title" className="text-base font-bold text-[var(--text-primary)]">{opportunity ? 'Programı düzenle' : 'Yeni program'}</h2>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading} aria-label="Program formunu kapat">
            <X aria-hidden="true" size={18} />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7">
            {error ? <div className="rounded-[9px] border border-[var(--danger)]/20 bg-[var(--danger-subtle)] px-4 py-3 text-sm font-medium text-[var(--danger)]" role="alert">{error}</div> : null}

            <section className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles aria-hidden="true" size={15} className="text-[var(--text-tertiary)]" />
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Temel bilgiler</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="opportunity-title" className={labelClassName}>Program veya etkinlik adı *</label>
                  <input id="opportunity-title" autoFocus required maxLength={160} value={formData.title} onChange={event => setField('title', event.target.value)} placeholder="ör: Product Meetup İstanbul" className={fieldClassName} />
                </div>
                <div>
                  <label htmlFor="opportunity-organizer" className={labelClassName}>Düzenleyen kurum *</label>
                  <input id="opportunity-organizer" required maxLength={160} value={formData.organizer} onChange={event => setField('organizer', event.target.value)} placeholder="ör: ProductTank" className={fieldClassName} />
                </div>
                <div>
                  <label htmlFor="opportunity-type" className={labelClassName}>Tür</label>
                  <select id="opportunity-type" value={formData.opportunity_type} onChange={event => setField('opportunity_type', event.target.value as OpportunityFormData['opportunity_type'])} className={fieldClassName}>
                    {OPPORTUNITY_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="opportunity-status" className={labelClassName}>Statü</label>
                  <select id="opportunity-status" value={formData.status} onChange={event => setField('status', event.target.value as OpportunityStatus)} className={fieldClassName}>
                    {OPPORTUNITY_STATUSES.map(status => <option key={status.id} value={status.id}>{status.title}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="opportunity-format" className={labelClassName}>Katılım şekli</label>
                  <select id="opportunity-format" value={formData.event_format} onChange={event => setField('event_format', event.target.value as OpportunityFormData['event_format'])} className={fieldClassName}>
                    {OPPORTUNITY_FORMATS.map(format => <option key={format.value} value={format.value}>{format.label}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays aria-hidden="true" size={15} className="text-[var(--text-tertiary)]" />
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Tarih ve konum</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="opportunity-event-date" className={labelClassName}>Etkinlik / başlangıç tarihi</label>
                  <input id="opportunity-event-date" type="date" value={formData.event_date || ''} onChange={event => setField('event_date', event.target.value)} className={fieldClassName} />
                </div>
                <div>
                  <label htmlFor="opportunity-application-date" className={labelClassName}>Başvuru tarihi</label>
                  <input id="opportunity-application-date" type="date" value={formData.application_date || ''} onChange={event => setField('application_date', event.target.value)} className={fieldClassName} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="opportunity-location" className={labelClassName}>Konum</label>
                  <div className="relative">
                    <MapPin aria-hidden="true" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input id="opportunity-location" value={formData.location || ''} onChange={event => setField('location', event.target.value)} placeholder="ör: İstanbul, Maslak" className={`${fieldClassName} pl-9`} />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <ExternalLink aria-hidden="true" size={15} className="text-[var(--text-tertiary)]" />
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Bağlantı ve notlar</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="opportunity-url" className={labelClassName}>Program / etkinlik bağlantısı</label>
                  <input id="opportunity-url" inputMode="url" value={formData.opportunity_url || ''} onChange={event => setField('opportunity_url', event.target.value)} placeholder="https://..." className={fieldClassName} />
                </div>
                <div>
                  <label htmlFor="opportunity-notes" className={labelClassName}>Notlar</label>
                  <textarea id="opportunity-notes" rows={5} value={formData.notes || ''} onChange={event => setField('notes', event.target.value)} placeholder="Başvuru koşulları, görüşme notları veya etkinlikten beklentilerin..." className={`${fieldClassName} h-auto resize-y py-2.5 leading-6`} />
                </div>
              </div>
            </section>
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--bg-header)] px-5 py-4 sm:px-7">
            {opportunity && onDelete ? (
              <Button variant="ghost" size="sm" className="!text-[var(--danger)]" onClick={() => setShowDeleteConfirm(true)} disabled={loading}>
                <Trash2 aria-hidden="true" size={14} /> Sil
              </Button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose} disabled={loading}>Vazgeç</Button>
              <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Kaydediliyor...' : opportunity ? 'Değişiklikleri kaydet' : 'Programı ekle'}</Button>
            </div>
          </footer>
        </form>
      </div>

      {showDeleteConfirm && opportunity ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/65 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="opportunity-delete-title" aria-describedby="opportunity-delete-description" className="w-full max-w-sm rounded-[14px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-lg)]">
            <h2 id="opportunity-delete-title" className="text-base font-bold text-[var(--text-primary)]">Programı sil?</h2>
            <p id="opportunity-delete-description" className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">“{opportunity.title}” kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={loading} autoFocus>Vazgeç</Button>
              <Button variant="danger" onClick={() => void handleDelete()} disabled={loading}><Trash2 aria-hidden="true" size={15} /> Evet, sil</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
