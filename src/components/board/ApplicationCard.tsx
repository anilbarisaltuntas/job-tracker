'use client'

/**
 * APPLICATION CARD — WOW Design
 * 
 * Her kart bir iş başvurusunu temsil eder.
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
      className="group relative cursor-pointer overflow-hidden rounded-2xl p-4 transition-all duration-300 glass-panel"
    >
      {/* Kart Arkası Neon Glow (Hover'da yanar) */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-[var(--accent-subtle)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* Sol Kenar Kalın Işık Çizgisi */}
      <div 
        className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-[var(--accent)] to-[var(--accent-secondary)] opacity-50 shadow-[0_0_10px_var(--glow-color)] transition-all duration-300 group-hover:w-1.5 group-hover:opacity-100"
      />

      {/* Şirket Adı & İkon */}
      <div className="relative z-10 flex items-start justify-between">
        <h3 className="text-[15px] font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {application.company_name}
        </h3>
        
        {/* Çok zarif bir ok ikonu hover'da belirir */}
        <span className="flex h-6 w-6 translate-x-2 items-center justify-center rounded-full bg-[var(--bg-surface-hover)] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
      </div>

      {/* Pozisyon */}
      <p className="relative z-10 mt-1 text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
        {application.position}
      </p>

      {/* Metrik Rozetleri */}
      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
        {application.match_level && (
          <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm ${
            application.match_level === 'high' ? 'bg-gradient-to-r from-emerald-500/20 to-teal-400/20 text-emerald-400 border border-emerald-500/30' :
            application.match_level === 'medium' ? 'bg-gradient-to-r from-amber-500/20 to-orange-400/20 text-amber-400 border border-amber-500/30' :
            'bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {application.match_level === 'high' ? 'Yüksek' : application.match_level === 'medium' ? 'Orta' : 'Düşük'}
          </span>
        )}
        
        {application.application_date && (
          <span 
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {new Date(application.application_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}
