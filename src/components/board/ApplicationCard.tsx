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
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {application.company_name}
      </h3>

      {/* Pozisyon */}
      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {application.position}
      </p>

      {/* Metrik Rozetleri (Uyumluluk & Öncelik) */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {application.match_level && (
          <span className={`inline-flex items-center rounded text-[10px] font-medium px-1.5 py-0.5 ring-1 ring-inset ${
            application.match_level === 'high' ? 'bg-green-50 text-green-700 ring-green-600/20' :
            application.match_level === 'medium' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
            'bg-red-50 text-red-700 ring-red-600/10'
          }`}>
            {application.match_level === 'high' ? '🟢 Yüksek' : application.match_level === 'medium' ? '🟡 Orta' : '🔴 Düşük'} Uyumluluk
          </span>
        )}
        {application.priority_level && (
          <span className={`inline-flex items-center rounded text-[10px] font-medium px-1.5 py-0.5 ring-1 ring-inset ${
            application.priority_level === 'high' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
            application.priority_level === 'medium' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
            'bg-gray-50 text-gray-600 ring-gray-500/10'
          }`}>
            {application.priority_level === 'high' ? '🔥 Yüksek' : application.priority_level === 'medium' ? '⚡ Orta' : '🧊 Düşük'} İstek
          </span>
        )}
      </div>
    </div>
  )
}
