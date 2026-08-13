'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckSquare2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  History,
  Link2,
  Mail,
  MessageSquare,
  NotebookPen,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { Application, ApplicationHistory, TodoTask, UserStatus } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import CompanyLogo from '@/components/ui/CompanyLogo'
import TodoForm from '@/components/todos/TodoForm'
import { APPLICATION_SOURCES, KANBAN_COLUMNS } from '@/lib/constants'

interface ApplicationDetailProps {
  application: Application
  statuses: UserStatus[]
  onClose: () => void
  onEdit: (app: Application) => void
  onDelete: (appId: string) => void
}

type DetailTab = 'summary' | 'contacts' | 'notes' | 'tasks'

interface HistoryDisplayItem {
  id: string
  label: string
  createdAt: string
  changeCount: number
  isReverted: boolean
}

const TABS: Array<{ id: DetailTab; label: string; icon: typeof FileText }> = [
  { id: 'summary', label: 'Özet', icon: FileText },
  { id: 'contacts', label: 'Kişiler', icon: UsersRound },
  { id: 'notes', label: 'Notlar', icon: NotebookPen },
  { id: 'tasks', label: 'Görevler', icon: CheckSquare2 },
]

const matchLabels = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
}

const matchStyles = {
  low: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  medium: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  high: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
}

function formatDate(date: string | null, includeTime = false) {
  if (!date) return 'Belirtilmedi'

  return new Date(date).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

function getStatusTitle(statusId: string | null, statuses: UserStatus[]) {
  if (!statusId) return 'Bilinmeyen durum'

  const currentStatus = statuses.find(status => status.id === statusId)
  if (currentStatus) return currentStatus.title

  const legacyStatus = KANBAN_COLUMNS.find(status => status.id === statusId)
  if (legacyStatus) return legacyStatus.title

  return statusId
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
    .join(' ')
}

function buildHistoryDisplay(history: ApplicationHistory[], statuses: UserStatus[]): HistoryDisplayItem[] {
  const displayItems: HistoryDisplayItem[] = []

  for (let index = 0; index < history.length;) {
    const item = history[index]

    if (item.event_type !== 'STATUS_CHANGED') {
      displayItems.push({
        id: item.id,
        label: item.description,
        createdAt: item.created_at,
        changeCount: 1,
        isReverted: false,
      })
      index += 1
      continue
    }

    const minuteKey = item.created_at.slice(0, 16)
    const group: ApplicationHistory[] = []

    while (
      index < history.length &&
      history[index].event_type === 'STATUS_CHANGED' &&
      history[index].created_at.slice(0, 16) === minuteKey
    ) {
      group.push(history[index])
      index += 1
    }

    const newestChange = group[0]
    const oldestChange = group[group.length - 1]
    const initialStatus = oldestChange.old_status
    const finalStatus = newestChange.new_status
    const isReverted = group.length > 1 && initialStatus === finalStatus

    displayItems.push({
      id: newestChange.id,
      label: isReverted
        ? `${getStatusTitle(finalStatus, statuses)} durumuna geri dönüldü`
        : `${getStatusTitle(initialStatus, statuses)} → ${getStatusTitle(finalStatus, statuses)}`,
      createdAt: newestChange.created_at,
      changeCount: group.length,
      isReverted,
    })
  }

  return displayItems
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof FileText; title: string; description: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-[12px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]/55 px-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)]">
        <Icon aria-hidden="true" size={18} />
      </div>
      <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--text-tertiary)]">{description}</p>
    </div>
  )
}

