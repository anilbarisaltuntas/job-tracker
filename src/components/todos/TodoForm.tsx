'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Application, TodoTask, TodoTaskFormData, TodoPriority, TodoCategory, TodoStatus } from '@/lib/types'

interface TodoFormProps {
  editingTodo: TodoTask | null
  preselectedApplicationId?: string // If opened from Application Detail
  onClose: () => void
  onSave: () => void
}

const PRIORITIES: { id: TodoPriority, label: string, color: string }[] = [
  { id: 'low', label: 'Düşük', color: 'text-green-500 bg-green-500/10' },
  { id: 'medium', label: 'Orta', color: 'text-yellow-500 bg-yellow-500/10' },
  { id: 'high', label: 'Yüksek', color: 'text-red-500 bg-red-500/10' }
]

const CATEGORIES: { id: TodoCategory, label: string }[] = [
  { id: 'general', label: 'Genel' },
  { id: 'interview', label: 'Mülakat Hazırlığı' },
  { id: 'cv', label: 'CV/Portfolyo' },
  { id: 'networking', label: 'Networking' }
]

export default function TodoForm({ editingTodo, preselectedApplicationId, onClose, onSave }: TodoFormProps) {
  const isEditing = !!editingTodo
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  
  const [formData, setFormData] = useState<TodoTaskFormData>({
    title: editingTodo?.title || '',
    description: editingTodo?.description || '',
    status: editingTodo?.status || 'pending',
    priority: editingTodo?.priority || 'medium',
    category: editingTodo?.category || 'general',
    due_date: editingTodo?.due_date ? new Date(editingTodo.due_date).toISOString().split('T')[0] : '',
    application_id: editingTodo?.application_id || preselectedApplicationId || ''
  })

  useEffect(() => {
    const fetchApplications = async () => {
      const { data } = await supabase
        .from('applications')
        .select('id, company_name, position')
        .order('created_at', { ascending: false })
      if (data) setApplications(data)
    }
    fetchApplications()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      ...formData,
      application_id: formData.application_id || null, // convert empty string to null
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
      user_id: user.id
    }

    if (isEditing && editingTodo) {
      const { error } = await supabase
        .from('todo_tasks')
        .update(payload)
        .eq('id', editingTodo.id)
      
      if (!error) onSave()
    } else {
      const { error } = await supabase
        .from('todo_tasks')
        .insert([payload])
      
      if (!error) onSave()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div 
        className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isEditing ? 'Görevi Düzenle' : 'Yeni Görev'}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-500/10" style={{ color: 'var(--text-tertiary)' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Görev Başlığı *</label>
            <input 
              required 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="ör: Google için sunum hazırla"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Açıklama</label>
            <textarea 
              value={formData.description || ''} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={3}
              placeholder="Görev detayları..."
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Öncelik</label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as TodoPriority})}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Kategori</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as TodoCategory})}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Bitiş Tarihi</label>
              <input 
                type="date"
                value={formData.due_date || ''}
                onChange={e => setFormData({...formData, due_date: e.target.value})}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            
            {!preselectedApplicationId && (
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>İş Başvurusu Bağlantısı</label>
                <select 
                  value={formData.application_id || ''}
                  onChange={e => setFormData({...formData, application_id: e.target.value})}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">(Bağlantı Yok)</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>{app.company_name} - {app.position}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-500/10"
              style={{ color: 'var(--text-tertiary)' }}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl px-5 py-2 text-sm font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
            >
              {loading ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Ekle'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
