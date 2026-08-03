'use client'

/**
 * APPLICATION CARD — Modern SaaS Design
 */

import { Application } from '@/lib/types'

interface ApplicationCardProps {
  application: Application
  onClick: () => void
}

export default function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer modern-card p-4 transition-all duration-200"
    >
      {/* Şirket Adı & İkon */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
          {application.company_name}
        </h3>
        
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--badge-bg)] text-[var(--text-tertiary)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 border border-[var(--border)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
      </div>

      {/* Pozisyon */}
      <p className="mt-1 text-[13px] font-medium text-[var(--text-secondary)] line-clamp-1">
        {application.position}
      </p>

      {/* Metrik Rozetleri */}
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        {application.match_level && (
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium tracking-wide border shadow-2xs ${
            application.match_level === 'high' 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 
            application.match_level === 'medium' 
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' : 
              'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              application.match_level === 'high' ? 'bg-emerald-500 animate-pulse' :
              application.match_level === 'medium' ? 'bg-amber-500' :
              'bg-rose-500'
            }`} />
            {application.match_level === 'high' ? 'Yüksek Uyum' : application.match_level === 'medium' ? 'Orta Uyum' : 'Düşük Uyum'}
          </span>
        )}
        
        {application.application_date && (
          <span 
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium tracking-wide border border-[var(--border)] bg-[var(--badge-bg)] text-[var(--text-tertiary)]"
          >
            <span className="opacity-70">📅</span>
            {new Date(application.application_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}
