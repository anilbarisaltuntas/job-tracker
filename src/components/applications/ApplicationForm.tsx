'use client'

/**
 * APPLICATION FORM — Başvuru Ekleme/Düzenleme Formu (v2)
 * 
 * Yenilikler:
 * - Çoklu iletişim kişisi (+ butonu ile ekleme)
 * - Her kişi için ayrı mesaj/mail gönderim durumu
 * - Kişi silme özelliği
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Application, ApplicationStatus, ContactFormData } from '@/lib/types'
import { KANBAN_COLUMNS, APPLICATION_SOURCES } from '@/lib/constants'

interface ApplicationFormProps {
  editingApplication: Application | null
  defaultStatus: ApplicationStatus
  onClose: () => void
  onSuccess: () => void
}

/** Boş bir iletişim kişisi oluştur */
const emptyContact = (): ContactFormData => ({
  name: '',
  role: '',
  email: '',
  message_sent: false,
  message_date: '',
  email_sent: false,
  email_date: '',
  notes: '',
})

export default function ApplicationForm({
  editingApplication,
  defaultStatus,
  onClose,
  onSuccess,
}: ApplicationFormProps) {
  const isEditing = !!editingApplication
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    company_name: editingApplication?.company_name || '',
    position: editingApplication?.position || '',
    cv_version: editingApplication?.cv_version || '',
    application_date: editingApplication?.application_date || new Date().toISOString().split('T')[0],
    status: editingApplication?.status || defaultStatus,
    follow_up_date: editingApplication?.follow_up_date || '',
    source: editingApplication?.source || '',
    job_url: editingApplication?.job_url || '',
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
        message_sent: c.message_sent,
        message_date: c.message_date || '',
        email_sent: c.email_sent,
        email_date: c.email_date || '',
        notes: c.notes || '',
      }))
    }
    return []
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      cv_version: formData.cv_version || null,
      follow_up_date: formData.follow_up_date || null,
      source: formData.source || null,
      job_url: formData.job_url || null,
      notes: formData.notes || null,
    }

    try {
      let applicationId: string

      if (isEditing) {
        // Başvuruyu güncelle
        const { error } = await supabase
          .from('applications')
          .update(cleanData)
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
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
          .from('applications')
          .insert({ ...cleanData, user_id: user!.id, kanban_order: 0 })
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
            message_sent: c.message_sent,
            message_date: c.message_date || null,
            email_sent: c.email_sent,
            email_date: c.email_date || null,
            notes: c.notes || null,
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

  const inputClass = "w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
  const labelClass = "mb-1 block text-xs font-medium text-slate-300"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
        >
          ✕
        </button>

        <h2 className="mb-6 text-xl font-bold text-white">
          {isEditing ? '✏️ Başvuruyu Düzenle' : '➕ Yeni Başvuru'}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Şirket + Pozisyon */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Şirket Adı *</label>
              <input name="company_name" value={formData.company_name} onChange={handleChange} required placeholder="ör: Google" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Pozisyon *</label>
              <input name="position" value={formData.position} onChange={handleChange} required placeholder="ör: Frontend Developer" className={inputClass} />
            </div>
          </div>

          {/* Durum + CV */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Durum</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                {KANBAN_COLUMNS.map(col => (
                  <option key={col.id} value={col.id}>{col.emoji} {col.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>CV Versiyonu</label>
              <input name="cv_version" value={formData.cv_version} onChange={handleChange} placeholder="ör: BA v2" className={inputClass} />
            </div>
          </div>

          {/* Tarihler */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Başvuru Tarihi *</label>
              <input name="application_date" type="date" value={formData.application_date} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Takip Tarihi</label>
              <input name="follow_up_date" type="date" value={formData.follow_up_date} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kaynak</label>
              <select name="source" value={formData.source} onChange={handleChange} className={inputClass}>
                <option value="">Seçiniz...</option>
                {APPLICATION_SOURCES.map(src => (
                  <option key={src.value} value={src.value}>{src.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ============================== */}
          {/* İLETİŞİM KİŞİLERİ - YENİ */}
          {/* ============================== */}
          <div className="rounded-lg border border-slate-700 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300">👤 İletişim Kişileri</h3>
              <button
                type="button"
                onClick={addContact}
                className="flex items-center gap-1 rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
              >
                <span className="text-lg leading-none">+</span> Kişi Ekle
              </button>
            </div>

            {contacts.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">
                Henüz iletişim kişisi eklenmemiş.{' '}
                <button type="button" onClick={addContact} className="text-blue-400 hover:underline">
                  Ekle
                </button>
              </p>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact, index) => (
                  <div key={index} className="relative rounded-lg border border-slate-600/50 bg-slate-700/30 p-4">
                    {/* Kişi sil butonu */}
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="absolute right-2 top-2 rounded p-1 text-xs text-slate-500 hover:bg-slate-600 hover:text-red-400"
                      title="Kişiyi kaldır"
                    >
                      ✕
                    </button>

                    {/* Kişi numarası */}
                    <p className="mb-2 text-xs font-medium text-slate-500">Kişi {index + 1}</p>

                    {/* Kişi bilgileri */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className={labelClass}>Ad Soyad *</label>
                        <input
                          value={contact.name}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                          placeholder="ör: Ahmet Yılmaz"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Rol/Ünvan</label>
                        <input
                          value={contact.role}
                          onChange={(e) => updateContact(index, 'role', e.target.value)}
                          placeholder="ör: HR Manager"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>E-posta</label>
                        <input
                          value={contact.email}
                          onChange={(e) => updateContact(index, 'email', e.target.value)}
                          placeholder="ör: ahmet@sirket.com"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Mesaj & Mail durumu */}
                    <div className="mt-3 flex flex-wrap gap-4">
                      {/* Mesaj gönderildi mi? */}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={contact.message_sent}
                            onChange={(e) => updateContact(index, 'message_sent', e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-slate-500 bg-slate-600 text-blue-500"
                          />
                          💬 Mesaj gönderildi
                        </label>
                        {contact.message_sent && (
                          <input
                            type="date"
                            value={contact.message_date}
                            onChange={(e) => updateContact(index, 'message_date', e.target.value)}
                            className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-white"
                          />
                        )}
                      </div>

                      {/* Mail gönderildi mi? */}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={contact.email_sent}
                            onChange={(e) => updateContact(index, 'email_sent', e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-slate-500 bg-slate-600 text-purple-500"
                          />
                          📧 Mail gönderildi
                        </label>
                        {contact.email_sent && (
                          <input
                            type="date"
                            value={contact.email_date}
                            onChange={(e) => updateContact(index, 'email_date', e.target.value)}
                            className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-white"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* İlan Linki */}
          <div>
            <label className={labelClass}>İş İlanı Linki</label>
            <input name="job_url" type="url" value={formData.job_url} onChange={handleChange} placeholder="https://..." className={inputClass} />
          </div>

          {/* Notlar */}
          <div>
            <label className={labelClass}>Notlar</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Mülakat notları, geri bildirimler..." className={inputClass + ' resize-none'} />
          </div>

          {/* Butonlar */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700">
              İptal
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 text-sm font-medium text-white transition-all hover:from-blue-600 hover:to-purple-700 disabled:opacity-50">
              {loading ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
