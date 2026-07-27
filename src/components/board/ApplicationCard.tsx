'use client'

/**
 * APPLICATION CARD — Modern Minimalist Design
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
      className="group relative cursor-pointer minimal-panel p-3.5 transition-all duration-300"
    >
      {/* Şirket Adı & İkon */}
      <div className="flex items-start justify-between">
        <h3 className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {application.company_name}
        </h3>
        
        <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[var(--badge-bg)] text-[var(--text-tertiary)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
      </div>

      {/* Pozisyon */}
      <p className="mt-1 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
        {application.position}
      </p>

      {/* Metrik Rozetleri */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {application.match_level && (
          <span className={`inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide border ${
            application.match_level === 'high' ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] dark:bg-[#064E3B] dark:text-[#34D399] dark:border-[#065F46]' : 
            application.match_level === 'medium' ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A] dark:bg-[#451A03] dark:text-[#FBBF24] dark:border-[#78350F]' : 
            'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] dark:bg-[#7F1D1D] dark:text-[#F87171] dark:border-[#991B1B]'
          }`}>
            {application.match_level === 'high' ? 'Yüksek' : application.match_level === 'medium' ? 'Orta' : 'Düşük'}
          </span>
        )}
        
        {application.application_date && (
          <span 
            className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide border border-[var(--border)]"
            style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--text-secondary)' }}
          >
            {new Date(application.application_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}
