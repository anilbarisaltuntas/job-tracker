'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TodoTask } from '@/lib/types'
import Header from '@/components/layout/Header'
import TodoForm from '@/components/todos/TodoForm'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

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
  const [pendingTasks, setPendingTasks] = useState<TodoTask[]>([])
  const [completedTasks, setCompletedTasks] = useState<TodoTask[]>([])
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
    
    if (data && !error) {
      setTasks(data)

      const pending = data.filter(t => t.status !== 'completed')
      const completed = data
        .filter(t => t.status === 'completed')
        .sort((a, b) => {
          const timeA = new Date(a.completed_at || a.updated_at || a.created_at).getTime()
          const timeB = new Date(b.completed_at || b.updated_at || b.created_at).getTime()
          return timeB - timeA
        })

      // Yerel sürükle-bırak sıralama verisini al
      const savedOrderRaw = localStorage.getItem('todo_pending_order')
      if (savedOrderRaw) {
        try {
          const savedOrder: string[] = JSON.parse(savedOrderRaw)
          pending.sort((a, b) => {
            const idxA = savedOrder.indexOf(a.id)
            const idxB = savedOrder.indexOf(b.id)
            if (idxA === -1 && idxB === -1) return 0
            if (idxA === -1) return 1
            if (idxB === -1) return -1
            return idxA - idxB
          })
        } catch (e) {
          // varsayılan sıralamada kalsın
        }
      }

      setPendingTasks(pending)
      setCompletedTasks(completed)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleToggleStatus = async (task: TodoTask) => {
    const newStatus: TodoTask['status'] = task.status === 'completed' ? 'pending' : 'completed'
    const completedAt = newStatus === 'completed' ? (task.completed_at || new Date().toISOString()) : null

    // Anlık arayüz güncellemesi
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus, completed_at: completedAt } : t)
    setTasks(updatedTasks)

    if (newStatus === 'completed') {
      const updatedTask: TodoTask = { ...task, status: newStatus, completed_at: completedAt }
      setPendingTasks(prev => prev.filter(t => t.id !== task.id))
      setCompletedTasks(prev => [updatedTask, ...prev])
    } else {
      const updatedTask: TodoTask = { ...task, status: newStatus, completed_at: null }
      setCompletedTasks(prev => prev.filter(t => t.id !== task.id))
      setPendingTasks(prev => [...prev, updatedTask])
    }
    
    const { error } = await supabase
      .from('todo_tasks')
      .update({ status: newStatus, completed_at: completedAt, updated_at: new Date().toISOString() })
      .eq('id', task.id)

    if (error) {
      await supabase
        .from('todo_tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', task.id)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Görevi silmek istediğinize emin misiniz?')) return
    setTasks(tasks.filter(t => t.id !== id))
    setPendingTasks(pendingTasks.filter(t => t.id !== id))
    setCompletedTasks(completedTasks.filter(t => t.id !== id))
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

  // Sürükle - Bırak İşleyicisi
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { source, destination } = result
    if (source.index === destination.index) return

    if (source.droppableId === 'pending-tasks') {
      const items = Array.from(pendingTasks)
      const [reorderedItem] = items.splice(source.index, 1)
      items.splice(destination.index, 0, reorderedItem)

      setPendingTasks(items)

      // Sıralama ID listesini kaydedelim
      const idOrder = items.map(t => t.id)
      localStorage.setItem('todo_pending_order', JSON.stringify(idOrder))
    } else if (source.droppableId === 'completed-tasks') {
      const items = Array.from(completedTasks)
      const [reorderedItem] = items.splice(source.index, 1)
      items.splice(destination.index, 0, reorderedItem)

      setCompletedTasks(items)
    }
  }

  const TaskRow = ({ task, dragHandleProps }: { task: TodoTask; dragHandleProps?: any }) => {
    const isCompleted = task.status === 'completed'
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted

    return (
      <div 
        className={`group flex items-start gap-2.5 rounded-xl transition-all border p-3 hover:shadow-md ${
          isCompleted ? 'opacity-60 grayscale-[20%]' : ''
        }`}
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Sürükleme Tutamağı (Drag Handle) */}
        <div
          {...dragHandleProps}
          className="flex h-7 w-5 shrink-0 cursor-grab items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] active:cursor-grabbing"
          title="Görevin sırasını değiştirmek için sürükleyin"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="5" r="1"></circle>
            <circle cx="15" cy="5" r="1"></circle>
            <circle cx="9" cy="12" r="1"></circle>
            <circle cx="15" cy="12" r="1"></circle>
            <circle cx="9" cy="19" r="1"></circle>
            <circle cx="15" cy="19" r="1"></circle>
          </svg>
        </div>

        {/* Checkbox */}
        <button 
          onClick={() => handleToggleStatus(task)}
          className={`mt-0.5 flex shrink-0 items-center justify-center rounded transition-colors ${
            isCompleted 
              ? 'h-5 w-5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
              : 'h-5 w-5 border-2 border-slate-300 hover:border-emerald-400'
          }`}
        >
          {isCompleted && <span className="text-[12px] font-bold">✓</span>}
        </button>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className={`text-sm break-words font-semibold`} style={{ color: 'var(--text-primary)' }}>
              {task.title}
            </h3>
            
            {/* Etiketler */}
            <div className="flex shrink-0 flex-wrap justify-end gap-2 text-[10px] font-medium sm:text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {CATEGORY_LABELS[task.category]}
              </span>
              <span className={`rounded-full px-2 py-1 ${PRIORITY_STYLES[task.priority].color}`}>
                {PRIORITY_STYLES[task.priority].label} Öncelik
              </span>
            </div>
          </div>

          {/* Detaylar */}
          {task.description && (
            <p className="mt-1 text-xs break-words" style={{ color: 'var(--text-tertiary)' }}>
              {task.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
            {task.due_date && (
              <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                📅 {new Date(task.due_date).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {isOverdue && ' (Gecikti)'}
              </span>
            )}
            
            {isCompleted && (task.completed_at || task.updated_at) && (
              <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                ✅ Tamamlanma Saati: {new Date(task.completed_at || task.updated_at).toLocaleString('tr-TR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
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
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!isCompleted && (
            <button 
              onClick={() => openForm(task)}
              className="rounded p-1 text-blue-500 hover:bg-blue-500/10 text-xs font-bold"
              title="Düzenle"
            >
              ✎
            </button>
          )}
          <button 
            onClick={() => handleDelete(task.id)}
            className="rounded p-1 text-red-500 hover:bg-red-500/10 text-xs font-bold"
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
        <div className="mx-auto max-w-6xl">
          
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Görevler
              </h2>
              <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                Görevlerinizi sürükleyip bırakarak dilediğiniz sırada düzenleyin.
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
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                
                {/* Bekleyenler (Sol Taraf) */}
                <section className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Yapılacaklar
                      </h3>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {pendingTasks.length}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-tertiary)]">⋮⋮ Sürükleyerek Sırala</span>
                  </div>
                  
                  {pendingTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm italic text-slate-400" style={{ borderColor: 'var(--border)' }}>
                      Henüz hiç yapılacak göreviniz yok.
                    </div>
                  ) : (
                    <Droppable droppableId="pending-tasks">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-3"
                        >
                          {pendingTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={snapshot.isDragging ? 'z-50 opacity-90' : ''}
                                >
                                  <TaskRow
                                    task={task}
                                    dragHandleProps={provided.dragHandleProps}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )}
                </section>

                {/* Tamamlananlar (Sağ Taraf) */}
                <section className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Tamamlananlar
                      </h3>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {completedTasks.length}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-tertiary)]">⋮⋮ Sürükleyerek Sırala</span>
                  </div>
                  
                  {completedTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm italic text-slate-400" style={{ borderColor: 'var(--border)' }}>
                      Henüz tamamlanan görev yok.
                    </div>
                  ) : (
                    <Droppable droppableId="completed-tasks">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-3"
                        >
                          {completedTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={snapshot.isDragging ? 'z-50 opacity-90' : ''}
                                >
                                  <TaskRow
                                    task={task}
                                    dragHandleProps={provided.dragHandleProps}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )}
                </section>

              </div>
            </DragDropContext>
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
