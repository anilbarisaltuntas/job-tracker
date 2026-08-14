'use client'

import { useEffect, useMemo, useState } from 'react'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import {
  Check,
  CircleDot,
  GripVertical,
  LayoutDashboard,
  Moon,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Sun,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FeedbackBanner } from '@/components/ui/FeedbackBanner'
import { Skeleton } from '@/components/ui/Skeleton'
import { useTheme } from '@/context/ThemeContext'
import { useStatuses } from '@/hooks/useStatuses'
import { createClient } from '@/lib/supabase/client'
import type { UserStatus } from '@/lib/types'

type SettingsTab = 'board' | 'appearance'
type Feedback = { type: 'success' | 'error'; text: string }

const STATUS_LIMIT = 8

const STATUS_COLORS = [
  { color: '#3B82F6', background: '#EFF6FF', label: 'Mavi' },
  { color: '#8B5CF6', background: '#F5F3FF', label: 'Mor' },
  { color: '#EC4899', background: '#FDF2F8', label: 'Pembe' },
  { color: '#F97316', background: '#FFF7ED', label: 'Turuncu' },
  { color: '#F59E0B', background: '#FFFBEB', label: 'Amber' },
  { color: '#10B981', background: '#ECFDF5', label: 'Yeşil' },
  { color: '#06B6D4', background: '#ECFEFF', label: 'Turkuaz' },
  { color: '#EF4444', background: '#FEF2F2', label: 'Kırmızı' },
]

const STATUS_ICONS = [
  '📌', '📝', '📋', '🗂️', '🔖',
  '📤', '📨', '📬', '📧', '✉️',
  '💬', '🗨️', '📞', '🔔', '👀',
  '🔍', '🕒', '⏳', '⏸️', '🔄',
  '⚡', '🧭', '🤝', '👋', '🧑‍💻',
  '💼', '🗓️', '🎤', '🎯', '🧪',
  '✅', '☑️', '⭐', '🚀', '🎉',
  '🏆', '💡', '🔥', '⭕', '⚠️',
  '🚫', '❌',
]

function cloneStatuses(statuses: UserStatus[]) {
  return statuses.map(status => ({ ...status }))
}

