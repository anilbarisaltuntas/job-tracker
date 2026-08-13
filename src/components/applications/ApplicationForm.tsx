'use client'

/**
 * APPLICATION FORM — Başvuru Ekleme/Düzenleme Formu (v2)
 * 
 * Yenilikler:
 * - Çoklu iletişim kişisi (+ butonu ile ekleme)
 * - Her kişi için ayrı mesaj/mail gönderim durumu
 * - Kişi silme özelliği
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { BriefcaseBusiness, Link2, Save, UserRound, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Application, ApplicationStatus, ContactFormData, UserStatus } from '@/lib/types'
import { APPLICATION_SOURCES } from '@/lib/constants'
import { normalizeCompanyDomain } from '@/lib/company-brand'
import RichTextEditor from '../ui/RichTextEditor'
import CompanyLogo from '../ui/CompanyLogo'
import { Button } from '../ui/Button'

interface ApplicationFormProps {
  editingApplication: Application | null
  statuses: UserStatus[]
  defaultStatus: ApplicationStatus
  onClose: () => void
  onSuccess: () => void
}

/** Boş bir iletişim kişisi oluştur */
const emptyContact = (): ContactFormData => ({
  name: '',
  role: '',
  email: '',
  phone: '',
  message_sent: false,
  message_date: '',
  email_sent: false,
  email_date: '',
  notes: '',
  linkedin_url: '',
})