export default function ApplicationDetail({
  application,
  statuses,
  onClose,
  onEdit,
  onDelete,
}: ApplicationDetailProps) {
  const supabase = useMemo(() => createClient(), [])
  const panelRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('summary')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [history, setHistory] = useState<ApplicationHistory[]>([])
  const [tasks, setTasks] = useState<TodoTask[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [isTodoFormOpen, setIsTodoFormOpen] = useState(false)

  const status = statuses.find(item => item.id === application.status)
  const contacts = application.contacts || []
  const sourceLabel = APPLICATION_SOURCES.find(source => source.value === application.source)?.label || application.source || 'Belirtilmedi'
  const historyDisplay = useMemo(() => buildHistoryDisplay(history, statuses), [history, statuses])
  const visibleHistory = historyDisplay.slice(0, 6)

  const fetchRelatedData = useCallback(async () => {
    setDataLoading(true)
    setDataError(null)

    const [historyResult, tasksResult] = await Promise.all([
      supabase
        .from('application_history')
        .select('*')
        .eq('application_id', application.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('todo_tasks')
        .select('*')
        .eq('application_id', application.id)
        .order('due_date', { ascending: true, nullsFirst: false }),
    ])

    if (historyResult.error || tasksResult.error) {
      setDataError('Geçmiş veya görev bilgileri yüklenemedi.')
    }

    setHistory(historyResult.data || [])
    setTasks(tasksResult.data || [])
    setDataLoading(false)
  }, [application.id, supabase])

  useEffect(() => {
    // Initial synchronization with the application's related remote records.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRelatedData()
  }, [fetchRelatedData])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (showDeleteConfirm) {
        setShowDeleteConfirm(false)
        return
      }
      if (!isTodoFormOpen) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isTodoFormOpen, onClose, showDeleteConfirm])

  const handleToggleTaskStatus = async (task: TodoTask) => {
    const previousTasks = tasks
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
    const completedAt = nextStatus === 'completed' ? new Date().toISOString() : null

    setTasks(current => current.map(item =>
      item.id === task.id ? { ...item, status: nextStatus, completed_at: completedAt } : item
    ))

    const { error } = await supabase
      .from('todo_tasks')
      .update({ status: nextStatus, completed_at: completedAt, updated_at: new Date().toISOString() })
      .eq('id', task.id)

    if (error) {
      setTasks(previousTasks)
      setDataError('Görev durumu güncellenemedi. Değişiklik geri alındı.')
    }
  }

  const pendingTasks = tasks.filter(task => task.status !== 'completed')
  const completedTasks = tasks.filter(task => task.status === 'completed')

  return (
    <div className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-[2px]" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-detail-title"
        tabIndex={-1}
        className="ml-auto flex h-full w-full max-w-[760px] flex-col border-l border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] outline-none motion-safe:animate-[slideInRight_180ms_ease-out]"
      >
        <header className="shrink-0 border-b border-[var(--border)] px-5 pb-0 pt-5 sm:px-7 sm:pt-6">
          <div className="flex items-start gap-4">
            <CompanyLogo companyName={application.company_name} companyDomain={application.company_domain} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--badge-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                  <span aria-hidden="true">{status?.emoji}</span>
                  {status?.title || application.status}
                </span>
                <span className="text-[11px] font-medium text-[var(--text-tertiary)]">{formatDate(application.application_date)}</span>
              </div>
              <h2 id="application-detail-title" className="mt-3 truncate text-xl font-bold tracking-[-0.025em] text-[var(--text-primary)] sm:text-2xl">
                {application.company_name}
              </h2>
              <p className="mt-1 truncate text-sm font-medium text-[var(--text-secondary)] sm:text-base">{application.position}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Detay panelini kapat">
              <X aria-hidden="true" size={18} />
            </Button>
          </div>

          <div className="mt-5 overflow-x-auto" role="tablist" aria-label="Başvuru detay bölümleri">
            <div className="flex min-w-max gap-1">
              {TABS.map(tab => {
                const Icon = tab.icon
                const count = tab.id === 'contacts' ? contacts.length : tab.id === 'tasks' ? tasks.length : null
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`panel-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex h-10 items-center gap-2 px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)] ${
                      activeTab === tab.id
                        ? 'text-[var(--text-primary)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--accent)]'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon aria-hidden="true" size={15} />
                    {tab.label}
                    {count !== null ? <span className="rounded-full bg-[var(--badge-bg)] px-1.5 py-0.5 text-[10px]">{count}</span> : null}
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {dataError ? (
            <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-[var(--danger)]/25 bg-[var(--danger-subtle)] px-4 py-3 text-xs font-medium text-[var(--danger)]" role="alert">
              <AlertTriangle aria-hidden="true" size={16} />
              {dataError}
            </div>
          ) : null}

          {activeTab === 'summary' ? (
            <section id="panel-summary" role="tabpanel" aria-labelledby="tab-summary" className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                    <CalendarDays aria-hidden="true" size={14} /> Başvuru tarihi
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{formatDate(application.application_date)}</p>
                </div>
                <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                    <Clock3 aria-hidden="true" size={14} /> Takip tarihi
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{formatDate(application.follow_up_date)}</p>
                </div>
                <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                    <BriefcaseBusiness aria-hidden="true" size={14} /> Uyum seviyesi
                  </div>
                  <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${matchStyles[application.match_level]}`}>
                    {matchLabels[application.match_level]}
                  </span>
                </div>
                <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                    <Link2 aria-hidden="true" size={14} /> Kaynak
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{sourceLabel}</p>
                </div>
              </div>

              {(application.job_url || application.cv_file_url || application.cv_version) ? (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Bağlantılar ve dosyalar</h3>
                  <div className="mt-3 divide-y divide-[var(--border)] overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)]">
                    {application.job_url ? (
                      <a href={application.job_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface-hover)]">
                        <ExternalLink aria-hidden="true" size={16} className="text-[var(--text-tertiary)]" />
                        İlanı görüntüle
                        <ExternalLink aria-hidden="true" size={13} className="ml-auto text-[var(--text-tertiary)]" />
                      </a>
                    ) : null}
                    {(application.cv_file_url || application.cv_version) ? (
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <FileText aria-hidden="true" size={16} className="text-[var(--text-tertiary)]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{application.cv_version || 'Yüklenen CV'}</p>
                          <p className="text-[11px] text-[var(--text-tertiary)]">Bu başvuruda kullanılan özgeçmiş</p>
                        </div>
                        {application.cv_file_url ? (
                          <a href={application.cv_file_url} target="_blank" rel="noopener noreferrer" className="flex h-8 items-center gap-1.5 rounded-[7px] border border-[var(--border)] px-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
                            <Download aria-hidden="true" size={13} /> Aç
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="flex items-center gap-2">
                  <History aria-hidden="true" size={15} className="text-[var(--text-tertiary)]" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Başvuru geçmişi</h3>
                </div>
                {dataLoading ? (
                  <div className="mt-3 space-y-2" aria-label="Geçmiş yükleniyor">
                    <div className="h-14 animate-pulse rounded-[10px] bg-[var(--bg-surface)]" />
                    <div className="h-14 animate-pulse rounded-[10px] bg-[var(--bg-surface)]" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="mt-3 rounded-[10px] border border-dashed border-[var(--border)] px-4 py-5 text-center text-xs text-[var(--text-tertiary)]">Henüz geçmiş kaydı yok.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {visibleHistory.map(item => (
                      <div key={item.id} className="flex gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.isReverted ? 'bg-[var(--text-tertiary)]' : 'bg-[var(--accent)]'}`} aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold leading-5 text-[var(--text-primary)]">{item.label}</p>
                            {item.changeCount > 1 ? (
                              <span className="rounded-full bg-[var(--badge-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-tertiary)]">{item.changeCount} hareket</span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">{formatDate(item.createdAt, true)}</p>
                        </div>
                      </div>
                    ))}
                    {historyDisplay.length > visibleHistory.length ? (
                      <p className="pt-1 text-center text-[10px] font-medium text-[var(--text-tertiary)]">En son {visibleHistory.length} değişiklik grubu gösteriliyor.</p>
                    ) : null}
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === 'contacts' ? (
            <section id="panel-contacts" role="tabpanel" aria-labelledby="tab-contacts">
              {contacts.length === 0 ? (
                <EmptyState icon={UsersRound} title="İletişim kişisi yok" description="Bu başvuruya kişi eklemek için düzenleme ekranını kullanabilirsin." />
              ) : (
                <div className="space-y-3">
                  {contacts.map(contact => (
                    <article key={contact.id} className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)]">
                          <UserRound aria-hidden="true" size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[var(--text-primary)]">{contact.name}</p>
                          <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">{contact.role || 'Rol belirtilmedi'}</p>
                          <div className="mt-2 space-y-1.5">
                            {contact.email ? (
                              <a href={`mailto:${contact.email}`} className="flex w-fit items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline">
                                <Mail aria-hidden="true" size={13} /> {contact.email}
                              </a>
                            ) : null}
                            {contact.phone ? (
                              <a href={`tel:${contact.phone}`} className="flex w-fit items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline">
                                <Phone aria-hidden="true" size={13} /> {contact.phone}
                              </a>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {contact.linkedin_url ? (
                            <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]" aria-label={`${contact.name} LinkedIn profilini aç`}>
                              <ExternalLink aria-hidden="true" size={15} />
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--badge-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                          <MessageSquare aria-hidden="true" size={12} /> {contact.message_sent ? `Mesaj gönderildi${contact.message_date ? ` · ${formatDate(contact.message_date)}` : ''}` : 'Mesaj bekliyor'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--badge-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                          <Mail aria-hidden="true" size={12} /> {contact.email_sent ? `E-posta gönderildi${contact.email_date ? ` · ${formatDate(contact.email_date)}` : ''}` : 'E-posta bekliyor'}
                        </span>
                      </div>
                      {contact.notes ? <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">{contact.notes}</p> : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === 'notes' ? (
            <section id="panel-notes" role="tabpanel" aria-labelledby="tab-notes">
              {application.notes ? (
                <div className="tiptap-editor rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 text-sm leading-6 text-[var(--text-secondary)]" dangerouslySetInnerHTML={{ __html: application.notes }} />
              ) : (
                <EmptyState icon={NotebookPen} title="Henüz not eklenmemiş" description="Görüşme hazırlıkları ve önemli ayrıntıları düzenleme ekranından ekleyebilirsin." />
              )}
            </section>
          ) : null}

          {activeTab === 'tasks' ? (
            <section id="panel-tasks" role="tabpanel" aria-labelledby="tab-tasks">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Başvuru görevleri</h3>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{pendingTasks.length} açık, {completedTasks.length} tamamlandı</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setIsTodoFormOpen(true)}>
                  <Plus aria-hidden="true" size={14} /> Görev ekle
                </Button>
              </div>
              {dataLoading ? (
                <div className="space-y-2" aria-label="Görevler yükleniyor">
                  <div className="h-14 animate-pulse rounded-[10px] bg-[var(--bg-surface)]" />
                  <div className="h-14 animate-pulse rounded-[10px] bg-[var(--bg-surface)]" />
                </div>
              ) : tasks.length === 0 ? (
                <EmptyState icon={CheckSquare2} title="Henüz görev yok" description="Bu başvuru için bir sonraki adımı görev olarak ekleyebilirsin." />
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Açık görevler</h4>
                    {pendingTasks.length === 0 ? <p className="text-xs text-[var(--text-tertiary)]">Tüm görevler tamamlandı.</p> : pendingTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-3">
                        <button type="button" onClick={() => void handleToggleTaskStatus(task)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-2 border-[var(--border-strong)] hover:border-[var(--accent)]" aria-label={`${task.title} görevini tamamla`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{task.title}</p>
                          {task.due_date ? <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">{formatDate(task.due_date)}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  {completedTasks.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Tamamlananlar</h4>
                      {completedTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-3 opacity-70">
                          <button type="button" onClick={() => void handleToggleTaskStatus(task)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-[var(--accent)] text-white" aria-label={`${task.title} görevini yeniden aç`}>
                            <Check aria-hidden="true" size={13} />
                          </button>
                          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--text-secondary)] line-through">{task.title}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          ) : null}
        </main>

        <footer className="flex shrink-0 items-center gap-2 border-t border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-4 sm:px-7">
          <Button variant="danger" size="icon" onClick={() => setShowDeleteConfirm(true)} aria-label="Başvuruyu sil">
            <Trash2 aria-hidden="true" size={16} />
          </Button>
          <Button variant="secondary" className="ml-auto" onClick={onClose}>Kapat</Button>
          <Button variant="primary" onClick={() => onEdit(application)}>
            <Pencil aria-hidden="true" size={15} /> Düzenle
          </Button>
        </footer>
      </div>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setShowDeleteConfirm(false)
        }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" className="w-full max-w-sm rounded-[14px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-lg)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--danger-subtle)] text-[var(--danger)]">
              <AlertTriangle aria-hidden="true" size={19} />
            </div>
            <h3 id="delete-title" className="mt-4 text-base font-bold text-[var(--text-primary)]">Başvuruyu sil?</h3>
            <p id="delete-description" className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {application.company_name} — {application.position} kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} autoFocus>Vazgeç</Button>
              <Button variant="danger" onClick={() => onDelete(application.id)}>
                <Trash2 aria-hidden="true" size={15} /> Evet, sil
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isTodoFormOpen ? (
        <TodoForm
          editingTodo={null}
          preselectedApplicationId={application.id}
          onClose={() => setIsTodoFormOpen(false)}
          onSave={() => {
            setIsTodoFormOpen(false)
            void fetchRelatedData()
          }}
        />
      ) : null}
    </div>
  )
}
