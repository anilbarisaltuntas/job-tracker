'use client'

/**
 * APPLICATION CARD — Kanban Board'daki Başvuru Kartı
 * 
 * Her kart bir iş başvurusunu temsil eder.
 * Gösterdiği bilgiler: şirket adı, pozisyon, tarih, kaynak.
 * Tıklanınca detay modal'ı açılır.
 * Takip tarihi geçmişse kırmızı uyarı gösterir.
 */

import { Application } from '@/lib/types'

interface ApplicationCardProps {
  application: Application
  onClick: () => void
}

export default function ApplicationCard({ application, onClick }: ApplicationCardProps) {

  const isOverdue = application.follow_up_date 
    && new Date(application.follow_up_date) < new Date()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl p-3 transition-all hover:-translate-y-0.5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-hover)'
        e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'
        e.currentTarget.style.boxShadow = `0 8px 30px var(--glow-color)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.backgroundColor = 'var(--bg-surface)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >


      {/* Şirket adı */}
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {application.company_name}
      </h3>

      {/* Pozisyon */}
      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {application.position}
      </p>

      {/* Alt bilgiler */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
          style={{
            backgroundColor: 'var(--badge-bg)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          📅 {formatDate(application.application_date)}
        </span>

        {application.source && (
          <span
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
            style={{
              backgroundColor: 'var(--badge-bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            🔗 {application.source}
          </span>
        )}

        {(application.cv_version || application.cv_file_url) && (
          <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/10 bg-blue-500/5 px-2 py-0.5 text-xs text-blue-500">
            {application.cv_file_url ? '📎' : '📄'} {application.cv_version || 'CV'}
          </span>
        )}
      </div>

      {/* Takip tarihi uyarısı */}
      {application.follow_up_date && (
        <div className={`mt-2.5 flex items-center gap-1 text-[11px] ${
          isOverdue ? 'text-red-500' : ''
        }`} style={isOverdue ? {} : { color: 'var(--text-tertiary)' }}>
          {isOverdue ? '⚠️' : '🔔'} Takip: {formatDate(application.follow_up_date)}
          {isOverdue && <span className="ml-1 rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-red-500">Gecikti!</span>}
        </div>
      )}

      {/* İletişim kişisi (varsa) */}
      {application.contact_name && (
        <div className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          👤 {application.contact_name}
          {application.contact_role && ` — ${application.contact_role}`}
        </div>
      )}
    </div>
  )
}
