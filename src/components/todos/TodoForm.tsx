'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Link2,
  Save,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Application, TodoCategory, TodoPriority, TodoStatus, TodoTask, TodoTaskFormData } from '@/lib/types'
import { Button } from '@/components/ui/Button'

interface TodoFormProps {
  editingTodo: TodoTask | null
  preselectedApplicationId?: string
  onClose: () => void
  onSave: () => void
}

const PRIORITIES: Array<{ id: TodoPriority; label: string }> = [
  { id: 'low', label: 'Düşük' },
  { id: 'medium', label: 'Orta' },
  { id: 'high', label: 'Yüksek' },
]

const CATEGORIES: Array<{ id: TodoCategory; label: string }> = [
  { id: 'general', label: 'Genel' },
  { id: 'interview', label: 'Mülakat hazırlığı' },
  { id: 'cv', label: 'CV / Portfolyo' },
  { id: 'networking', label: 'Networking' },
]

const STATUSES: Array<{ id: TodoStatus; label: string }> = [
  { id: 'pending', label: 'Bekliyor' },
  { id: 'in_progress', label: 'Devam ediyor' },
  { id: 'completed', label: 'Tamamlandı' },
]

const getLocalDatetime = (isoString?: string | null) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

const fieldClassName = 'h-10 w-full rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-tertiary)]'
const labelClassName = 'mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]'

