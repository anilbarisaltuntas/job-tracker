'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SavedJob, ApplicationStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import MoveToBoardModal from '@/components/saved/MoveToBoardModal'

export default function SavedJobsList() {
  const [jobs, setJobs] = useState<SavedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const supabase = createClient()

  // Form states
  const [companyName, setCompanyName] = useState('')
  const [position, setPosition] = useState('')
  const [postedDate, setPostedDate] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Checklist -> Modal states
  const [jobToMove, setJobToMove] = useState<SavedJob | null>(null)

  const fetchJobs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) setJobs(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchJobs()
  }, []) // eslint-disable-line

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newJob = {
      user_id: user.id,
      company_name: companyName,
      position,
      job_url: jobUrl || null,
      posted_date: postedDate ? new Date(postedDate).toISOString() : null
    }

    const { error } = await supabase.from('saved_jobs').insert(newJob)
    
    if (!error) {
      setIsFormOpen(false)
      setCompanyName('')
      setPosition('')
      setPostedDate('')
      setJobUrl('')
      fetchJobs()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğine emin misin?')) return
    await supabase.from('saved_jobs').delete().eq('id', id)
    setJobs(jobs.filter(j => j.id !== id))
  }

  const handleChecklistChange = async (job: SavedJob, field: 'is_cv_updated' | 'is_message_drafted' | 'is_applied', value: boolean) => {
    // Optimistic Update
    const updatedJob = { ...job, [field]: value }
    setJobs(jobs.map(j => j.id === job.id ? updatedJob : j))

    await supabase
      .from('saved_jobs')
      .update({ [field]: value })
      .eq('id', job.id)

    // Check if all 3 are now true
    if (updatedJob.is_cv_updated && updatedJob.is_message_drafted && updatedJob.is_applied) {
      setJobToMove(updatedJob)
    }
  }

  const handleConfirmMove = async (statusId: string) => {
    if (!jobToMove) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Add to applications
    const newApp = {
      user_id: user.id,
      company_name: jobToMove.company_name,
      position: jobToMove.position,
      job_url: jobToMove.job_url,
      status: statusId,
      application_date: new Date().toISOString(),
      kanban_order: 0,
      source: 'other' as any
    }

    const { error: appError } = await supabase.from('applications').insert(newApp)
    
    // 2. Delete from saved jobs
    if (!appError) {
      await supabase.from('saved_jobs').delete().eq('id', jobToMove.id)
      setJobs(jobs.filter(j => j.id !== jobToMove.id))
      setJobToMove(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Kaydedilen İlanlar</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Daha sonra başvurmak üzere ayırdığın ilanlar.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="whitespace-nowrap rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
        >
          Yeni İlan Kaydet
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3" style={{ color: 'var(--text-tertiary)' }}>Yükleniyor...</div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed text-center" style={{ borderColor: 'var(--border)' }}>
          <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>Henüz kaydedilmiş ilan yok.</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>Gözüne kestirdiğin bir ilan olduğunda buraya ekleyebilirsin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => (
            <div key={job.id} className="group relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{job.position}</h3>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{job.company_name}</p>
                
                <div className="mt-4 space-y-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {job.posted_date && (
                    <div className="flex items-center gap-2">
                      <span>🕒</span> 
                      {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true, locale: tr })} yayınlandı
                    </div>
                  )}
                  {job.job_url && (
                    <div className="flex items-center gap-2">
                      <span>🔗</span> 
                      <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        İlana Git
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Hazırlık Aşamaları</h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={job.is_cv_updated || false}
                      onChange={(e) => handleChecklistChange(job, 'is_cv_updated', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span style={{ color: job.is_cv_updated ? 'var(--text-tertiary)' : 'var(--text-primary)' }} className={job.is_cv_updated ? 'line-through' : ''}>
                      CV ilana göre güncellendi
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={job.is_message_drafted || false}
                      onChange={(e) => handleChecklistChange(job, 'is_message_drafted', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span style={{ color: job.is_message_drafted ? 'var(--text-tertiary)' : 'var(--text-primary)' }} className={job.is_message_drafted ? 'line-through' : ''}>
                      Mesaj / E-Mail taslağı oluşturuldu
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={job.is_applied || false}
                      onChange={(e) => handleChecklistChange(job, 'is_applied', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span style={{ color: job.is_applied ? 'var(--text-tertiary)' : 'var(--text-primary)' }} className={job.is_applied ? 'line-through' : ''}>
                      Başvuruldu
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="text-xs font-medium text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Sil
                </button>
                <button
                  onClick={() => setJobToMove(job)}
                  className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-500 transition-colors hover:bg-blue-500 hover:text-white"
                >
                  Panoya Taşı →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <h2 className="mb-4 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>İlan Kaydet</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
              <div>
                <label className="mb-1 block font-medium" style={{ color: 'var(--text-secondary)' }}>Şirket Adı *</label>
                <input required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full rounded-xl border p-2.5 outline-none" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="mb-1 block font-medium" style={{ color: 'var(--text-secondary)' }}>Pozisyon *</label>
                <input required type="text" value={position} onChange={e => setPosition(e.target.value)} className="w-full rounded-xl border p-2.5 outline-none" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="mb-1 block font-medium" style={{ color: 'var(--text-secondary)' }}>Yayınlanma Tarihi</label>
                <input type="date" value={postedDate} onChange={e => setPostedDate(e.target.value)} className="w-full rounded-xl border p-2.5 outline-none" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="mb-1 block font-medium" style={{ color: 'var(--text-secondary)' }}>İlan Linki</label>
                <input type="url" value={jobUrl} onChange={e => setJobUrl(e.target.value)} className="w-full rounded-xl border p-2.5 outline-none" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} placeholder="https://..." />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl px-4 py-2 font-medium" style={{ color: 'var(--text-secondary)' }}>İptal</button>
                <button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                  {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {jobToMove && (
        <MoveToBoardModal
          job={jobToMove}
          onClose={() => setJobToMove(null)}
          onConfirm={handleConfirmMove}
        />
      )}
    </div>
  )
}