function statusFingerprint(statuses: UserStatus[]) {
  return JSON.stringify(statuses.map(({ id, title, emoji, color, bg_color }, index) => ({
    id,
    title,
    emoji,
    color,
    bg_color,
    order_index: index,
  })))
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), [])
  const { statuses, setStatuses, loading } = useStatuses()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<SettingsTab>('board')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [openPicker, setOpenPicker] = useState<{ id: string; type: 'icon' | 'color' } | null>(null)
  const [savedStatuses, setSavedStatuses] = useState<UserStatus[] | null>(null)

  useEffect(() => {
    if (!loading && savedStatuses === null) {
      // Capture the server state once so local edits can be compared and reverted.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedStatuses(cloneStatuses(statuses))
    }
  }, [loading, savedStatuses, statuses])

  const initialFingerprint = savedStatuses ? statusFingerprint(savedStatuses) : statusFingerprint([])
  const isDirty = !loading && statusFingerprint(statuses) !== initialFingerprint
  const hasInvalidTitle = statuses.some(status => !status.title.trim())

  const updateStatus = (id: string, changes: Partial<UserStatus>) => {
    setStatuses(current => current.map(status => status.id === id ? { ...status, ...changes } : status))
    setFeedback(null)
  }

  const handleAddStatus = () => {
    if (statuses.length >= STATUS_LIMIT) {
      setFeedback({ type: 'error', text: `En fazla ${STATUS_LIMIT} pano durumu oluşturabilirsin.` })
      return
    }

    const palette = STATUS_COLORS[statuses.length % STATUS_COLORS.length]
    const newStatus: UserStatus = {
      id: crypto.randomUUID(),
      user_id: statuses[0]?.user_id || '',
      title: 'Yeni durum',
      emoji: '📌',
      color: palette.color,
      bg_color: palette.background,
      order_index: statuses.length,
    }

    setStatuses(current => [...current, newStatus])
    setFeedback(null)
  }

  const handleDeleteStatus = async (id: string) => {
    const status = statuses.find(item => item.id === id)
    if (!status) return

    if (statuses.length === 1) {
      setFeedback({ type: 'error', text: 'Panoda en az bir durum bulunmalı.' })
      return
    }

    setFeedback(null)
    const { count, error } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', id)

    if (error) {
      setFeedback({ type: 'error', text: 'Bu durumun kullanımı kontrol edilemedi. Lütfen tekrar dene.' })
      return
    }

    if (count && count > 0) {
      setFeedback({
        type: 'error',
        text: `“${status.title}” durumunda ${count} başvuru var. Önce bu başvuruları başka bir sütuna taşımalısın.`,
      })
      return
    }

    setStatuses(current => current.filter(item => item.id !== id))
    setOpenPicker(current => current?.id === id ? null : current)
  }

  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || destination.index === source.index) return

    setStatuses(current => {
      const reordered = [...current]
      const [moved] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, moved)
      return reordered.map((status, index) => ({ ...status, order_index: index }))
    })
    setFeedback(null)
  }

  const handleDiscard = () => {
    if (!savedStatuses) return
    setStatuses(cloneStatuses(savedStatuses))
    setOpenPicker(null)
    setFeedback(null)
  }

  const handleSave = async () => {
    if (hasInvalidTitle) {
      setFeedback({ type: 'error', text: 'Tüm pano durumlarının bir adı olmalı.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (userError || !userId) {
      setFeedback({ type: 'error', text: 'Oturum bulunamadı. Lütfen yeniden giriş yap.' })
      setIsSaving(false)
      return
    }

    const statusesToSave: UserStatus[] = statuses.map((status, index) => ({
      id: status.id,
      user_id: userId,
      title: status.title.trim(),
      emoji: status.emoji,
      color: status.color,
      bg_color: status.bg_color,
      order_index: index,
    }))

    const { data: remoteStatuses, error: fetchError } = await supabase
      .from('user_statuses')
      .select('id')
      .eq('user_id', userId)

    if (fetchError) {
      setFeedback({ type: 'error', text: 'Mevcut pano durumları kontrol edilemedi.' })
      setIsSaving(false)
      return
    }

    const nextIds = new Set(statusesToSave.map(status => status.id))
    const removedIds = (remoteStatuses || []).map(status => status.id).filter(id => !nextIds.has(id))

    if (statusesToSave.length > 0) {
      const { error: upsertError } = await supabase
        .from('user_statuses')
        .upsert(statusesToSave, { onConflict: 'id,user_id' })

      if (upsertError) {
        console.error('Pano durumları kaydedilemedi:', upsertError)
        setFeedback({ type: 'error', text: 'Değişiklikler kaydedilemedi. Lütfen tekrar dene.' })
        setIsSaving(false)
        return
      }
    }

    if (removedIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('user_statuses')
        .delete()
        .eq('user_id', userId)
        .in('id', removedIds)

      if (deleteError) {
        setFeedback({ type: 'error', text: 'Kaldırılan pano durumları kaydedilemedi.' })
        setIsSaving(false)
        return
      }
    }

    setSavedStatuses(cloneStatuses(statusesToSave))
    setStatuses(statusesToSave)
    setOpenPicker(null)
    setFeedback({ type: 'success', text: 'Pano ayarları kaydedildi.' })
    setIsSaving(false)
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 border-b border-[var(--border)] pb-6">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">Çalışma alanı</p>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)] sm:text-3xl">Ayarlar</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-secondary)]">
          Pano akışını ve uygulamanın görünümünü çalışma biçimine göre düzenle.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Ayar bölümleri" className="h-fit rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-1.5 shadow-[var(--shadow-xs)] lg:sticky lg:top-24">
          <button
            type="button"
            onClick={() => setActiveTab('board')}
            aria-current={activeTab === 'board' ? 'page' : undefined}
            className={`flex min-h-11 w-full items-center gap-3 rounded-[8px] px-3 text-left text-sm font-semibold transition-colors ${activeTab === 'board' ? 'bg-[var(--accent-subtle)] text-[var(--accent-strong)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'}`}
          >
            <LayoutDashboard aria-hidden="true" size={17} />
            Pano
            {isDirty ? <span className="ml-auto h-2 w-2 rounded-full bg-[var(--accent)]" aria-label="Kaydedilmemiş değişiklik var" /> : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            aria-current={activeTab === 'appearance' ? 'page' : undefined}
            className={`mt-1 flex min-h-11 w-full items-center gap-3 rounded-[8px] px-3 text-left text-sm font-semibold transition-colors ${activeTab === 'appearance' ? 'bg-[var(--accent-subtle)] text-[var(--accent-strong)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'}`}
          >
            <Palette aria-hidden="true" size={17} />
            Görünüm
          </button>
        </nav>

        <main className="min-w-0">
          {feedback ? (
            <FeedbackBanner message={feedback.text} tone={feedback.type} onDismiss={() => setFeedback(null)} className="mb-4" />
          ) : null}

          {activeTab === 'board' ? (
            <section aria-labelledby="board-settings-title" className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
              <div className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="board-settings-title" className="text-base font-bold tracking-[-0.02em] text-[var(--text-primary)]">Pano durumları</h2>
                    <span className="rounded-full bg-[var(--badge-bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--text-secondary)]">{statuses.length}/{STATUS_LIMIT}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-tertiary)]">Sütunları tutup sürükleyerek sırala; adını, simgesini ve rengini düzenle.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleAddStatus} disabled={statuses.length >= STATUS_LIMIT || loading}>
                  <Plus aria-hidden="true" size={15} />
                  Yeni durum
                </Button>
              </div>

              {loading ? (
                <div className="space-y-3 p-4 sm:p-5" aria-label="Pano durumları yükleniyor" role="status">
                  {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-[74px] rounded-[10px]" />)}
                </div>
              ) : statuses.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                  <CircleDot aria-hidden="true" size={22} className="mb-4 text-[var(--text-tertiary)]" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Pano durumu bulunmuyor</h3>
                  <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">Başvurularını panoda takip etmek için ilk durumunu oluştur.</p>
                  <Button variant="secondary" size="sm" onClick={handleAddStatus} className="mt-4"><Plus aria-hidden="true" size={15} />Durum ekle</Button>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="settings-statuses">
                    {provided => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 p-4 sm:p-5">
                        {statuses.map((status, index) => (
                          <Draggable key={status.id} draggableId={status.id} index={index}>
                            {(dragProvided, snapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={`relative rounded-[11px] border bg-[var(--bg-elevated)] transition-[border-color,box-shadow] ${snapshot.isDragging ? 'z-20 border-[var(--accent-border)] shadow-[var(--shadow-lg)]' : 'border-[var(--border)] hover:border-[var(--border-hover)]'}`}
                              >
                                <div className="flex min-h-[72px] items-center gap-2.5 p-3 sm:gap-3">
                                  <button
                                    type="button"
                                    {...dragProvided.dragHandleProps}
                                    className="flex h-10 w-7 shrink-0 cursor-grab items-center justify-center rounded-[7px] text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-secondary)] active:cursor-grabbing"
                                    aria-label={`${status.title} durumunu sırala`}
                                  >
                                    <GripVertical aria-hidden="true" size={18} />
                                  </button>

                                  <span className="hidden w-5 shrink-0 text-center text-xs font-bold tabular-nums text-[var(--text-tertiary)] sm:block">{index + 1}</span>

                                  <button
                                    type="button"
                                    onClick={() => setOpenPicker(current => current?.id === status.id && current.type === 'icon' ? null : { id: status.id, type: 'icon' })}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] border border-[var(--border)] bg-[var(--bg-column)] text-lg hover:border-[var(--border-hover)]"
                                    aria-label={`${status.title} simgesini değiştir`}
                                    aria-expanded={openPicker?.id === status.id && openPicker.type === 'icon'}
                                  >
                                    {status.emoji}
                                  </button>

                                  <input
                                    value={status.title}
                                    onChange={event => updateStatus(status.id, { title: event.target.value })}
                                    className="h-10 min-w-0 flex-1 rounded-[8px] border border-transparent bg-transparent px-2 text-sm font-semibold text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] focus:border-[var(--input-border)] focus:bg-[var(--input-bg)]"
                                    aria-label={`${index + 1}. durum adı`}
                                    placeholder="Durum adı"
                                    maxLength={80}
                                  />

                                  <button
                                    type="button"
                                    onClick={() => setOpenPicker(current => current?.id === status.id && current.type === 'color' ? null : { id: status.id, type: 'color' })}
                                    className="flex h-10 shrink-0 items-center gap-2 rounded-[8px] border border-[var(--border)] px-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                                    aria-label={`${status.title} rengini değiştir`}
                                    aria-expanded={openPicker?.id === status.id && openPicker.type === 'color'}
                                  >
                                    <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: status.color }} aria-hidden="true" />
                                    <span className="hidden sm:inline">Renk</span>
                                  </button>

                                  <Button variant="ghost" size="icon" onClick={() => void handleDeleteStatus(status.id)} aria-label={`${status.title} durumunu sil`} className="hover:!bg-[var(--danger-subtle)] hover:!text-[var(--danger)]">
                                    <Trash2 aria-hidden="true" size={16} />
                                  </Button>
                                </div>

                                {openPicker?.id === status.id ? (
                                  <div className="border-t border-[var(--border)] px-3 py-3 sm:pl-[90px]">
                                    {openPicker.type === 'icon' ? (
                                      <div className="grid max-h-56 grid-cols-6 gap-2 overflow-y-auto pr-1 sm:grid-cols-10" aria-label="Simge seçenekleri">
                                        {STATUS_ICONS.map(icon => (
                                          <button key={icon} type="button" onClick={() => { updateStatus(status.id, { emoji: icon }); setOpenPicker(null) }} className={`flex h-9 w-9 items-center justify-center rounded-[8px] border text-base transition-colors ${status.emoji === icon ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)] hover:bg-[var(--bg-surface-hover)]'}`} aria-label={`${icon} simgesini seç`}>{icon}</button>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2" aria-label="Renk seçenekleri">
                                        {STATUS_COLORS.map(option => (
                                          <button key={option.color} type="button" onClick={() => { updateStatus(status.id, { color: option.color, bg_color: option.background }); setOpenPicker(null) }} className={`flex h-9 items-center gap-2 rounded-[8px] border px-2.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors ${status.color === option.color ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)] hover:bg-[var(--bg-surface-hover)]'}`} aria-label={`${option.label} rengini seç`}>
                                            <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: option.color }} aria-hidden="true" />
                                            {option.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}

              <div className="sticky bottom-0 flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--bg-elevated)]/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className={`h-2 w-2 rounded-full ${isDirty ? 'bg-[var(--accent)]' : 'bg-emerald-500'}`} aria-hidden="true" />
                  <span className={isDirty ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'}>{isDirty ? 'Kaydedilmemiş değişiklikler var' : 'Tüm değişiklikler kaydedildi'}</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={!isDirty || isSaving}><RotateCcw aria-hidden="true" size={14} />Geri al</Button>
                  <Button variant="primary" size="sm" onClick={() => void handleSave()} disabled={!isDirty || isSaving || hasInvalidTitle}><Save aria-hidden="true" size={14} />{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}</Button>
                </div>
              </div>
            </section>
          ) : (
            <section aria-labelledby="appearance-settings-title" className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
              <div className="border-b border-[var(--border)] px-4 py-4 sm:px-5">
                <h2 id="appearance-settings-title" className="text-base font-bold tracking-[-0.02em] text-[var(--text-primary)]">Görünüm</h2>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">Arayüz temasını seç. Değişiklik tüm uygulamaya anında uygulanır.</p>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                <button type="button" onClick={() => setTheme('light')} aria-pressed={theme === 'light'} className={`rounded-[12px] border p-3 text-left transition-[border-color,box-shadow] ${theme === 'light' ? 'border-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]' : 'border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
                  <div className="overflow-hidden rounded-[8px] border border-[#dedbd5] bg-[#f6f4ef] p-3">
                    <div className="mb-3 h-2 w-20 rounded-full bg-[#292827]/75" />
                    <div className="grid grid-cols-3 gap-2">
                      <span className="h-16 rounded-[5px] border border-[#dedbd5] bg-white" />
                      <span className="h-16 rounded-[5px] border border-[#dedbd5] bg-white" />
                      <span className="h-16 rounded-[5px] border border-[#dedbd5] bg-white" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Sun aria-hidden="true" size={16} className="text-[var(--text-secondary)]" />
                    <span className="text-sm font-bold text-[var(--text-primary)]">Açık tema</span>
                    {theme === 'light' ? <Check aria-hidden="true" size={16} className="ml-auto text-[var(--accent-strong)]" /> : null}
                  </div>
                </button>

                <button type="button" onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'} className={`rounded-[12px] border p-3 text-left transition-[border-color,box-shadow] ${theme === 'dark' ? 'border-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]' : 'border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
                  <div className="overflow-hidden rounded-[8px] border border-[#343330] bg-[#171716] p-3">
                    <div className="mb-3 h-2 w-20 rounded-full bg-[#f2eee7]/75" />
                    <div className="grid grid-cols-3 gap-2">
                      <span className="h-16 rounded-[5px] border border-[#343330] bg-[#22211f]" />
                      <span className="h-16 rounded-[5px] border border-[#343330] bg-[#22211f]" />
                      <span className="h-16 rounded-[5px] border border-[#343330] bg-[#22211f]" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Moon aria-hidden="true" size={16} className="text-[var(--text-secondary)]" />
                    <span className="text-sm font-bold text-[var(--text-primary)]">Koyu tema</span>
                    {theme === 'dark' ? <Check aria-hidden="true" size={16} className="ml-auto text-[var(--accent-strong)]" /> : null}
                  </div>
                </button>
              </div>
              <div className="flex items-start gap-3 border-t border-[var(--border)] px-4 py-4 text-sm text-[var(--text-secondary)] sm:px-5">
                <Settings2 aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" />
                Tema seçimi bu tarayıcıda saklanır ve uygulamanın tamamında kullanılır.
              </div>
            </section>
          )}
        </main>
      </div>
    </section>
  )
}
