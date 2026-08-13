'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  Bookmark,
  CalendarDays,
  Check,
  FileText,
  Link2,
  LayoutGrid,
  List,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { normalizeCompanyDomain } from '@/lib/company-brand'
import { MatchLevel, SavedJob } from '@/lib/types'
import MoveToBoardModal from '@/components/saved/MoveToBoardModal'
import { Button } from '@/components/ui/Button'
import CompanyLogo from '@/components/ui/CompanyLogo'
import { FeedbackBanner } from '@/components/ui/FeedbackBanner'
import { Skeleton } from '@/components/ui/Skeleton'

type ChecklistField = 'is_cv_updated' | 'is_message_drafted' | 'is_applied'
type ViewMode = 'grid' | 'list'

const matchLabels: Record<MatchLevel, string> = {
  high: 'Yüksek uyum',
  medium: 'Orta uyum',
  low: 'Düşük uyum',
}

const matchStyles: Record<MatchLevel, string> = {
  high: 'border-emerald-500/20 bg-emerald-500/8 text-emerald-500',
  medium: 'border-amber-500/20 bg-amber-500/8 text-amber-500',
  low: 'border-rose-500/20 bg-rose-500/8 text-rose-500',
}

const checklistItems: Array<{
  field: ChecklistField
  label: string
  icon: typeof FileText
}> = [
  { field: 'is_cv_updated', label: 'CV ilana göre güncellendi', icon: FileText },
  { field: 'is_message_drafted', label: 'Mesaj taslağı hazırlandı', icon: MessageSquareText },
  { field: 'is_applied', label: 'Başvuru tamamlandı', icon: Check },
]

function getCompletedStepCount(job: SavedJob) {
  return checklistItems.reduce((count, item) => count + (job[item.field] ? 1 : 0), 0)
}

interface ChecklistRowProps {
  checked: boolean
  icon: typeof FileText
  label: string
  onChange: (checked: boolean) => void
}

