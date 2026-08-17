'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Filter, Plus, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type {
  Opportunity,
  OpportunityFormat,
  OpportunityStatus,
  OpportunityType,
} from '@/lib/types'
import {
  OPPORTUNITY_FORMATS,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TYPES,
} from '@/lib/opportunity-options'
import { Button } from '@/components/ui/Button'
import { FeedbackBanner } from '@/components/ui/FeedbackBanner'
import { Skeleton } from '@/components/ui/Skeleton'
import OpportunityColumn from './OpportunityColumn'
import OpportunityForm from './OpportunityForm'

type TypeFilter = OpportunityType | 'all'
type FormatFilter = OpportunityFormat | 'all'

function OpportunitiesSkeleton() {
  return (
    <div className="-mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" aria-label="Programlar yükleniyor" role="status">
      <div className="flex gap-4 pb-8">
        {Array.from({ length: 4 }, (_, columnIndex) => (
          <div key={columnIndex} className="h-[560px] w-[300px] min-w-[300px] shrink-0 rounded-[12px] border border-[var(--border)] bg-[var(--bg-column)] p-2 sm:w-[320px] sm:min-w-[320px] lg:w-[calc(25vw-51px)] lg:min-w-[300px]">
            <Skeleton className="h-11" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }, (_, cardIndex) => <Skeleton key={cardIndex} className="h-28 rounded-[12px]" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OpportunitiesBoard() {
  const supabase = useMemo(() => createClient(), [])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<OpportunityStatus>('to_apply')

  const fetchOpportunities = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      setError('Oturum doğrulanamadı. Sayfayı yenileyip tekrar dene.')
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Programlar yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.')
    } else {
      setOpportunities(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    // Initial remote data synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOpportunities()
  }, [fetchOpportunities])

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('tr-TR')
  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = !normalizedSearch
      || opportunity.title.toLocaleLowerCase('tr-TR').includes(normalizedSearch)
      || opportunity.organizer.toLocaleLowerCase('tr-TR').includes(normalizedSearch)
      || opportunity.location?.toLocaleLowerCase('tr-TR').includes(normalizedSearch)
    const matchesType = typeFilter === 'all' || opportunity.opportunity_type === typeFilter
    const matchesFormat = formatFilter === 'all' || opportunity.event_format === formatFilter
    return matchesSearch && matchesType && matchesFormat
  })
  const hasActiveFilters = Boolean(normalizedSearch) || typeFilter !== 'all' || formatFilter !== 'all'

  const openCreateForm = (status: OpportunityStatus = 'to_apply') => {
    setEditingOpportunity(null)
    setDefaultStatus(status)
    setIsFormOpen(true)
  }

  const openEditForm = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity)
    setDefaultStatus(opportunity.status)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingOpportunity(null)
  }

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false)
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const opportunity = opportunities.find(item => item.id === draggableId)
    if (!opportunity) return

    const previousOpportunities = opportunities
    const nextStatus = destination.droppableId as OpportunityStatus
    const updatedAt = new Date().toISOString()
    setOpportunities(current => current.map(item => item.id === draggableId ? {
      ...item,
      status: nextStatus,
      kanban_order: destination.index,
      updated_at: updatedAt,
    } : item))
    setError(null)

    const { error: updateError } = await supabase
      .from('opportunities')
      .update({ status: nextStatus, kanban_order: destination.index, updated_at: updatedAt })
      .eq('id', draggableId)

    if (updateError) {
      setOpportunities(previousOpportunities)
      setError('Program taşınamadı. Değişiklik geri alındı.')
    }
  }

  const handleDelete = async (opportunity: Opportunity) => {
    const { error: deleteError } = await supabase.from('opportunities').delete().eq('id', opportunity.id)
    if (deleteError) throw deleteError

    setOpportunities(current => current.filter(item => item.id !== opportunity.id))
    closeForm()
  }

  const clearFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setFormatFilter('all')
  }

  return (
    <>
      <div className="sticky top-[68px] z-20 -mx-4 mb-5 border-y border-[var(--border)] bg-[var(--bg-header)] px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:max-w-sm">
              <Search aria-hidden="true" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="search"
                placeholder="Program, etkinlik veya kurum ara"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="h-10 w-full rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] pl-9 pr-9 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-border)]"
                aria-label="Programlarda ara"
              />
              {searchQuery ? (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[6px] text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]" aria-label="Aramayı temizle">
                  <X aria-hidden="true" size={14} />
                </button>
              ) : null}
            </div>

            <div className="relative w-full sm:w-48">
              <Filter aria-hidden="true" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <select value={typeFilter} onChange={event => setTypeFilter(event.target.value as TypeFilter)} className="h-10 w-full appearance-none rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] pl-9 pr-8 text-sm font-medium text-[var(--text-secondary)] outline-none" aria-label="Program türüne göre filtrele">
                <option value="all">Tüm türler</option>
                {OPPORTUNITY_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>

            <select value={formatFilter} onChange={event => setFormatFilter(event.target.value as FormatFilter)} className="h-10 w-full rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm font-medium text-[var(--text-secondary)] outline-none sm:w-36" aria-label="Katılım şekline göre filtrele">
              <option value="all">Tüm formatlar</option>
              {OPPORTUNITY_FORMATS.map(format => <option key={format.value} value={format.value}>{format.label}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3 xl:justify-end">
            <span className="whitespace-nowrap text-xs font-semibold text-[var(--text-tertiary)]">{filteredOpportunities.length} kayıt</span>
            <Button variant="primary" size="sm" onClick={() => openCreateForm()}>
              <Plus aria-hidden="true" size={16} />
              Yeni Program
            </Button>
          </div>
        </div>
      </div>

      {error ? <FeedbackBanner message={error} onRetry={() => void fetchOpportunities()} onDismiss={() => setError(null)} className="mb-4" /> : null}

      {loading ? (
        <OpportunitiesSkeleton />
      ) : hasActiveFilters && filteredOpportunities.length === 0 ? (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-[10px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Eşleşen program bulunamadı</p>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Arama metnini veya filtrelerini değiştirebilirsin.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>Filtreleri temizle</Button>
        </div>
      ) : (
        <DragDropContext
          dragHandleUsageInstructions="Kartı taşımak için boşluk tuşuna basın. Ok tuşlarıyla hedef statüyü seçip yeniden boşluk tuşuna basın."
          onDragStart={() => setIsDragging(true)}
          onDragEnd={result => void handleDragEnd(result)}
        >
          <div className={`-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${isDragging ? 'cursor-grabbing' : ''}`}>
            <div className="flex w-max items-start gap-4">
              {OPPORTUNITY_STATUSES.map(status => {
                const columnOpportunities = filteredOpportunities
                  .filter(opportunity => opportunity.status === status.id)
                  .toSorted((first, second) => {
                    const orderDifference = first.kanban_order - second.kanban_order
                    if (orderDifference !== 0) return orderDifference
                    return new Date(second.created_at).getTime() - new Date(first.created_at).getTime()
                  })

                return (
                  <OpportunityColumn
                    key={status.id}
                    status={status.id}
                    title={status.title}
                    color={status.color}
                    opportunities={columnOpportunities}
                    onCardClick={openEditForm}
                    onAddClick={() => openCreateForm(status.id)}
                  />
                )
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      {isFormOpen ? (
        <OpportunityForm
          opportunity={editingOpportunity}
          defaultStatus={defaultStatus}
          onClose={closeForm}
          onSaved={() => { closeForm(); void fetchOpportunities() }}
          onDelete={handleDelete}
        />
      ) : null}
    </>
  )
}
