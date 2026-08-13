'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  Download,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Pencil,
  Rows3,
  Trash2,
  X,
} from 'lucide-react'
import { Application, ApplicationStatus, MatchLevel, UserStatus } from '@/lib/types'
import CompanyLogo from '@/components/ui/CompanyLogo'
import { Button } from '@/components/ui/Button'

interface TableViewProps {
  applications: Application[]
  statuses: UserStatus[]
  onCardClick: (app: Application) => void
  onEdit: (app: Application) => void
  onBulkDelete: (ids: string[]) => void
  onBulkStatusUpdate: (ids: string[], newStatus: ApplicationStatus) => void
}

type SortKey = 'company' | 'position' | 'applicationDate' | 'match'
type SortDirection = 'asc' | 'desc'

const matchLabels: Record<MatchLevel, string> = {
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
}

const matchStyles: Record<MatchLevel, string> = {
  high: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  medium: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  low: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
}

const matchRank: Record<MatchLevel, number> = { low: 1, medium: 2, high: 3 }

function formatDate(date: string | null) {
  if (!date) return 'Belirtilmedi'

  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) return <ArrowUpDown aria-hidden="true" size={13} />
  return direction === 'asc'
    ? <ArrowUp aria-hidden="true" size={13} />
    : <ArrowDown aria-hidden="true" size={13} />
}