export default function ApplicationForm({
  editingApplication,
  statuses,
  defaultStatus,
  onClose,
  onSuccess,
}: ApplicationFormProps) {
  const isEditing = !!editingApplication
  const supabase = useMemo(() => createClient(), [])
  const panelRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    company_name: editingApplication?.company_name || '',
    company_domain: editingApplication?.company_domain || '',
    position: editingApplication?.position || '',
    cv_version: editingApplication?.cv_version || '',
    application_date: editingApplication?.application_date || new Date().toISOString().split('T')[0],
    status: editingApplication?.status || defaultStatus,
    follow_up_date: editingApplication?.follow_up_date || '',
    source: editingApplication?.source || '',
    job_url: editingApplication?.job_url || '',
    match_level: editingApplication?.match_level || 'medium',
    priority_level: editingApplication?.priority_level || 'medium',
    notes: editingApplication?.notes || '',
  })

  // İletişim kişileri state'i
  // Düzenleme modunda mevcut kişileri yükle, yoksa boş bir kişi ile başla
  const [contacts, setContacts] = useState<ContactFormData[]>(() => {
    if (editingApplication?.contacts && editingApplication.contacts.length > 0) {
      return editingApplication.contacts.map(c => ({
        id: c.id,
        name: c.name,
        role: c.role || '',
        email: c.email || '',
        phone: c.phone || '',
        message_sent: c.message_sent,
        message_date: c.message_date || '',
        email_sent: c.email_sent,
        email_date: c.email_date || '',
        notes: c.notes || '',
        linkedin_url: c.linkedin_url || '',
      }))
    }
    return []
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null) // Seçilen PDF dosyası
  const [existingCvUrl, setExistingCvUrl] = useState(editingApplication?.cv_file_url || null)
  const [isParsing, setIsParsing] = useState(false)

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

  // Linkten otomatik ilan bilgilerini çekme
  const handleAutoFill = async () => {
    if (!formData.job_url) {
      alert('Lütfen önce ilan linkini girin!')
      return
    }

    try {
      setIsParsing(true)
      const res = await fetch(`/api/parse-job?url=${encodeURIComponent(formData.job_url)}`)
      const result = await res.json()

      if (res.ok && result.success) {
        setFormData(prev => ({
          ...prev,
          company_name: result.data.company_name || prev.company_name,
          company_domain: result.data.company_domain || prev.company_domain,
          position: result.data.position || prev.position,
          application_date: result.data.posted_date || prev.application_date,
        }))
      } else {
        alert(result.error || 'Bilgiler çekilemedi. Manuel girebilirsiniz.')
      }
    } catch (error) {
      console.error(error)
      alert('Bağlantı hatası oluştu.')
    } finally {
      setIsParsing(false)
    }
  }

  // Genel form değişiklik handler'ı
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // İletişim kişisi ekleme
  const addContact = () => {
    setContacts(prev => [...prev, emptyContact()])
  }

  // İletişim kişisi silme
  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index))
  }

  // İletişim kişisi güncelleme
  const updateContact = (index: number, field: keyof ContactFormData, value: string | boolean) => {
    setContacts(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Form gönderme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanData = {
      ...formData,
      company_domain: normalizeCompanyDomain(formData.company_domain),
      cv_version: formData.cv_version || null,
      follow_up_date: formData.follow_up_date || null,
      source: formData.source || null,
      job_url: formData.job_url || null,
      match_level: formData.match_level,
      priority_level: formData.priority_level,
      notes: formData.notes || null,
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Oturum bulunamadı")

      let finalCvUrl = existingCvUrl

      // Eğer yeni bir PDF seçildiyse, Supabase Storage'a yükle
      if (cvFile) {
        const fileExt = cvFile.name.split('.').pop()
        // Benzersiz dosya adı: kullanıcıID/zaman_damgası.pdf
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('cv-files')
          .upload(fileName, cvFile)

        if (uploadError) throw uploadError

        // Yüklenen dosyanın public (herkese açık) linkini al
        const { data: { publicUrl } } = supabase.storage
          .from('cv-files')
          .getPublicUrl(fileName)

        finalCvUrl = publicUrl
      }

      // Final veriye cv linkini ekle
      const finalData = { ...cleanData, cv_file_url: finalCvUrl }

      let applicationId: string

      if (isEditing) {
        // Başvuruyu güncelle
        const { error } = await supabase
          .from('applications')
          .update(finalData)
          .eq('id', editingApplication!.id)

        if (error) throw error
        applicationId = editingApplication!.id

        // Eski kişileri sil (yenileriyle değiştirilecek)
        await supabase
          .from('contacts')
          .delete()
          .eq('application_id', applicationId)

      } else {
        // Yeni başvuru oluştur
        const { data, error } = await supabase
          .from('applications')
          .insert({ ...finalData, user_id: user.id, kanban_order: 0 })
          .select('id')
          .single()

        if (error) throw error
        applicationId = data.id
      }

      // İletişim kişilerini kaydet
      if (contacts.length > 0) {
        const { data: { user } } = await supabase.auth.getUser()
        const contactsToInsert = contacts
          .filter(c => c.name.trim() !== '') // Boş isimli kişileri atla
          .map((c, index) => ({
            application_id: applicationId,
            user_id: user!.id,
            name: c.name,
            role: c.role || null,
            email: c.email || null,
            ...(c.phone ? { phone: c.phone } : {}),
            message_sent: c.message_sent,
            message_date: c.message_date || null,
            email_sent: c.email_sent,
            email_date: c.email_date || null,
            notes: c.notes || null,
            linkedin_url: c.linkedin_url || null,
            sort_order: index,
          }))

        if (contactsToInsert.length > 0) {
          const { error } = await supabase
            .from('contacts')
            .insert(contactsToInsert)

          if (error) throw error
        }
      }

      onSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu'
      setError(message)
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    color: 'var(--text-primary)',
  }
  const labelStyle: React.CSSProperties = { color: 'var(--text-secondary)' }

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/55 backdrop-blur-[2px]"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !loading) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-form-title"
        tabIndex={-1}
        className="ml-auto flex h-full w-full max-w-[760px] flex-col border-l border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] outline-none motion-safe:animate-[slideInRight_180ms_ease-out]"
      >
        <header className="flex shrink-0 items-start gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-tertiary)]">
            <BriefcaseBusiness aria-hidden="true" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="application-form-title" className="text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              {isEditing ? 'Başvuruyu düzenle' : 'Yeni başvuru'}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">
              {isEditing ? 'Başvuru bilgilerini ve ilişkili kişileri güncelle.' : 'Yeni başvurunun temel bilgilerini ve takip ayrıntılarını ekle.'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading} aria-label="Başvuru formunu kapat">
            <X aria-hidden="true" size={18} />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-7">
            {error && (
              <div className="rounded-[10px] border border-[var(--danger)]/25 bg-[var(--danger-subtle)] px-4 py-3 text-sm text-[var(--danger)]" role="alert">
                {error}
              </div>
            )}

          {/* Şirket + Pozisyon */}
          <section className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <BriefcaseBusiness aria-hidden="true" size={15} className="text-[var(--text-tertiary)]" />
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Şirket ve pozisyon</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>Şirket Adı *</label>
              <div className="flex items-center gap-2">
                <CompanyLogo companyName={formData.company_name} companyDomain={formData.company_domain} />
                <input name="company_name" value={formData.company_name} onChange={handleChange} required placeholder="ör: Google" className="min-w-0 flex-1 rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>Pozisyon *</label>
              <input name="position" value={formData.position} onChange={handleChange} required placeholder="ör: Frontend Developer" className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle} />
            </div>
            </div>

            <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>Şirket websitesi <span style={{ color: 'var(--text-tertiary)' }}>(logo için)</span></label>
            <input
              name="company_domain"
              value={formData.company_domain}
              onChange={handleChange}
              placeholder="ör: google.com"
              inputMode="url"
              className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all"
              style={inputStyle}
            />
            </div>
          </section>

          {/* Link + Metrikler */}
          <section className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Link2 aria-hidden="true" size={15} className="text-[var(--text-tertiary)]" />
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">İlan ve takip bilgileri</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>İlan Linki</label>
              <div className="flex gap-2">
                <input 
                  name="job_url" 
                  type="url" 
                  value={formData.job_url} 
                  onChange={handleChange} 
                  placeholder="https://..." 
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" 
                  style={inputStyle} 
                />
                <button 
                  type="button" 
                  onClick={handleAutoFill}
                  disabled={isParsing || !formData.job_url}
                  className="shrink-0 rounded-xl bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-500 transition-colors hover:bg-blue-500 hover:text-white disabled:opacity-50"
                >
                  {isParsing ? '⏳ Bekleyin...' : '✨ Bilgileri Çek'}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>Uyumluluğum (Match)</label>
              <select name="match_level" value={formData.match_level} onChange={handleChange} className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle}>
                <option value="low">🔴 Düşük</option>
                <option value="medium">🟡 Orta</option>
                <option value="high">🟢 Yüksek</option>
              </select>
            </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>Durum</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle}>
                {statuses.map(col => (
                  <option key={col.id} value={col.id}>{col.emoji} {col.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>CV Versiyonu (Metin)</label>
              <input name="cv_version" value={formData.cv_version} onChange={handleChange} placeholder="ör: BA v2" className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>CV Dosyası (PDF)</label>
              
              {existingCvUrl && !cvFile ? (
                <div 
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--badge-bg)', border: '1px solid var(--border)' }}
                >
                  <span className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    📄 Mevcut CV Yüklü
                  </span>
                  <button
                    type="button"
                    onClick={() => setExistingCvUrl(null)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Değiştir
                  </button>
                </div>
              ) : (
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setCvFile(file)
                    if (file) {
                      const nameWithoutExt = file.name.replace(/\.pdf$/i, '')
                      setFormData(prev => ({ ...prev, cv_version: nameWithoutExt }))
                    }
                  }}
                  className="w-full rounded-xl px-3 py-1.5 text-sm outline-none transition-all file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--badge-bg)] file:px-3 file:py-1 file:text-xs file:font-medium file:text-[var(--text-primary)] hover:file:bg-[var(--border-hover)]"
                  style={inputStyle}
                />
              )}
            </div>
          </div>

          {/* Tarihler */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>Başvuru Tarihi *</label>
              <input name="application_date" type="date" value={formData.application_date} onChange={handleChange} required className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>Takip Tarihi</label>
              <input name="follow_up_date" type="date" value={formData.follow_up_date} onChange={handleChange} className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>Kaynak</label>
              <select name="source" value={formData.source} onChange={handleChange} className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle}>
                <option value="">Seçiniz...</option>
                {APPLICATION_SOURCES.map(src => (
                  <option key={src.value} value={src.value}>{src.label}</option>
                ))}
              </select>
            </div>
            </div>
          </section>

          {/* ============================== */}
          {/* İLETİŞİM KİŞİLERİ - YENİ */}
          {/* ============================== */}
          <section className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserRound aria-hidden="true" size={15} className="text-[var(--text-tertiary)]" />
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">İletişim kişileri</h3>
              </div>
              <button
                type="button"
                onClick={addContact}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                + Kişi Ekle
              </button>
            </div>

            {contacts.length === 0 ? (
              <p className="py-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Henüz iletişim kişisi eklenmemiş.{' '}
                <button type="button" onClick={addContact} className="text-blue-500 hover:underline">
                  Ekle
                </button>
              </p>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="mt-4 rounded-2xl p-5"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Kişi #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        className="text-xs transition-colors hover:text-red-500"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Kaldır
                      </button>
                    </div>

                    {/* Kişi bilgileri */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>Ad Soyad *</label>
                        <input
                          value={contact.name}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                          placeholder="ör: Ahmet Yılmaz"
                          className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>Rol/Ünvan</label>
                        <input
                          value={contact.role}
                          onChange={(e) => updateContact(index, 'role', e.target.value)}
                          placeholder="ör: HR Manager"
                          className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>E-posta</label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) => updateContact(index, 'email', e.target.value)}
                          placeholder="ör: ahmet@sirket.com"
                          className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>Telefon</label>
                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => updateContact(index, 'phone', e.target.value)}
                          placeholder="ör: +90 555 000 00 00"
                          className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium" style={labelStyle}>LinkedIn Profil URL</label>
                        <input
                          value={contact.linkedin_url || ''}
                          onChange={(e) => updateContact(index, 'linkedin_url', e.target.value)}
                          placeholder="ör: https://linkedin.com/in/ornek"
                          className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* Mesaj & Mail durumu */}
                    <div className="mt-3 flex flex-wrap gap-4">
                      {/* Mesaj gönderildi mi? */}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <input
                            type="checkbox"
                            checked={contact.message_sent}
                            onChange={(e) => updateContact(index, 'message_sent', e.target.checked)}
                            className="h-3.5 w-3.5 rounded text-blue-500"
                            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                          />
                          💬 Mesaj gönderildi
                        </label>
                        {contact.message_sent && (
                          <input
                            type="date"
                            value={contact.message_date}
                            onChange={(e) => updateContact(index, 'message_date', e.target.value)}
                            className="rounded px-2 py-1 text-xs"
                            style={inputStyle}
                          />
                        )}
                      </div>

                      {/* Mail gönderildi mi? */}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <input
                            type="checkbox"
                            checked={contact.email_sent}
                            onChange={(e) => updateContact(index, 'email_sent', e.target.checked)}
                            className="h-3.5 w-3.5 rounded text-purple-500"
                            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                          />
                          📧 Mail gönderildi
                        </label>
                        {contact.email_sent && (
                          <input
                            type="date"
                            value={contact.email_date}
                            onChange={(e) => updateContact(index, 'email_date', e.target.value)}
                            className="rounded px-2 py-1 text-xs"
                            style={inputStyle}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={addContact}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-bold text-[var(--accent)] hover:bg-[var(--badge-bg)] transition-colors shadow-2xs"
                  >
                    <span>+</span>
                    <span>Bir İletişim Kişisi Daha Ekle</span>
                  </button>
                </div>
              </div>
            )}
          </section>



          {/* Notlar */}
          <section className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
            <label className="mb-3 block text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Notlar</label>
            <RichTextEditor 
              content={formData.notes}
              onChange={(html) => setFormData(prev => ({ ...prev, notes: html }))}
            />
          </section>
          </div>

          {/* Butonlar */}
          <footer className="flex shrink-0 justify-end gap-2 border-t border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-4 sm:px-7">
            <Button variant="secondary" onClick={onClose} disabled={loading}>İptal</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              <Save aria-hidden="true" size={15} />
              {loading ? 'Kaydediliyor...' : isEditing ? 'Değişiklikleri Kaydet' : 'Başvuru Ekle'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  )
}
