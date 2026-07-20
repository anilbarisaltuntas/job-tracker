'use client'

/**
 * APPLICATION DETAIL — Başvuru Detay Modal'ı (v2)
 * 
 * Yenilikler:
 * - Çoklu iletişim kişilerini gösterir
 * - Her kişi için mesaj/mail durumunu gösterir
 */

import { Application, ApplicationHistory } from '@/lib/types'
import { KANBAN_COLUMNS } from '@/lib/constants'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  const [history, setHistory] = useState<ApplicationHistory[]>([])
  
  const column = KANBAN_COLUMNS.find(col => col.id === application.status)
  const supabase = createClient()

  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('application_history')
        .select('*')
        .eq('application_id', application.id)
        .order('created_at', { ascending: false })
      
      if (data) {
        setHistory(data)
      }
    }
    fetchHistory()
  }, [application.id, supabase])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
        }}
      >
        {/* Üst renkli şerit */}
        <div className="h-2 rounded-t-2xl" style={{ backgroundColor: column?.color || '#64748B' }} />

        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >✕</button>

          {/* Durum badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: column?.color || '#64748B' }}>
            {column?.emoji} {column?.title}
          </span>

          {/* Şirket ve Pozisyon */}
          <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>{application.company_name}</h2>
          <p className="mt-1 text-lg" style={{ color: 'var(--text-secondary)' }}>{application.position}</p>

          {/* Temel Bilgiler */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <span>📅</span>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Başvuru Tarihi</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(application.application_date)}</p>
              </div>
            </div>

            {(application.cv_version || application.cv_file_url) && (
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <span>📄</span>
                <div className="flex w-full items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>CV Versiyonu</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{application.cv_version || 'Belirtilmedi'}</p>
                  </div>
                  {application.cv_file_url && (
                    <a 
                      href={application.cv_file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      download
                      className="rounded-xl px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: 'var(--badge-bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      İndir / Görüntüle 📥
                    </a>
                  )}
                </div>
              </div>
            )}

            {application.source && (
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <span>🔗</span>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Kaynak</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{application.source}</p>
                </div>
              </div>
            )}

            {application.job_url && (
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <span>🌐</span>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>İş İlanı</p>
                  <a href={application.job_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400/90 hover:underline">
                    İlanı Görüntüle ↗
                  </a>
                </div>
              </div>
            )}

            {/* Takip tarihi */}
            {application.follow_up_date && (
              <div
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${isOverdue ? 'border-red-500/20 bg-red-500/10' : ''}`}
                style={!isOverdue ? { backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' } : undefined}
              >
                <span>{isOverdue ? '⚠️' : '🔔'}</span>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Takip Tarihi</p>
                  <p
                    className={`text-sm font-medium ${isOverdue ? 'text-red-500' : ''}`}
                    style={!isOverdue ? { color: 'var(--text-primary)' } : undefined}
                  >
                    {formatDate(application.follow_up_date)}
                    {isOverdue && ' — Gecikti!'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* İLETİŞİM KİŞİLERİ */}
          {contacts.length > 0 && (
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                👤 İletişim Kişileri ({contacts.length})
              </h3>
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{contact.name}</p>
                        {contact.role && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{contact.role}</p>}
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-xs text-blue-500 hover:underline">
                            {contact.email}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Mesaj / Mail durumu */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          contact.message_sent 
                            ? 'border-green-500/20 bg-green-500/10 text-green-500' 
                            : ''
                        }`}
                        style={!contact.message_sent ? { backgroundColor: 'var(--badge-bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' } : undefined}
                      >
                        💬 {contact.message_sent 
                          ? `Mesaj gönderildi${contact.message_date ? ` • ${formatDate(contact.message_date)}` : ''}`
                          : 'Mesaj gönderilmedi'
                        }
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          contact.email_sent 
                            ? 'border-purple-500/20 bg-purple-500/10 text-purple-500' 
                            : ''
                        }`}
                        style={!contact.email_sent ? { backgroundColor: 'var(--badge-bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' } : undefined}
                      >
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
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <h3 className="mb-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>📝 Notlar</h3>
              <div
                className="tiptap-editor rounded-2xl p-4 text-sm"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
                dangerouslySetInnerHTML={{ __html: application.notes }}
              />
            </div>
          )}

          {/* Geçmiş / Timeline */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>⏳ Serüven (Geçmiş)</h3>
            
            {history.length === 0 ? (
              <p className="text-xs italic text-slate-500">Henüz bir geçmiş kaydı yok.</p>
            ) : (
              <div className="relative space-y-4 before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:-translate-x-px before:bg-[var(--border)]">
                {history.map((item) => (
                  <div key={item.id} className="relative flex items-start gap-4">
                    {/* Yuvarlak Node */}
                    <div className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--bg-elevated)] shadow-[0_0_0_4px_var(--bg-elevated)] ring-1 ring-[var(--border-strong)] mt-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    </div>
                    {/* İçerik */}
                    <div className="flex-1 rounded-2xl p-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{item.description}</p>
                      
                      {(item.old_status || item.new_status) && item.event_type === 'STATUS_CHANGED' && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-500">
                          {item.old_status && <span>{KANBAN_COLUMNS.find(c => c.id === item.old_status)?.title || item.old_status}</span>}
                          {item.old_status && item.new_status && <span>→</span>}
                          {item.new_status && <span className="text-blue-500">{KANBAN_COLUMNS.find(c => c.id === item.new_status)?.title || item.new_status}</span>}
                        </div>
                      )}

                      <p className="mt-1.5 text-[10px] opacity-60" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(item.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aksiyon Butonları */}
          <div className="mt-8 flex gap-3 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => onEdit(application)}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              Düzenle
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
              >
                Sil
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => onDelete(application.id)} className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600">
                  Evet, Sil
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
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
