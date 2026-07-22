'use client'

/**
 * APPLICATION DETAIL — Başvuru Detay Modal'ı (v2)
 * 
 * Yenilikler:
 * - Çoklu iletişim kişilerini gösterir
 * - Her kişi için mesaj/mail durumunu gösterir
 */

import { Application, ApplicationHistory, UserStatus, TodoTask } from '@/lib/types'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TodoForm from '@/components/todos/TodoForm'

interface ApplicationDetailProps {
  application: Application
  statuses: UserStatus[]
  onClose: () => void
  onEdit: (app: Application) => void
  onDelete: (appId: string) => void
}

export default function ApplicationDetail({
  application,
  statuses,
  onClose,
  onEdit,
  onDelete,
}: ApplicationDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [history, setHistory] = useState<ApplicationHistory[]>([])
  const [tasks, setTasks] = useState<TodoTask[]>([])
  const [isTodoFormOpen, setIsTodoFormOpen] = useState(false)
  
  const column = statuses.find(col => col.id === application.status)
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

      const { data: tasksData } = await supabase
        .from('todo_tasks')
        .select('*')
        .eq('application_id', application.id)
        .order('due_date', { ascending: true, nullsFirst: false })
      
      if (tasksData) {
        setTasks(tasksData)
      }
    }
    fetchHistory()
  }, [application.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleTaskStatus = async (task: TodoTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    // Optimistic update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    
    await supabase
      .from('todo_tasks')
      .update({ status: newStatus })
      .eq('id', task.id)
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

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

          {/* Görevler (To-Do) */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>✅ Görevler</h3>
              <button 
                onClick={() => setIsTodoFormOpen(true)}
                className="text-xs font-medium text-blue-500 hover:underline"
              >
                + Görev Ekle
              </button>
            </div>
            
            <div className="space-y-4">
              
              {/* Yapılacaklar */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Yapılacaklar</h4>
                {pendingTasks.length === 0 ? (
                  <p className="text-xs italic text-slate-400">Henüz yapılacak görev yok.</p>
                ) : (
                  pendingTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between rounded-xl p-3 border transition-colors hover:shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleToggleTaskStatus(task)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-slate-300 transition-colors hover:border-blue-400"
                        />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {task.title}
                        </span>
                      </div>
                      {task.due_date && (
                        <span className="text-[10px] font-medium opacity-70" style={{ color: 'var(--text-tertiary)' }}>
                          {new Date(task.due_date).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Tamamlananlar */}
              <div className="space-y-2 mt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tamamlananlar</h4>
                {completedTasks.length === 0 ? (
                  <p className="text-xs italic text-slate-400">Henüz tamamlanan görev yok.</p>
                ) : (
                  completedTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between rounded-xl p-3 border opacity-60 grayscale" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleToggleTaskStatus(task)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-blue-500 bg-blue-500 text-white transition-colors"
                        >
                          ✓
                        </button>
                        <span className="text-xs font-medium line-through" style={{ color: 'var(--text-primary)' }}>
                          {task.title}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>

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
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]">
                          <p className="text-sm">
                            {item.old_status && <span>{statuses.find(c => c.id === item.old_status)?.title || item.old_status}</span>}
                            {item.old_status && <span className="mx-2 text-slate-500">→</span>}
                            {item.new_status && <span className="text-blue-500">{statuses.find(c => c.id === item.new_status)?.title || item.new_status}</span>}
                          </p>
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

      {isTodoFormOpen && (
        <TodoForm
          editingTodo={null}
          preselectedApplicationId={application.id}
          onClose={() => setIsTodoFormOpen(false)}
          onSave={() => {
            setIsTodoFormOpen(false)
            // Trigger fetch again
            supabase
              .from('todo_tasks')
              .select('*')
              .eq('application_id', application.id)
              .order('due_date', { ascending: true, nullsFirst: false })
              .then(({ data }) => {
                if (data) setTasks(data)
              })
          }}
        />
      )}
    </div>
  )
}