export default function TodoForm({ editingTodo, preselectedApplicationId, onClose, onSave }: TodoFormProps) {
  const isEditing = Boolean(editingTodo)
  const supabase = useMemo(() => createClient(), [])
  const panelRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applications, setApplications] = useState<Partial<Application>[]>([])
  const [formData, setFormData] = useState<TodoTaskFormData>({
    title: editingTodo?.title || '',
    description: editingTodo?.description || '',
    status: editingTodo?.status || 'pending',
    priority: editingTodo?.priority || 'medium',
    category: editingTodo?.category || 'general',
    due_date: getLocalDatetime(editingTodo?.due_date),
    application_id: editingTodo?.application_id || preselectedApplicationId || '',
    completed_at: editingTodo?.completed_at || null,
  })

  const fetchApplications = useCallback(async () => {
    setApplicationsLoading(true)
    const { data, error: fetchError } = await supabase
      .from('applications')
      .select('id, company_name, position')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Başvuru seçenekleri yüklenemedi. Görevi bağlantısız kaydedebilirsin.')
    } else {
      setApplications(data || [])
    }
    setApplicationsLoading(false)
  }, [supabase])

  useEffect(() => {
    // Initial synchronization for the application selector.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchApplications()
  }, [fetchApplications])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [loading, onClose])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Oturum bulunamadı. Sayfayı yenileyip tekrar deneyebilirsin.')

      const completedAt = formData.status === 'completed'
        ? (editingTodo?.completed_at || new Date().toISOString())
        : null
      const payload = {
        ...formData,
        application_id: formData.application_id || null,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
        user_id: user.id,
      }

      const result = isEditing && editingTodo
        ? await supabase.from('todo_tasks').update(payload).eq('id', editingTodo.id)
        : await supabase.from('todo_tasks').insert([payload])

      if (result.error) throw result.error
      onSave()
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Görev kaydedilemedi. Lütfen tekrar dene.')
      setLoading(false)
    }
  }

  const selectedApplication = applications.find(application => application.id === formData.application_id)

  return (
    <div className="fixed inset-0 z-[140] bg-black/55 backdrop-blur-[2px]" onMouseDown={event => {
      if (event.target === event.currentTarget && !loading) onClose()
    }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="todo-form-title"
        tabIndex={-1}
        className="ml-auto flex h-full w-full max-w-[620px] flex-col border-l border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] outline-none motion-safe:animate-[slideInRight_180ms_ease-out]"
      >
        <header className="flex shrink-0 items-start gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-tertiary)]">
            <ClipboardList aria-hidden="true" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="todo-form-title" className="text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)]">{isEditing ? 'Görevi düzenle' : 'Yeni görev'}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">Görevin kapsamını, zamanını ve ilişkili başvuruyu belirle.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading} aria-label="Görev formunu kapat">
            <X aria-hidden="true" size={18} />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7">
            {error ? (
              <div className="flex items-start gap-2.5 rounded-[10px] border border-[var(--danger)]/25 bg-[var(--danger-subtle)] px-4 py-3 text-xs font-medium leading-5 text-[var(--danger)]" role="alert">
                <AlertCircle aria-hidden="true" size={16} className="mt-0.5 shrink-0" /> {error}
              </div>
            ) : null}

            <section className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardList aria-hidden="true" size={15} className="text-[var(--text-tertiary)]" />
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Görev bilgisi</h3>
              </div>
              <div>
                <label htmlFor="todo-title" className={labelClassName}>Görev başlığı *</label>
                <input id="todo-title" required autoFocus value={formData.title} onChange={event => setFormData(current => ({ ...current, title: event.target.value }))} placeholder="Örn. Görüşme sunumunu hazırla" className={fieldClassName} />
              </div>
              <div className="mt-4">
                <label htmlFor="todo-description" className={labelClassName}>Açıklama</label>
                <textarea id="todo-description" value={formData.description || ''} onChange={event => setFormData(current => ({ ...current, description: event.target.value }))} rows={4} placeholder="Görevin ayrıntıları ve tamamlanma kriteri…" className={`${fieldClassName} h-auto min-h-28 resize-y py-2.5 leading-5`} />
              </div>
            </section>

            <section className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <CalendarClock aria-hidden="true" size={15} className="text-[var(--text-tertiary)]" />
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Planlama</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="todo-priority" className={labelClassName}>Öncelik</label>
                  <select id="todo-priority" value={formData.priority} onChange={event => setFormData(current => ({ ...current, priority: event.target.value as TodoPriority }))} className={fieldClassName}>
                    {PRIORITIES.map(priority => <option key={priority.id} value={priority.id}>{priority.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="todo-category" className={labelClassName}>Kategori</label>
                  <select id="todo-category" value={formData.category} onChange={event => setFormData(current => ({ ...current, category: event.target.value as TodoCategory }))} className={fieldClassName}>
                    {CATEGORIES.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="todo-date" className={labelClassName}>Tarih ve saat</label>
                  <input id="todo-date" type="datetime-local" value={formData.due_date || ''} onChange={event => setFormData(current => ({ ...current, due_date: event.target.value }))} className={fieldClassName} />
                  <p className="mt-1.5 text-[10px] leading-4 text-[var(--text-tertiary)]">Tarihsiz görevler Yaklaşan bölümünde gösterilir.</p>
                </div>
                <div>
                  <label htmlFor="todo-status" className={labelClassName}>Durum</label>
                  <select id="todo-status" value={formData.status} onChange={event => setFormData(current => ({ ...current, status: event.target.value as TodoStatus }))} className={fieldClassName}>
                    {STATUSES.map(status => <option key={status.id} value={status.id}>{status.label}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Link2 aria-hidden="true" size={15} className="text-[var(--text-tertiary)]" />
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Başvuru bağlantısı</h3>
              </div>
              {preselectedApplicationId ? (
                <div className="flex items-center gap-3 rounded-[9px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3">
                  <CheckCircle2 aria-hidden="true" size={16} className="shrink-0 text-[var(--accent)]" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{selectedApplication?.company_name || 'Seçili başvuru'}</p>
                    {selectedApplication?.position ? <p className="mt-0.5 truncate text-[11px] text-[var(--text-tertiary)]">{selectedApplication.position}</p> : null}
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="todo-application" className={labelClassName}>İş başvurusu</label>
                  <select id="todo-application" value={formData.application_id || ''} onChange={event => setFormData(current => ({ ...current, application_id: event.target.value }))} disabled={applicationsLoading} className={fieldClassName}>
                    <option value="">Bağlantı yok</option>
                    {applications.map(application => <option key={application.id} value={application.id}>{application.company_name} — {application.position}</option>)}
                  </select>
                  <p className="mt-1.5 text-[10px] leading-4 text-[var(--text-tertiary)]">{applicationsLoading ? 'Başvurular yükleniyor…' : 'Görevi ilgili başvurunun detayında da görebilirsin.'}</p>
                </div>
              )}
            </section>
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-4 sm:px-7">
            <Button variant="secondary" onClick={onClose} disabled={loading}>İptal</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? null : <Save aria-hidden="true" size={15} />}
              {loading ? 'Kaydediliyor…' : isEditing ? 'Değişiklikleri kaydet' : 'Görevi ekle'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  )
}
