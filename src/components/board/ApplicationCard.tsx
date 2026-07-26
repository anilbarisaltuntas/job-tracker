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
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {application.company_name}
        </h3>
      </div>

      {/* Pozisyon */}
      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {application.position}
      </p>

      {/* Metrik Rozetleri (Uyumluluk & Tarih) */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {application.match_level && (
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${
            application.match_level === 'high' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
            application.match_level === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
            'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
          }`}>
            {application.match_level === 'high' ? 'Yüksek Uyum' : application.match_level === 'medium' ? 'Orta Uyum' : 'Düşük Uyum'}
          </span>
        )}
        
        {application.application_date && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-slate-800 dark:bg-slate-700 dark:text-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M5.25 2A1.75 1.75 0 003.5 3.75v12.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0017.5 16.25V3.75a1.75 1.75 0 00-1.75-1.75h-10.5zm.75 3a.75.75 0 011.5 0V6A.75.75 0 016 6V5zm4 0a.75.75 0 011.5 0V6a.75.75 0 01-1.5 0V5zm4 0a.75.75 0 011.5 0V6a.75.75 0 01-1.5 0V5zM4.5 8h11v7.75a.25.25 0 01-.25.25H4.75a.25.25 0 01-.25-.25V8z" clipRule="evenodd" />
            </svg>
            {new Date(application.application_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}
