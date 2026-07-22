'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TodoTask } from '@/lib/types'
import Header from '@/components/layout/Header'
import TodoForm from '@/components/todos/TodoForm'
import Link from 'next/link'

const PRIORITY_STYLES = {
  low: { label: 'Düşük', color: 'text-green-600 bg-green-500/10' },
  medium: { label: 'Orta', color: 'text-yellow-600 bg-yellow-500/10' },
  high: { label: 'Yüksek', color: 'text-red-600 bg-red-500/10' }
}

const CATEGORY_LABELS = {
  general: 'Genel',
  interview: 'Mülakat Hazırlığı',
  cv: 'CV/Portfolyo',
  networking: 'Networking'
}

export default function TodosPage() {
  const [tasks, setTasks] = useState<TodoTask[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null)
  const supabase = createClient()

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('todo_tasks')
      .select('*, application:applications(id, company_name, position)')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    
    if (data && !error) setTasks(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleToggleStatus = async (task: TodoTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    // Update local state first for instant UI response
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    
    await supabase
      .from('todo_tasks')
      .update({ status: newStatus })
      .eq('id', task.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Görevi silmek istediğinize emin misiniz?')) return
    setTasks(tasks.filter(t => t.id !== id))
    await supabase.from('todo_tasks').delete().eq('id', id)
  }

  const openForm = (task: TodoTask | null = null) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleFormSave = () => {
    setIsFormOpen(false)
    fetchTasks()
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  const TaskRow = ({ task }: { task: TodoTask }) => {
    const isCompleted = task.status === 'completed'
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted

    return (
      <div 
        className={`group flex items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${
          isCompleted ? 'opacity-60 grayscale' : ''
        }`}
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Checkbox */}
        <button 
          onClick={() => handleToggleStatus(task)}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            isCompleted 
              ? 'border-blue-500 bg-blue-500 text-white' 
              : 'border-slate-300 hover:border-blue-400'
          }`}
        >
          {isCompleted && '✓'}
        </button>

        {/* İçerik */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className={`text-base font-semibold ${isCompleted ? 'line-through text-slate-400' : ''}`} style={{ color: isCompleted ? undefined : 'var(--text-primary)' }}>
              {task.title}
            </h3>
            
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {CATEGORY_LABELS[task.category]}
              </span>
              <span className={`rounded-full px-2.5 py-1 ${PRIORITY_STYLES[task.priority].color}`}>
                {PRIORITY_STYLES[task.priority].label} Öncelik
              </span>
            </div>
          </div>

          {task.description && (
            <p className="mt-1 text-sm line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
              {task.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
            {task.due_date && (
              <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                📅 {new Date(task.due_date).toLocaleDateString('tr-TR')}
                {isOverdue && ' (Gecikti)'}
              </span>
            )}
            
            {task.application_id && task.application && (
              <Link 
                href="/board" 
                className="flex items-center gap-1 font-medium text-blue-500 hover:underline"
              >
                🔗 {task.application.company_name} - {task.application.position}
              </Link>
            )}
          </div>
        </div>

        {/* Aksiyonlar (Hover olunca görünür) */}
        <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button 
            onClick={() => openForm(task)}
            className="rounded p-1.5 text-blue-500 hover:bg-blue-500/10"
            title="Düzenle"
          >
            ✎
          </button>
          <button 
            onClick={() => handleDelete(task.id)}
            className="rounded p-1.5 text-red-500 hover:bg-red-500/10"
            title="Sil"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Görevler
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                İş arama sürecinizdeki işlerinizi planlayın ve takip edin.
              </p>
            </div>
            
            <button
              onClick={() => openForm()}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
            >
              + Yeni Görev Ekle
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Görevler yükleniyor...
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Bekleyenler */}
              <section>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Yapılacaklar ({pendingTasks.length})
                </h3>
                {pendingTasks.length === 0 ? (
                  <p className="text-sm italic text-slate-400 mb-6">Henüz hiç yapılacak göreviniz yok.</p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {pendingTasks.map(task => <TaskRow key={task.id} task={task} />)}
                  </div>
                )}
              </section>

              {/* Tamamlananlar */}
              <section>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Tamamlananlar ({completedTasks.length})
                </h3>
                {completedTasks.length === 0 ? (
                  <p className="text-sm italic text-slate-400">Henüz tamamlanan görev yok.</p>
                ) : (
                  <div className="space-y-3">
                    {completedTasks.map(task => <TaskRow key={task.id} task={task} />)}
                  </div>
                )}
              </section>

            </div>
          )}

        </div>
      </main>

      {isFormOpen && (
        <TodoForm 
          editingTodo={editingTask} 
          onClose={() => setIsFormOpen(false)} 
          onSave={handleFormSave} 
        />
      )}
    </div>
  )
}