function ChecklistRow({ checked, icon: Icon, label, onChange }: ChecklistRowProps) {
  return (
    <label className="group/check flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[8px] px-2 text-[14px] transition-colors hover:bg-[var(--bg-surface-hover)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
          checked
            ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
            : 'border-[var(--input-border)] bg-[var(--input-bg)] text-transparent group-hover/check:border-[var(--border-hover)]'
        }`}
        aria-hidden="true"
      >
        <Check size={13} strokeWidth={3} />
      </span>
      <Icon
        aria-hidden="true"
        size={16}
        className={checked ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'}
      />
      <span className={checked ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-secondary)]'}>
        {label}
      </span>
    </label>
  )
}

export default function SavedJobsList() {
  const supabase = useMemo(() => createClient(), [])
  const dialogRef = useRef<HTMLDivElement>(null)
  const [jobs, setJobs] = useState<SavedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<SavedJob | null>(null)
  const [jobToMove, setJobToMove] = useState<SavedJob | null>(null)
  const [jobToDelete, setJobToDelete] = useState<SavedJob | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMoving, setIsMoving] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [companyDomain, setCompanyDomain] = useState('')
  const [position, setPosition] = useState('')
  const [postedDate, setPostedDate] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [matchLevel, setMatchLevel] = useState<MatchLevel>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isParsing, setIsParsing] = useState(false)

  const readyJobCount = jobs.filter(job => getCompletedStepCount(job) === checklistItems.length).length
  const visibleJobs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('tr-TR')
    if (!normalizedQuery) return jobs

    return jobs.filter(job =>
      `${job.company_name} ${job.position}`.toLocaleLowerCase('tr-TR').includes(normalizedQuery)
    )
  }, [jobs, searchQuery])

  const fetchJobs = useCallback(async () => {
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Kaydedilen ilanlar yüklenemedi. Lütfen sayfayı yenileyin.')
    } else {
      setJobs(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    // Initial remote data synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchJobs()
  }, [fetchJobs])

  const resetForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingJob(null)
    setCompanyName('')
    setCompanyDomain('')
    setPosition('')
    setPostedDate('')
    setJobUrl('')
    setMatchLevel('medium')
  }, [])

  const closeForm = useCallback(() => {
    if (isSubmitting) return
    resetForm()
  }, [isSubmitting, resetForm])

  useEffect(() => {
    if (!isFormOpen && !jobToDelete) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (jobToDelete) setJobToDelete(null)
      else closeForm()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeForm, isFormOpen, jobToDelete])

  const openNewForm = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const openEditForm = (job: SavedJob) => {
    setEditingJob(job)
    setCompanyName(job.company_name)
    setCompanyDomain(job.company_domain || '')
    setPosition(job.position)
    setPostedDate(job.posted_date ? job.posted_date.split('T')[0] : '')
    setJobUrl(job.job_url || '')
    setMatchLevel(job.match_level || 'medium')
    setIsFormOpen(true)
  }

  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value)
    if (companyDomain) setCompanyDomain('')
  }

  const handleAutoFill = async () => {
    if (!jobUrl) return

    try {
      setIsParsing(true)
      setError(null)
      const response = await fetch(`/api/parse-job?url=${encodeURIComponent(jobUrl)}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'İlan bilgileri alınamadı. Alanları manuel doldurabilirsiniz.')
        return
      }

      if (result.data.company_name) setCompanyName(result.data.company_name)
      if (result.data.company_domain) setCompanyDomain(result.data.company_domain)
      if (result.data.position) setPosition(result.data.position)
      if (result.data.posted_date) setPostedDate(result.data.posted_date)
    } catch {
      setError('İlan bağlantısına ulaşılamadı. Alanları manuel doldurabilirsiniz.')
    } finally {
      setIsParsing(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Oturum bulunamadı. Lütfen yeniden giriş yapın.')
      setIsSubmitting(false)
      return
    }

    const newJob = {
      user_id: user.id,
      company_name: companyName.trim(),
      company_domain: normalizeCompanyDomain(companyDomain),
      position: position.trim(),
      job_url: jobUrl || null,
      posted_date: postedDate ? new Date(postedDate).toISOString() : null,
      match_level: matchLevel,
    }

    const query = editingJob
      ? supabase.from('saved_jobs').update(newJob).eq('id', editingJob.id)
      : supabase.from('saved_jobs').insert(newJob)
    const { error: submitError } = await query

    if (submitError) {
      setError('İlan kaydedilemedi. Lütfen tekrar deneyin.')
    } else {
      resetForm()
      await fetchJobs()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async () => {
    if (!jobToDelete) return

    const { error: deleteError } = await supabase.from('saved_jobs').delete().eq('id', jobToDelete.id)
    if (deleteError) {
      setError('İlan silinemedi. Lütfen tekrar deneyin.')
      return
    }

    setJobs(currentJobs => currentJobs.filter(item => item.id !== jobToDelete.id))
    setJobToDelete(null)
  }

  const handleChecklistChange = async (job: SavedJob, field: ChecklistField, value: boolean) => {
    const updatedJob = { ...job, [field]: value }
    setJobs(currentJobs => currentJobs.map(item => item.id === job.id ? updatedJob : item))

    const { error: updateError } = await supabase
      .from('saved_jobs')
      .update({ [field]: value })
      .eq('id', job.id)

    if (updateError) {
      setJobs(currentJobs => currentJobs.map(item => item.id === job.id ? job : item))
      setError('Hazırlık adımı güncellenemedi.')
      return
    }

    if (getCompletedStepCount(updatedJob) === checklistItems.length) {
      setJobToMove(updatedJob)
    }
  }

  const handleConfirmMove = async (statusId: string) => {
    if (!jobToMove) return

    setIsMoving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Oturum bulunamadı. Lütfen yeniden giriş yapın.')
      setIsMoving(false)
      return
    }

    const newApplication = {
      user_id: user.id,
      company_name: jobToMove.company_name,
      company_domain: jobToMove.company_domain,
      position: jobToMove.position,
      job_url: jobToMove.job_url,
      match_level: jobToMove.match_level,
      status: statusId,
      application_date: new Date().toISOString(),
      kanban_order: 0,
      source: 'other',
    }

    const { error: applicationError } = await supabase.from('applications').insert(newApplication)
    if (applicationError) {
      setError('İlan panoya taşınamadı. Lütfen tekrar deneyin.')
      setIsMoving(false)
      return
    }

    const { error: deleteError } = await supabase.from('saved_jobs').delete().eq('id', jobToMove.id)
    if (deleteError) {
      setError('İlan panoya eklendi ancak kaydedilenlerden kaldırılamadı.')
      setJobToMove(null)
      setIsMoving(false)
      return
    }

    setJobs(currentJobs => currentJobs.filter(job => job.id !== jobToMove.id))
    setJobToMove(null)
    setIsMoving(false)
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-7 flex flex-col gap-5 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
            İlan havuzu
          </p>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)] sm:text-3xl">
            Kaydedilen İlanlar
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--text-secondary)]">
            Başvuru öncesi hazırlıklarını tamamla, hazır olduğunda ilanı panoya taşı.
          </p>
          {!loading && jobs.length > 0 ? (
            <div className="mt-4 flex items-center gap-3 text-xs font-medium text-[var(--text-tertiary)]">
              <span>{jobs.length} kayıt</span>
              <span className="h-1 w-1 rounded-full bg-[var(--border-hover)]" aria-hidden="true" />
              <span>{readyJobCount} hazır</span>
            </div>
          ) : null}
        </div>
        <Button variant="primary" onClick={openNewForm} className="self-start sm:self-auto">
          <Plus aria-hidden="true" size={16} strokeWidth={2.4} />
          Yeni ilan
        </Button>
      </header>

      {error && !isFormOpen ? (
        <FeedbackBanner message={error} onDismiss={() => setError(null)} className="mb-5" />
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="İlanlar yükleniyor" role="status">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[370px] rounded-[12px]" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 text-center">
          <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-[12px] border border-[var(--border)] bg-[var(--bg-column)] text-[var(--text-secondary)]">
            <Bookmark aria-hidden="true" size={20} />
          </span>
          <h2 className="text-base font-bold tracking-[-0.02em] text-[var(--text-primary)]">İlan havuzun boş</h2>
          <p className="mt-1.5 max-w-sm text-sm text-[var(--text-secondary)]">
            İlgini çeken ilanları burada biriktirip başvuru öncesi hazırlıklarını takip edebilirsin.
          </p>
          <Button variant="secondary" onClick={openNewForm} className="mt-5">
            <Plus aria-hidden="true" size={15} />
            İlk ilanı ekle
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-2.5 shadow-[var(--shadow-xs)] sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block min-w-0 flex-1 sm:max-w-md">
              <span className="sr-only">Kaydedilen ilanlarda ara</span>
              <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Şirket veya pozisyon ara"
                className="h-10 w-full rounded-[8px] border border-transparent bg-[var(--bg-column)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--input-border)] focus:bg-[var(--input-bg)]"
              />
            </label>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <p className="text-xs font-medium text-[var(--text-tertiary)]">
                {visibleJobs.length} ilan gösteriliyor
              </p>
              <div className="inline-flex rounded-[8px] border border-[var(--border)] bg-[var(--bg-column)] p-0.5" aria-label="Görünüm seçimi">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-xs font-semibold transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <LayoutGrid aria-hidden="true" size={14} />
                  Kart
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-xs font-semibold transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <List aria-hidden="true" size={14} />
                  Liste
                </button>
              </div>
            </div>
          </div>

          {visibleJobs.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-[14px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 text-center">
              <Search aria-hidden="true" size={20} className="mb-4 text-[var(--text-tertiary)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Eşleşen ilan bulunamadı</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Arama ifadesini değiştirerek tekrar deneyebilirsin.</p>
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="mt-3">Aramayı temizle</Button>
            </div>
          ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
          {visibleJobs.map(job => {
            const completedSteps = getCompletedStepCount(job)
            const progress = Math.round((completedSteps / checklistItems.length) * 100)
            const isReady = completedSteps === checklistItems.length

            return (
              <article
                key={job.id}
                className={`overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)] transition-[border-color,background-color,box-shadow] duration-150 hover:border-[var(--border-hover)] hover:bg-[var(--bg-elevated)] hover:shadow-[var(--shadow-soft)] ${
                  viewMode === 'grid'
                    ? 'flex min-h-[370px] flex-col'
                    : 'flex flex-col lg:grid lg:grid-cols-[minmax(270px,0.9fr)_minmax(390px,1.35fr)_190px] lg:items-stretch'
                }`}
              >
                <div className={viewMode === 'grid' ? 'p-4 pb-3.5' : 'p-4 lg:self-center lg:p-5'}>
                  <div className="flex items-start gap-3">
                    <CompanyLogo companyName={job.company_name} companyDomain={job.company_domain} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold leading-6 tracking-[-0.015em] text-[var(--text-primary)]">{job.company_name}</p>
                      <h2 className="mt-1 line-clamp-2 min-h-11 text-[14px] font-medium leading-[22px] text-[var(--text-secondary)]">{job.position}</h2>
                    </div>
                  </div>

                  <div className="mt-4 flex min-h-8 items-center gap-2.5 text-[13px] font-medium text-[var(--text-tertiary)]">
                    <span className={`inline-flex h-7 shrink-0 items-center rounded-[6px] border px-2 text-[12px] font-semibold ${matchStyles[job.match_level]}`}>
                      {matchLabels[job.match_level]}
                    </span>
                    {job.posted_date ? (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <CalendarDays aria-hidden="true" size={15} />
                        <span className="truncate">{formatDistanceToNow(new Date(job.posted_date), { addSuffix: true, locale: tr })}</span>
                      </span>
                    ) : (
                      <span>Yayın tarihi yok</span>
                    )}
                    {job.job_url ? (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 rounded-[5px] px-1.5 py-1 font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                      >
                        İlan
                        <ArrowUpRight aria-hidden="true" size={14} />
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className={viewMode === 'grid' ? 'mx-4 border-t border-[var(--border)] pt-3.5' : 'mx-4 border-t border-[var(--border)] py-3.5 lg:m-0 lg:border-l lg:border-t-0 lg:px-5 lg:py-4'}>
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Hazırlık</p>
                    <p className={`text-[12px] font-semibold ${isReady ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`}>
                      {isReady ? 'Hazır' : `${completedSteps}/${checklistItems.length}`}
                    </p>
                  </div>
                  <div className="mb-2.5 h-1 overflow-hidden rounded-full bg-[var(--badge-bg)]" aria-label={`Hazırlık yüzde ${progress}`}>
                    <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="space-y-0.5">
                    {checklistItems.map(item => (
                      <ChecklistRow
                        key={item.field}
                        checked={Boolean(job[item.field])}
                        icon={item.icon}
                        label={item.label}
                        onChange={value => handleChecklistChange(job, item.field, value)}
                      />
                    ))}
                  </div>
                </div>

                <div className={`mt-auto flex items-center gap-1.5 border-t border-[var(--border)] px-4 py-3 ${viewMode === 'list' ? 'lg:m-0 lg:flex-col lg:items-stretch lg:justify-center lg:border-l lg:border-t-0 lg:px-3' : ''}`}>
                  <div className={viewMode === 'grid' ? 'flex min-w-0 flex-1 items-center gap-1.5' : 'flex items-center gap-1.5'}>
                    <Button variant="ghost" size="icon" onClick={() => openEditForm(job)} aria-label={`${job.company_name} ilanını düzenle`} title="Düzenle">
                      <Pencil aria-hidden="true" size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setJobToDelete(job)} aria-label={`${job.company_name} ilanını sil`} title="Sil" className="hover:!bg-[var(--danger-subtle)] hover:!text-[var(--danger)]">
                      <Trash2 aria-hidden="true" size={16} />
                    </Button>
                    {viewMode === 'grid' ? (
                      <span className={`ml-auto text-[11px] font-semibold ${isReady ? 'text-emerald-500' : 'text-[var(--text-tertiary)]'}`}>
                        {isReady ? 'Başvuruya hazır' : `%${progress} hazır`}
                      </span>
                    ) : null}
                  </div>
                  <Button variant={isReady ? 'primary' : 'secondary'} size="sm" onClick={() => setJobToMove(job)} className={viewMode === 'grid' ? 'ml-auto' : 'lg:mt-2 lg:w-full'}>
                    Panoya taşı
                    <ArrowRight aria-hidden="true" size={15} />
                  </Button>
                </div>
              </article>
            )
          })}
          </div>
          )}
        </>
      )}

      {isFormOpen ? (
        <div onMouseDown={event => event.target === event.currentTarget && closeForm()} className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="saved-job-form-title" tabIndex={-1} className="my-auto w-full max-w-xl overflow-hidden rounded-[14px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] outline-none">
            <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-strong)]">İlan havuzu</p>
                <h2 id="saved-job-form-title" className="mt-1 text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)]">
                  {editingJob ? 'İlanı düzenle' : 'Yeni ilan kaydet'}
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={closeForm} aria-label="Formu kapat">
                <X aria-hidden="true" size={17} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              {error ? (
                <div className="flex items-start gap-2 rounded-[8px] border border-[var(--danger)]/20 bg-[var(--danger-subtle)] px-3 py-2.5 text-xs leading-5 text-[var(--danger)]" role="alert">
                  <span className="flex-1">{error}</span>
                  <button type="button" onClick={() => setError(null)} className="rounded-[4px] p-0.5 hover:bg-[var(--danger-subtle-strong)]" aria-label="Hata mesajını kapat">
                    <X aria-hidden="true" size={13} />
                  </button>
                </div>
              ) : null}

              <div>
                <label htmlFor="saved-job-url" className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">İlan bağlantısı</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <Link2 aria-hidden="true" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input id="saved-job-url" type="url" value={jobUrl} onChange={event => setJobUrl(event.target.value)} placeholder="https://..." className="h-10 w-full rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]" />
                  </div>
                  <Button variant="secondary" onClick={handleAutoFill} disabled={isParsing || !jobUrl}>
                    <Sparkles aria-hidden="true" size={15} />
                    {isParsing ? 'Alınıyor...' : 'Bilgileri çek'}
                  </Button>
                </div>
                <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">Bağlantıyı yapıştırıp şirket, pozisyon ve tarihi otomatik doldurabilirsin.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="saved-job-company" className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Şirket adı</label>
                  <input id="saved-job-company" required type="text" value={companyName} onChange={event => handleCompanyNameChange(event.target.value)} placeholder="Örn. Linear" className="h-10 w-full rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]" />
                </div>
                <div>
                  <label htmlFor="saved-job-position" className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Pozisyon</label>
                  <input id="saved-job-position" required type="text" value={position} onChange={event => setPosition(event.target.value)} placeholder="Örn. Product Designer" className="h-10 w-full rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="saved-job-date" className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Yayınlanma tarihi</label>
                  <input id="saved-job-date" type="date" value={postedDate} onChange={event => setPostedDate(event.target.value)} className="h-10 w-full rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none" />
                </div>
                <div>
                  <label htmlFor="saved-job-match" className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Uyum seviyesi</label>
                  <select id="saved-job-match" value={matchLevel} onChange={event => setMatchLevel(event.target.value as MatchLevel)} className="h-10 w-full rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none">
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={closeForm}>İptal</Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Kaydediliyor...' : editingJob ? 'Değişiklikleri kaydet' : 'İlanı kaydet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {jobToMove ? (
        <MoveToBoardModal
          job={jobToMove}
          isSubmitting={isMoving}
          onClose={() => !isMoving && setJobToMove(null)}
          onConfirm={handleConfirmMove}
        />
      ) : null}

      {jobToDelete ? (
        <div onMouseDown={event => event.target === event.currentTarget && setJobToDelete(null)} className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="delete-job-title" aria-describedby="delete-job-description" tabIndex={-1} className="w-full max-w-sm overflow-hidden rounded-[14px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] outline-none">
            <div className="p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--danger)]/20 bg-[var(--danger-subtle)] text-[var(--danger)]">
                <AlertTriangle aria-hidden="true" size={18} />
              </span>
              <h2 id="delete-job-title" className="mt-4 text-base font-bold tracking-[-0.02em] text-[var(--text-primary)]">İlanı sil?</h2>
              <p id="delete-job-description" className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">
                <strong className="font-semibold text-[var(--text-primary)]">{jobToDelete.company_name}</strong> · {jobToDelete.position} kaydı kalıcı olarak silinecek.
              </p>
              <div className="mt-6 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                <Button variant="ghost" onClick={() => setJobToDelete(null)} autoFocus>Vazgeç</Button>
                <Button variant="danger" onClick={handleDelete}>İlanı sil</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
