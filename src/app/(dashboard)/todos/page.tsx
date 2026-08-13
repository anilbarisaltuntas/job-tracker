'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { DragDropContext, Draggable, Droppable, type DraggableProvidedDragHandleProps, type DropResult } from '@hello-pangea/dnd'
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TodoTask } from '@/lib/types'
import TodoForm from '@/components/todos/TodoForm'
import { Button } from '@/components/ui/Button'
import { FeedbackBanner } from '@/components/ui/FeedbackBanner'
import { Skeleton } from '@/components/ui/Skeleton'

const PRIORITY_STYLES = {
  low: { label: 'Düşük', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  medium: { label: 'Orta', className: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  high: { label: 'Yüksek', className: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400' },
}

const CATEGORY_LABELS = {
  general: 'Genel',
  interview: 'Mülakat hazırlığı',
  cv: 'CV / Portfolyo',
  networking: 'Networking',
}

const STATUS_STYLES = {
  pending: { label: 'Bekliyor', className: 'border-[var(--border)] bg-[var(--badge-bg)] text-[var(--text-secondary)]' },
  in_progress: { label: 'Devam ediyor', className: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400' },
  completed: { label: 'Tamamlandı', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
}

interface TaskRowProps {
  task: TodoTask
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  onToggle: (task: TodoTask) => void
  onEdit: (task: TodoTask) => void
  onDelete: (task: TodoTask) => void
}

function formatTaskDate(date: string | null) {
  if (!date) return 'Tarih Belirlenmedi'

  const value = new Date(date)
  const today = new Date()
  const isToday = value.toDateString() === today.toDateString()

  return value.toLocaleString('tr-TR', {
    ...(isToday ? {} : { day: 'numeric', month: 'short' }),
    hour: '2-digit',
    minute: '2-digit',
  }).replace(/^/, isToday ? 'Bugün · ' : '')
}

function TaskRow({ task, dragHandleProps, onToggle, onEdit, onDelete }: TaskRowProps) {
  const isCompleted = task.status === 'completed'
  const priority = PRIORITY_STYLES[task.priority]
  const status = STATUS_STYLES[task.status]
  const displayDate = isCompleted
    ? (task.completed_at || task.updated_at || task.created_at)
    : task.due_date

  return (
    <article className={`group rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-xs)] transition-[border-color,background-color] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] ${isCompleted ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        {dragHandleProps ? (
          <button
            type="button"
            {...dragHandleProps}
            className="mt-0.5 flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded-[5px] text-[var(--text-tertiary)] hover:bg-[var(--badge-bg)] hover:text-[var(--text-primary)] active:cursor-grabbing"
            aria-label={`${task.title} görevini sürükle`}
            title="Bugün bölümüne sürükle"
          >
            <GripVertical aria-hidden="true" size={14} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onToggle(task)}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
            isCompleted
              ? 'bg-[var(--accent)] text-white'
              : 'border-2 border-[var(--border-strong)] text-transparent hover:border-[var(--accent)] hover:text-[var(--accent)]'
          }`}
          aria-label={isCompleted ? `${task.title} görevini yeniden aç` : `${task.title} görevini tamamla`}
        >
          {isCompleted ? <Check aria-hidden="true" size={14} strokeWidth={3} /> : <Circle aria-hidden="true" size={8} fill="currentColor" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className={`text-sm font-bold leading-5 text-[var(--text-primary)] ${isCompleted ? 'line-through decoration-[var(--text-tertiary)]' : ''}`}>{task.title}</h3>
              {task.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{task.description}</p> : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${status.className}`}>
                {task.status === 'completed' ? <CheckCircle2 aria-hidden="true" size={11} /> : task.status === 'in_progress' ? <Circle aria-hidden="true" size={10} fill="currentColor" /> : <Clock3 aria-hidden="true" size={11} />}
                {status.label}
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--badge-bg)] px-2 py-1 text-[10px] font-semibold text-[var(--text-secondary)]">{CATEGORY_LABELS[task.category]}</span>
              <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${priority.className}`}>{priority.label}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 border-t border-[var(--border)] pt-3 sm:grid-cols-2 xl:grid-cols-[minmax(165px,0.6fr)_minmax(0,1.4fr)_auto] xl:items-center">
            <div className="flex min-h-12 items-center gap-2.5 rounded-[8px] bg-[var(--bg-elevated)] px-3 py-2">
              <CalendarDays aria-hidden="true" size={14} className="shrink-0 text-[var(--text-tertiary)]" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">{isCompleted ? 'Tamamlanma' : 'Planlanan'}</p>
                <p className="mt-0.5 whitespace-nowrap text-[11px] font-semibold text-[var(--text-secondary)]">{formatTaskDate(displayDate)}</p>
              </div>
            </div>

            {task.application_id && task.application ? (
              <Link href="/board" className="flex min-h-12 min-w-0 items-center gap-2.5 rounded-[8px] bg-[var(--bg-elevated)] px-3 py-2 transition-colors hover:bg-[var(--badge-bg)]">
                <BriefcaseBusiness aria-hidden="true" size={14} className="shrink-0 text-[var(--text-tertiary)]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-[var(--text-primary)]">{task.application.company_name}</span>
                  <span className="mt-0.5 block truncate text-[10px] font-medium text-[var(--text-tertiary)]">{task.application.position}</span>
                </span>
                <ChevronRight aria-hidden="true" size={13} className="shrink-0 text-[var(--text-tertiary)]" />
              </Link>
            ) : (
              <div className="flex min-h-12 items-center gap-2.5 rounded-[8px] border border-dashed border-[var(--border)] px-3 py-2 text-[10px] font-medium text-[var(--text-tertiary)]">
                <BriefcaseBusiness aria-hidden="true" size={14} /> Başvuru bağlantısı yok
              </div>
            )}

            <div className="flex items-center justify-end gap-1 sm:col-span-2 xl:col-span-1">
              <Button variant="ghost" size="sm" className="!h-8 !px-2.5 !text-xs" onClick={() => onEdit(task)}>
                <Pencil aria-hidden="true" size={13} /> Düzenle
              </Button>
              <Button variant="ghost" size="icon" className="!h-8 !w-8 !text-[var(--danger)]" onClick={() => onDelete(task)} aria-label={`${task.title} görevini sil`}>
                <Trash2 aria-hidden="true" size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function TaskSection({
  title,
  description,
  icon: Icon,
  tasks,
  emptyText,
  droppableId,
  canDrag = false,
  onToggle,
  onEdit,
  onDelete,
}: {
  title: string
  description: string
  icon: typeof CalendarDays
  tasks: TodoTask[]
  emptyText: string
  droppableId?: 'today-tasks' | 'upcoming-tasks'
  canDrag?: boolean
  onToggle: (task: TodoTask) => void
  onEdit: (task: TodoTask) => void
  onDelete: (task: TodoTask) => void
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-tertiary)]">
          <Icon aria-hidden="true" size={15} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">{title}</h2>
            <span className="rounded-full bg-[var(--badge-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-secondary)]">{tasks.length}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{description}</p>
        </div>
      </div>

      {droppableId ? (
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-24 rounded-[12px] transition-[background-color,box-shadow] ${snapshot.isDraggingOver ? 'bg-[var(--accent-subtle)] shadow-[inset_0_0_0_1px_var(--accent-border)]' : ''}`}
            >
              {tasks.length === 0 ? (
                <div className={`flex min-h-24 items-center justify-center rounded-[12px] border border-dashed px-5 text-center text-xs ${snapshot.isDraggingOver ? 'border-[var(--accent-border)] text-[var(--accent-strong)]' : 'border-[var(--border-strong)] bg-[var(--bg-surface)]/45 text-[var(--text-tertiary)]'}`}>
                  {snapshot.isDraggingOver ? 'Bugün için buraya bırak' : emptyText}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!canDrag}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={dragSnapshot.isDragging ? 'z-50 rotate-[0.5deg] opacity-95 shadow-[var(--shadow-lg)]' : ''}
                        >
                          <TaskRow task={task} dragHandleProps={canDrag ? dragProvided.dragHandleProps : null} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ) : tasks.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]/45 px-5 py-8 text-center text-xs text-[var(--text-tertiary)]">{emptyText}</div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}
        </div>
      )}
    </section>
  )
}

export default function TodosPage() {
  const supabase = useMemo(() => createClient(), [])
  const [tasks, setTasks] = useState<TodoTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null)
  const [deletingTask, setDeletingTask] = useState<TodoTask | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('todo_tasks')
      .select('*, application:applications(id, company_name, company_domain, position)')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Görevler yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.')
    } else {
      setTasks(data || [])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    // Initial remote task synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTasks()
  }, [fetchTasks])

  const groupedTasks = useMemo(() => {
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    const openTasks = tasks.filter(task => task.status !== 'completed')
    const today = openTasks.filter(task => task.due_date && new Date(task.due_date) <= endOfToday)
    const upcoming = openTasks.filter(task => !task.due_date || new Date(task.due_date) > endOfToday)
    const completed = tasks
      .filter(task => task.status === 'completed')
      .toSorted((first, second) => new Date(second.completed_at || second.updated_at).getTime() - new Date(first.completed_at || first.updated_at).getTime())

    return { today, upcoming, completed }
  }, [tasks])

  const handleToggleStatus = async (task: TodoTask) => {
    const previousTasks = tasks
    const nextStatus: TodoTask['status'] = task.status === 'completed' ? 'pending' : 'completed'
    const completedAt = nextStatus === 'completed' ? new Date().toISOString() : null

    setTasks(current => current.map(item => item.id === task.id ? { ...item, status: nextStatus, completed_at: completedAt } : item))
    setError(null)

    const { error: updateError } = await supabase
      .from('todo_tasks')
      .update({ status: nextStatus, completed_at: completedAt, updated_at: new Date().toISOString() })
      .eq('id', task.id)

    if (updateError) {
      setTasks(previousTasks)
      setError('Görev durumu güncellenemedi. Değişiklik geri alındı.')
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId !== 'upcoming-tasks' || destination.droppableId !== 'today-tasks') return

    const task = tasks.find(item => item.id === draggableId)
    if (!task) return

    const previousTasks = tasks
    const dueDate = new Date().toISOString()
    setTasks(current => current.map(item => item.id === draggableId ? { ...item, due_date: dueDate } : item))
    setError(null)

    const { error: updateError } = await supabase
      .from('todo_tasks')
      .update({ due_date: dueDate, updated_at: new Date().toISOString() })
      .eq('id', draggableId)

    if (updateError) {
      setTasks(previousTasks)
      setError('Görev Bugün bölümüne taşınamadı. Değişiklik geri alındı.')
    }
  }

  const handleDelete = async () => {
    if (!deletingTask) return

    const task = deletingTask
    const previousTasks = tasks
    setDeletingTask(null)
    setTasks(current => current.filter(item => item.id !== task.id))

    const { error: deleteError } = await supabase.from('todo_tasks').delete().eq('id', task.id)
    if (deleteError) {
      setTasks(previousTasks)
      setError('Görev silinemedi. Kayıt listeye geri getirildi.')
    }
  }

  const openForm = (task: TodoTask | null = null) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  return (
    <>
      <section className="p-4 sm:p-6 lg:p-8">
        <div className="w-full">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Ajanda</p>
              <h1 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-[var(--text-primary)]">Görevler</h1>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">Başvuruların için sıradaki adımları tek bir akışta takip et.</p>
            </div>
            <Button variant="primary" onClick={() => openForm()}>
              <Plus aria-hidden="true" size={15} /> Yeni görev
            </Button>
          </div>

          {error ? (
            <FeedbackBanner message={error} onRetry={() => void fetchTasks()} onDismiss={() => setError(null)} className="mb-5" />
          ) : null}

          {loading ? (
            <div className="space-y-7" aria-label="Görevler yükleniyor" role="status">
              {[2, 3].map((rowCount, sectionIndex) => (
                <div key={sectionIndex}>
                  <Skeleton className="mb-3 h-9 w-40" />
                  <div className="space-y-2.5">
                    {Array.from({ length: rowCount }, (_, index) => <Skeleton key={index} className="h-28 rounded-[12px]" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-[14px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]/45 px-6 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-[11px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"><CheckCircle2 aria-hidden="true" size={20} /></div>
              <h2 className="mt-4 text-sm font-bold text-[var(--text-primary)]">Henüz görev yok</h2>
              <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--text-tertiary)]">Bir başvurunun sonraki adımını ekleyerek ajandanı oluşturmaya başlayabilirsin.</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => openForm()}><Plus aria-hidden="true" size={14} /> İlk görevi ekle</Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={result => void handleDragEnd(result)}>
              <div className="grid grid-cols-1 gap-9 lg:grid-cols-2 lg:items-start lg:gap-6 xl:gap-8">
                <div className="space-y-9">
                  <TaskSection title="Bugün" description="Bugün odaklanacağın görevler" icon={CalendarDays} tasks={groupedTasks.today} emptyText="Bugün için planlanmış görev bulunmuyor." droppableId="today-tasks" onToggle={task => void handleToggleStatus(task)} onEdit={openForm} onDelete={setDeletingTask} />
                  <TaskSection title="Yaklaşan" description="Bir görevi Bugün'e taşımak için sürükle" icon={Clock3} tasks={groupedTasks.upcoming} emptyText="Yaklaşan görev bulunmuyor." droppableId="upcoming-tasks" canDrag onToggle={task => void handleToggleStatus(task)} onEdit={openForm} onDelete={setDeletingTask} />
                </div>
                <div className="lg:sticky lg:top-24">
                  <TaskSection title="Tamamlanan" description="Son tamamlanan görevler" icon={CheckCircle2} tasks={groupedTasks.completed} emptyText="Henüz tamamlanan görev yok." onToggle={task => void handleToggleStatus(task)} onEdit={openForm} onDelete={setDeletingTask} />
                </div>
              </div>
            </DragDropContext>
          )}
        </div>
      </section>

      {isFormOpen ? (
        <TodoForm
          editingTodo={editingTask}
          onClose={() => { setIsFormOpen(false); setEditingTask(null) }}
          onSave={() => { setIsFormOpen(false); setEditingTask(null); void fetchTasks() }}
        />
      ) : null}

      {deletingTask ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setDeletingTask(null) }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="todo-delete-title" aria-describedby="todo-delete-description" className="w-full max-w-sm rounded-[14px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-lg)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--danger-subtle)] text-[var(--danger)]"><Trash2 aria-hidden="true" size={18} /></div>
              <div className="min-w-0 flex-1">
                <h2 id="todo-delete-title" className="text-base font-bold text-[var(--text-primary)]">Görevi sil?</h2>
                <p id="todo-delete-description" className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">“{deletingTask.title}” kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>
              </div>
              <button type="button" onClick={() => setDeletingTask(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" aria-label="Silme onayını kapat"><X aria-hidden="true" size={17} /></button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeletingTask(null)} autoFocus>Vazgeç</Button>
              <Button variant="danger" onClick={() => void handleDelete()}><Trash2 aria-hidden="true" size={15} /> Evet, sil</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
