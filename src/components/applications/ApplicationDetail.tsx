'use client'

/**
 * APPLICATION DETAIL — Başvuru Detay Modal'ı (v2)
 * 
 * Yenilikler:
 * - Çoklu iletişim kişilerini gösterir
 * - Her kişi için mesaj/mail durumunu gösterir
 */

import { Application } from '@/lib/types'
import { KANBAN_COLUMNS } from '@/lib/constants'
import { useState } from 'react'

interface ApplicationDetailProps {
  application: Application
  onClose: () => void
  onEdit: (app: Application) => void
  onDelete: (appId: string) => void
}

export default function ApplicationDetail({
  application,
  onClose,
  onEdit,
  onDelete,
}: ApplicationDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const column = KANBAN_COLUMNS.find(col => col.id === application.status)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const isOverdue = application.follow_up_date 
    && new Date(application.follow_up_date) < new Date()

  const contacts = application.contacts || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Üst renkli şerit */}
        <div className="h-2 rounded-t-2xl" style={{ backgroundColor: column?.color || '#64748B' }} />

        <div className="p-6">
          <button onClick={onClose} className="absolute right-4 top-6 rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-white">✕</button>

          {/* Durum badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: column?.color || '#64748B' }}>
            {column?.emoji} {column?.title}
          </span>

          {/* Şirket ve Pozisyon */}
          <h2 className="mt-4 text-2xl font-bold text-white">{application.company_name}</h2>
          <p className="mt-1 text-lg text-slate-400">{application.position}</p>

          {/* Temel Bilgiler */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-slate-700/30 px-3 py-2">
              <span>📅</span>
              <div>
                <p className="text-xs text-slate-500">Başvuru Tarihi</p>
                <p className="text-sm text-slate-200">{formatDate(application.application_date)}</p>
              </div>
            </div>

            {application.cv_version && (
              <div className="flex items-center gap-3 rounded-lg bg-slate-700/30 px-3 py-2">
                <span>📄</span>
                <div>
                  <p className="text-xs text-slate-500">CV Versiyonu</p>
                  <p className="text-sm text-slate-200">{application.cv_version}</p>
                </div>
              </div>
            )}

            {application.source && (
              <div className="flex items-center gap-3 rounded-lg bg-slate-700/30 px-3 py-2">
                <span>🔗</span>
                <div>
                  <p className="text-xs text-slate-500">Kaynak</p>
                  <p className="text-sm text-slate-200">{application.source}</p>
                </div>
              </div>
            )}

            {application.job_url && (
              <div className="flex items-center gap-3 rounded-lg bg-slate-700/30 px-3 py-2">
                <span>🌐</span>
                <div>
                  <p className="text-xs text-slate-500">İş İlanı</p>
                  <a href={application.job_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">
                    İlanı Görüntüle ↗
                  </a>
                </div>
              </div>
            )}

            {/* Takip tarihi */}
            {application.follow_up_date && (
              <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isOverdue ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-700/30'}`}>
                <span>{isOverdue ? '⚠️' : '🔔'}</span>
                <div>
                  <p className="text-xs text-slate-500">Takip Tarihi</p>
                  <p className={`text-sm ${isOverdue ? 'text-red-400 font-semibold' : 'text-slate-200'}`}>
                    {formatDate(application.follow_up_date)}
                    {isOverdue && ' — Gecikti!'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* İLETİŞİM KİŞİLERİ */}
          {contacts.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-300">
                👤 İletişim Kişileri ({contacts.length})
              </h3>
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="rounded-lg border border-slate-700/50 bg-slate-700/20 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-white">{contact.name}</p>
                        {contact.role && <p className="text-xs text-slate-400">{contact.role}</p>}
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-xs text-blue-400 hover:underline">
                            {contact.email}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Mesaj / Mail durumu */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        contact.message_sent 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-slate-600/50 text-slate-400'
                      }`}>
                        💬 {contact.message_sent 
                          ? `Mesaj gönderildi${contact.message_date ? ` • ${formatDate(contact.message_date)}` : ''}`
                          : 'Mesaj gönderilmedi'
                        }
                      </span>

                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        contact.email_sent 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-slate-600/50 text-slate-400'
                      }`}>
                        📧 {contact.email_sent 
                          ? `Mail gönderildi${contact.email_date ? ` • ${formatDate(contact.email_date)}` : ''}`
                          : 'Mail gönderilmedi'
                        }
                      </span>
                    </div>

                    {contact.notes && (
                      <p className="mt-2 text-xs text-slate-500 italic">💭 {contact.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notlar */}
          {application.notes && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-slate-300">📝 Notlar</h3>
              <p className="whitespace-pre-wrap rounded-lg bg-slate-700/30 p-3 text-sm text-slate-400">
                {application.notes}
              </p>
            </div>
          )}

          {/* Aksiyon Butonları */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => onEdit(application)}
              className="flex-1 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-600"
            >
              ✏️ Düzenle
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                🗑️ Sil
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => onDelete(application.id)} className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600">
                  Evet, Sil
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="rounded-lg border border-slate-600 px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-700">
                  İptal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
