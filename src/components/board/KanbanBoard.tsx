'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import {
  Filter,
  LayoutGrid,
  List,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Application, ApplicationStatus, MatchLevel } from '@/lib/types'
import { useStatuses } from '@/hooks/useStatuses'
import { Button } from '@/components/ui/Button'
import { FeedbackBanner } from '@/components/ui/FeedbackBanner'
import { Skeleton } from '@/components/ui/Skeleton'
import KanbanColumn from './KanbanColumn'
import ApplicationForm from '../applications/ApplicationForm'
import ApplicationDetail from '../applications/ApplicationDetail'
import TableView from './TableView'

type ViewMode = 'kanban' | 'table'
type MatchFilter = MatchLevel | 'all'

function BoardSkeleton() {
  return (
    <div className="-mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" aria-label="Başvurular yükleniyor" role="status">
      <div className="flex gap-4 pb-8">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-[560px] w-[300px] min-w-[300px] shrink-0 rounded-[12px] border border-[var(--border)] bg-[var(--bg-column)] p-2 sm:w-[320px] sm:min-w-[320px] lg:w-[calc(25vw-51px)] lg:min-w-[300px]">
            <Skeleton className="h-11" />
            <div className="mt-3 space-y-2.5">
              {Array.from({ length: 3 }, (_, cardIndex) => (
                <Skeleton key={cardIndex} className="h-36 rounded-[12px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const supabase = useMemo(() => createClient(), [])
  const { statuses, loading: statusesLoading } = useStatuses()

  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all')
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<ApplicationStatus>('applied_message_pending')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('applications')
      .select('*, contacts(*)')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Başvurular yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.')
    } else {
      setApplications(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    // Initial remote data synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchApplications()
  }, [fetchApplications])

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false)
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const movedApplication = applications.find(application => application.id === draggableId)
    if (!movedApplication) return

    const previousApplications = applications
    const updatedApplications = applications.map(application =>
      application.id === draggableId
        ? {
            ...application,
            status: destination.droppableId as ApplicationStatus,
            kanban_order: destination.index,
          }
        : application
    )
    setApplications(updatedApplications)
    setError(null)

    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: destination.droppableId,
        kanban_order: destination.index,
      })
      .eq('id', draggableId)

    if (updateError) {
      setApplications(previousApplications)
      setError('Kart taşınamadı. Değişiklik geri alındı.')
    }
  }

  const handleAddClick = (status: ApplicationStatus) => {
    setDefaultStatus(status)
    setEditingApp(null)
    setIsFormOpen(true)
  }

  const handleAddFromToolbar = () => {
    const firstStatus = statuses[0]?.id
    handleAddClick(firstStatus || defaultStatus)
  }

  const handleEdit = (application: Application) => {
    setSelectedApp(null)
    setEditingApp(application)
    setIsFormOpen(true)
  }

  const handleDelete = async (applicationId: string) => {
    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId)

    if (deleteError) {
      setError('Başvuru silinemedi. Lütfen tekrar deneyin.')
      return
    }

    setApplications(current => current.filter(application => application.id !== applicationId))
    setSelectedApp(null)
  }

  const handleBulkDelete = async (applicationIds: string[]) => {
    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .in('id', applicationIds)

    if (deleteError) {
      setError('Seçilen başvurular silinemedi.')
      return
    }

    setApplications(current => current.filter(application => !applicationIds.includes(application.id)))
    setSelectedApp(null)
  }

  const handleBulkStatusUpdate = async (applicationIds: string[], newStatus: ApplicationStatus) => {
    const { error: updateError } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .in('id', applicationIds)

    if (updateError) {
      setError('Seçilen başvuruların durumu güncellenemedi.')
      return
    }

    setApplications(current => current.map(application =>
      applicationIds.includes(application.id)
        ? { ...application, status: newStatus }
        : application
    ))
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingApp(null)
    void fetchApplications()
  }

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('tr-TR')
  const filteredApplications = applications.filter(application => {
    const matchesSearch =
      !normalizedSearch ||
      application.company_name.toLocaleLowerCase('tr-TR').includes(normalizedSearch) ||
      application.position.toLocaleLowerCase('tr-TR').includes(normalizedSearch)
    const matchesLevel = matchFilter === 'all' || application.match_level === matchFilter
    return matchesSearch && matchesLevel
  })
  const hasActiveFilters = Boolean(normalizedSearch) || matchFilter !== 'all'

  return (
    <>
      <div className="sticky top-[68px] z-20 -mx-4 mb-5 border-y border-[var(--border)] bg-[var(--bg-header)] px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:max-w-sm">
              <Search aria-hidden="true" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="search"
                placeholder="Şirket veya pozisyon ara"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="h-10 w-full rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] pl-9 pr-9 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                aria-label="Başvurularda ara"
              />
              {searchQuery ? (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[6px] text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]" aria-label="Aramayı temizle">
                  <X aria-hidden="true" size={14} />
                </button>
              ) : null}
            </div>

            <div className="relative w-full sm:w-44">
              <Filter aria-hidden="true" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <select
                value={matchFilter}
                onChange={event => setMatchFilter(event.target.value as MatchFilter)}
                className="h-10 w-full appearance-none rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] pl-9 pr-8 text-sm font-medium text-[var(--text-secondary)] outline-none"
                aria-label="Uyum seviyesine göre filtrele"
              >
                <option value="all">Tüm uyumlar</option>
                <option value="high">Yüksek uyum</option>
                <option value="medium">Orta uyum</option>
                <option value="low">Düşük uyum</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <span className="mr-auto whitespace-nowrap text-xs font-semibold text-[var(--text-tertiary)] sm:mr-2">
              {filteredApplications.length} kayıt
            </span>
            <div className="flex items-center rounded-[9px] border border-[var(--border)] bg-[var(--bg-surface)] p-0.5 shadow-[var(--shadow-xs)]" aria-label="Görünüm seçimi">
              <button type="button" onClick={() => setViewMode('kanban')} aria-pressed={viewMode === 'kanban'} className={`flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-xs font-semibold transition-colors ${viewMode === 'kanban' ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
                <LayoutGrid aria-hidden="true" size={16} />
                Pano
              </button>
              <button type="button" onClick={() => setViewMode('table')} aria-pressed={viewMode === 'table'} className={`flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-xs font-semibold transition-colors ${viewMode === 'table' ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
                <List aria-hidden="true" size={16} />
                Liste
              </button>
            </div>
            <Button variant="primary" size="sm" className="!text-sm" onClick={handleAddFromToolbar} disabled={statusesLoading || statuses.length === 0}>
              <Plus aria-hidden="true" size={16} />
              <span className="hidden sm:inline">Yeni Başvuru</span>
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <FeedbackBanner message={error} onRetry={() => void fetchApplications()} onDismiss={() => setError(null)} className="mb-4" />
      ) : null}

      {loading || statusesLoading ? (
        <BoardSkeleton />
      ) : hasActiveFilters && filteredApplications.length === 0 ? (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-[10px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Eşleşen başvuru bulunamadı</p>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Arama metnini veya uyum filtresini değiştirebilirsin.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setMatchFilter('all') }}>Filtreleri temizle</Button>
        </div>
      ) : viewMode === 'kanban' ? (
        <DragDropContext onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
          <div className={`-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${isDragging ? 'cursor-grabbing' : ''}`}>
            <div className="flex w-max items-start gap-4">
              {statuses.map(status => {
                const columnApplications = filteredApplications
                  .filter(application => application.status === status.id)
                  .toSorted((first, second) => {
                    const orderDifference = first.kanban_order - second.kanban_order
                    if (orderDifference !== 0) return orderDifference
                    return new Date(second.created_at).getTime() - new Date(first.created_at).getTime()
                  })

                return (
                  <KanbanColumn
                    key={status.id}
                    columnId={status.id}
                    title={status.title}
                    emoji={status.emoji}
                    color={status.color}
                    applications={columnApplications}
                    onCardClick={setSelectedApp}
                    onAddClick={() => handleAddClick(status.id)}
                  />
                )
              })}
            </div>
          </div>
        </DragDropContext>
      ) : (
        <div className="pb-8">
          <TableView
            applications={filteredApplications}
            statuses={statuses}
            onCardClick={setSelectedApp}
            onEdit={handleEdit}
            onBulkDelete={handleBulkDelete}
            onBulkStatusUpdate={handleBulkStatusUpdate}
          />
        </div>
      )}

      {isFormOpen ? (
        <ApplicationForm
          editingApplication={editingApp}
          statuses={statuses}
          defaultStatus={defaultStatus}
          onClose={() => {
            setIsFormOpen(false)
            setEditingApp(null)
          }}
          onSuccess={handleFormSuccess}
        />
      ) : null}

      {selectedApp ? (
        <ApplicationDetail
          application={selectedApp}
          statuses={statuses}
          onClose={() => setSelectedApp(null)}
          onEdit={() => handleEdit(selectedApp)}
          onDelete={() => handleDelete(selectedApp.id)}
        />
      ) : null}
    </>
  )
}
