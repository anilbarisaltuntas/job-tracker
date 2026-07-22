'use client'

import { useState } from 'react'
import { Application, ApplicationStatus, UserStatus } from '@/lib/types'

interface TableViewProps {
  applications: Application[]
  statuses: UserStatus[]
  onCardClick: (app: Application) => void
  onBulkDelete: (ids: string[]) => void
  onBulkStatusUpdate: (ids: string[], newStatus: ApplicationStatus) => void
}

export default function TableView({ applications, statuses, onCardClick, onBulkDelete, onBulkStatusUpdate }: TableViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus | ''>('')
  
  const allSelected = applications.length > 0 && selectedIds.size === applications.length
  
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(applications.map(a => a.id)))
    }
  }

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const handleBulkStatusChange = () => {
    if (!bulkStatus || selectedIds.size === 0) return
    onBulkStatusUpdate(Array.from(selectedIds), bulkStatus as ApplicationStatus)
    setSelectedIds(new Set())
    setBulkStatus('')
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    if (confirm(`${selectedIds.size} başvuruyu silmek istediğinize emin misiniz?`)) {
      onBulkDelete(Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  if (applications.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Gösterilecek başvuru bulunamadı.</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
      <table className="w-full text-left text-sm">
        <thead className="border-b text-xs uppercase" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}>
          <tr>
            <th scope="col" className="p-4">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded" />
            </th>
            <th scope="col" className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Şirket & Pozisyon</th>
            <th scope="col" className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Durum</th>
            <th scope="col" className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Başvuru Tarihi</th>
            <th scope="col" className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Takip Tarihi</th>
            <th scope="col" className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>İş İlanı</th>
            <th scope="col" className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>CV</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(app => {
            const column = statuses.find(c => c.id === app.status)
            const isOverdue = app.follow_up_date && new Date(app.follow_up_date) < new Date()
            
            return (
              <tr 
                key={app.id} 
                className="border-b transition-colors hover:bg-[var(--bg-surface-hover)]" 
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <td className="w-4 p-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(app.id)} 
                    onChange={() => toggleSelectOne(app.id)} 
                    className="h-4 w-4 rounded cursor-pointer" 
                  />
                </td>
                <td className="cursor-pointer px-4 py-3" onClick={() => onCardClick(app)}>
                  <div className="font-medium">{app.company_name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{app.position}</div>
                </td>
                <td className="cursor-pointer px-4 py-3" onClick={() => onCardClick(app)}>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: column?.bg_color || 'var(--bg-surface)', color: column?.color || 'var(--text-primary)' }}>
                    {column?.emoji} {column?.title || 'Bilinmiyor'}
                  </span>
                </td>
                <td className="cursor-pointer px-4 py-3" onClick={() => onCardClick(app)}>
                  {formatDate(app.application_date)}
                </td>
                <td className="cursor-pointer px-4 py-3" onClick={() => onCardClick(app)}>
                  {app.follow_up_date ? (
                    <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                      {isOverdue && '⚠️ '} {formatDate(app.follow_up_date)}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3">
                  {app.job_url ? (
                    <a 
                      href={app.job_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-500 hover:underline"
                    >
                      İlana Git ↗
                    </a>
                  ) : <span style={{ color: 'var(--text-tertiary)' }}>-</span>}
                </td>
                <td className="px-4 py-3">
                  {app.cv_file_url ? (
                    <a 
                      href={app.cv_file_url} 
                      download 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:opacity-80"
                      style={{ backgroundColor: 'var(--badge-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      📥 {app.cv_version || 'İndir'}
                    </a>
                  ) : <span style={{ color: 'var(--text-tertiary)' }}>-</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {selectedIds.size > 0 && (
        <div className="sticky bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t px-6 py-4 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            <span className="text-blue-500">{selectedIds.size}</span> başvuru seçildi
          </div>
          <div className="flex items-center gap-3">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as ApplicationStatus)}
              className="rounded-xl border px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">Durumu Değiştir...</option>
              {statuses.map(col => (
                <option key={col.id} value={col.id}>
                  {col.emoji} {col.title}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleBulkStatusChange}
              disabled={!bulkStatus}
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            >
              Uygula
            </button>
            
            <div className="h-6 w-px" style={{ backgroundColor: 'var(--border)' }} />
            
            <button
              onClick={handleBulkDelete}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20"
            >
              Sil
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