export default function TableView({
  applications,
  statuses,
  onCardClick,
  onEdit,
  onBulkDelete,
  onBulkStatusUpdate,
}: TableViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus | ''>('')
  const [sortKey, setSortKey] = useState<SortKey>('applicationDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [deleteIds, setDeleteIds] = useState<string[]>([])

  const statusMap = useMemo(() => new Map(statuses.map(status => [status.id, status])), [statuses])
  const selectedApplications = applications.filter(application => selectedIds.has(application.id))
  const selectedCount = selectedApplications.length
  const allSelected = applications.length > 0 && selectedCount === applications.length
  const partiallySelected = selectedCount > 0 && !allSelected

  const sortedApplications = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1

    return applications.toSorted((first, second) => {
      let comparison = 0

      if (sortKey === 'company') {
        comparison = first.company_name.localeCompare(second.company_name, 'tr')
      } else if (sortKey === 'position') {
        comparison = first.position.localeCompare(second.position, 'tr')
      } else if (sortKey === 'match') {
        comparison = matchRank[first.match_level] - matchRank[second.match_level]
      } else {
        comparison = new Date(first.application_date).getTime() - new Date(second.application_date).getTime()
      }

      return comparison * direction
    })
  }, [applications, sortDirection, sortKey])

  const setSorting = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc')
      return
    }

    setSortKey(key)
    setSortDirection(key === 'applicationDate' || key === 'match' ? 'desc' : 'asc')
  }

  const toggleSelectAll = () => {
    setSelectedIds(current => {
      const next = new Set(current)

      if (allSelected) {
        applications.forEach(application => next.delete(application.id))
      } else {
        applications.forEach(application => next.add(application.id))
      }

      return next
    })
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setBulkStatus('')
  }

  const handleBulkStatusChange = () => {
    if (!bulkStatus || selectedCount === 0) return
    onBulkStatusUpdate(selectedApplications.map(application => application.id), bulkStatus)
    clearSelection()
  }

  const confirmDelete = () => {
    if (deleteIds.length === 0) return
    onBulkDelete(deleteIds)
    setSelectedIds(current => {
      const next = new Set(current)
      deleteIds.forEach(id => next.delete(id))
      return next
    })
    setDeleteIds([])
  }

  const sortableHeader = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSorting(key)}
      className="inline-flex items-center gap-1.5 rounded-[5px] text-left text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      {label}
      <SortIcon active={sortKey === key} direction={sortDirection} />
    </button>
  )

  if (applications.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-[12px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]/50 px-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)]">
          <Rows3 aria-hidden="true" size={18} />
        </div>
        <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">Gösterilecek başvuru yok</p>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">Filtreleri değiştirdiğinde eşleşen kayıtlar burada görünecek.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="hidden max-h-[calc(100dvh-210px)] overflow-auto rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-xs)] md:block">
        <table className="w-full min-w-[940px] table-fixed text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_1px_0_var(--border)]">
            <tr>
              <th scope="col" className="w-12 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => { if (input) input.indeterminate = partiallySelected }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 cursor-pointer rounded accent-[var(--accent)]"
                  aria-label={allSelected ? 'Tüm seçimleri kaldır' : 'Tüm başvuruları seç'}
                />
              </th>
              <th scope="col" aria-sort={sortKey === 'company' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="w-[23%] px-3 py-3.5">{sortableHeader('company', 'Şirket')}</th>
              <th scope="col" aria-sort={sortKey === 'position' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="w-[19%] px-3 py-3.5">{sortableHeader('position', 'Pozisyon')}</th>
              <th scope="col" className="w-[19%] px-3 py-3.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-secondary)]">Durum</th>
              <th scope="col" aria-sort={sortKey === 'applicationDate' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="w-[14%] px-3 py-3.5">{sortableHeader('applicationDate', 'Başvuru')}</th>
              <th scope="col" aria-sort={sortKey === 'match' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="w-[12%] px-3 py-3.5">{sortableHeader('match', 'Uyum')}</th>
              <th scope="col" className="w-[72px] px-3 py-3.5"><span className="sr-only">Aksiyonlar</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sortedApplications.map(application => {
              const status = statusMap.get(application.status)
              const isSelected = selectedIds.has(application.id)

              return (
                <tr key={application.id} className={`transition-colors hover:bg-[var(--bg-surface-hover)] ${isSelected ? 'bg-[var(--accent-subtle)]' : ''}`}>
                  <td className="px-4 py-3.5">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelectOne(application.id)} className="h-4 w-4 cursor-pointer rounded accent-[var(--accent)]" aria-label={`${application.company_name} başvurusunu seç`} />
                  </td>
                  <td className="px-3 py-3.5">
                    <button type="button" onClick={() => onCardClick(application)} className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                      <CompanyLogo companyName={application.company_name} companyDomain={application.company_domain} size="sm" />
                      <span className="min-w-0 truncate text-sm font-bold text-[var(--text-primary)]">{application.company_name}</span>
                    </button>
                  </td>
                  <td className="px-3 py-3.5">
                    <button type="button" onClick={() => onCardClick(application)} className="block max-w-full truncate text-left text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                      {application.position}
                    </button>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--badge-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                      <span aria-hidden="true">{status?.emoji}</span>
                      <span className="truncate">{status?.title || 'Bilinmiyor'}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-xs font-medium text-[var(--text-secondary)]">{formatDate(application.application_date)}</td>
                  <td className="px-3 py-3.5">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${matchStyles[application.match_level]}`}>{matchLabels[application.match_level]}</span>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <details className="group relative inline-block">
                      <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-[7px] text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]" aria-label={`${application.company_name} satır aksiyonları`}>
                        <MoreHorizontal aria-hidden="true" size={17} />
                      </summary>
                      <div className="absolute right-0 top-10 z-30 w-44 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-1.5 text-left shadow-[var(--shadow-lg)]">
                        <button type="button" onClick={() => onCardClick(application)} className="flex h-9 w-full items-center gap-2 rounded-[7px] px-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"><Eye aria-hidden="true" size={14} /> Detayı aç</button>
                        <button type="button" onClick={() => onEdit(application)} className="flex h-9 w-full items-center gap-2 rounded-[7px] px-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"><Pencil aria-hidden="true" size={14} /> Düzenle</button>
                        {application.job_url ? <a href={application.job_url} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center gap-2 rounded-[7px] px-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"><ExternalLink aria-hidden="true" size={14} /> İlanı aç</a> : null}
                        {application.cv_file_url ? <a href={application.cv_file_url} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center gap-2 rounded-[7px] px-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"><Download aria-hidden="true" size={14} /> CV’yi aç</a> : null}
                        <div className="my-1 border-t border-[var(--border)]" />
                        <button type="button" onClick={() => setDeleteIds([application.id])} className="flex h-9 w-full items-center gap-2 rounded-[7px] px-2.5 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-subtle)]"><Trash2 aria-hidden="true" size={14} /> Sil</button>
                      </div>
                    </details>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5">
          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <input type="checkbox" checked={allSelected} ref={input => { if (input) input.indeterminate = partiallySelected }} onChange={toggleSelectAll} className="h-4 w-4 rounded accent-[var(--accent)]" />
            Tümünü seç
          </label>
          <select value={`${sortKey}:${sortDirection}`} onChange={event => {
            const [nextKey, nextDirection] = event.target.value.split(':') as [SortKey, SortDirection]
            setSortKey(nextKey)
            setSortDirection(nextDirection)
          }} className="h-8 rounded-[7px] border border-[var(--input-border)] bg-[var(--input-bg)] px-2 text-xs font-semibold text-[var(--text-secondary)] outline-none" aria-label="Başvuruları sırala">
            <option value="applicationDate:desc">En yeni</option>
            <option value="applicationDate:asc">En eski</option>
            <option value="company:asc">Şirket A–Z</option>
            <option value="company:desc">Şirket Z–A</option>
            <option value="match:desc">Uyum yüksekten</option>
          </select>
        </div>

        {sortedApplications.map(application => {
          const status = statusMap.get(application.status)
          const isSelected = selectedIds.has(application.id)

          return (
            <article key={application.id} className={`rounded-[12px] border bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-xs)] ${isSelected ? 'border-[var(--accent-border)] ring-1 ring-[var(--accent-border)]' : 'border-[var(--border)]'}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelectOne(application.id)} className="mt-1 h-4 w-4 shrink-0 rounded accent-[var(--accent)]" aria-label={`${application.company_name} başvurusunu seç`} />
                <CompanyLogo companyName={application.company_name} companyDomain={application.company_domain} size="sm" />
                <button type="button" onClick={() => onCardClick(application)} className="min-w-0 flex-1 text-left">
                  <h3 className="truncate text-sm font-bold text-[var(--text-primary)]">{application.company_name}</h3>
                  <p className="mt-0.5 truncate text-xs font-medium text-[var(--text-secondary)]">{application.position}</p>
                </button>
                <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${matchStyles[application.match_level]}`}>{matchLabels[application.match_level]}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
                <span className="inline-flex max-w-[65%] items-center gap-1.5 rounded-full bg-[var(--badge-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]"><span aria-hidden="true">{status?.emoji}</span><span className="truncate">{status?.title || 'Bilinmiyor'}</span></span>
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-tertiary)]"><CalendarDays aria-hidden="true" size={12} /> {formatDate(application.application_date)}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Button variant="ghost" size="sm" className="w-full !px-2 !text-xs" onClick={() => onCardClick(application)}><Eye aria-hidden="true" size={14} /> Detay</Button>
                <Button variant="ghost" size="sm" className="w-full !px-2 !text-xs" onClick={() => onEdit(application)}><Pencil aria-hidden="true" size={14} /> Düzenle</Button>
                <Button variant="ghost" size="sm" className="w-full !px-2 !text-xs !text-[var(--danger)]" onClick={() => setDeleteIds([application.id])}><Trash2 aria-hidden="true" size={14} /> Sil</Button>
              </div>
            </article>
          )
        })}
      </div>

      {selectedCount > 0 ? (
        <div className="sticky bottom-4 z-20 mt-4 flex flex-col gap-3 rounded-[12px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[var(--shadow-lg)] sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-[7px] bg-[var(--accent)] px-2 text-xs font-bold text-white">{selectedCount}</span>
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">Başvuru seçildi</p>
              <button type="button" onClick={clearSelection} className="text-[10px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Seçimi temizle</button>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
            <select value={bulkStatus} onChange={event => setBulkStatus(event.target.value)} className="h-9 min-w-0 rounded-[8px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-secondary)] outline-none sm:w-56" aria-label="Seçilen başvuruların yeni durumu">
              <option value="">Yeni durum seç</option>
              {statuses.map(status => <option key={status.id} value={status.id}>{status.emoji} {status.title}</option>)}
            </select>
            <Button variant="primary" size="sm" onClick={handleBulkStatusChange} disabled={!bulkStatus}>Durumu uygula</Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteIds(selectedApplications.map(application => application.id))}><Trash2 aria-hidden="true" size={14} /> Sil</Button>
          </div>
        </div>
      ) : null}

      {deleteIds.length > 0 ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setDeleteIds([]) }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="table-delete-title" aria-describedby="table-delete-description" className="w-full max-w-sm rounded-[14px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-lg)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--danger-subtle)] text-[var(--danger)]"><Trash2 aria-hidden="true" size={18} /></div>
              <div className="min-w-0">
                <h3 id="table-delete-title" className="text-base font-bold text-[var(--text-primary)]">{deleteIds.length} başvuruyu sil?</h3>
                <p id="table-delete-description" className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">Bu işlem seçilen kayıtları kalıcı olarak siler ve geri alınamaz.</p>
              </div>
              <button type="button" onClick={() => setDeleteIds([])} className="ml-auto text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" aria-label="Silme onayını kapat"><X aria-hidden="true" size={17} /></button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteIds([])} autoFocus>Vazgeç</Button>
              <Button variant="danger" onClick={confirmDelete}><Trash2 aria-hidden="true" size={15} /> Evet, sil</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
