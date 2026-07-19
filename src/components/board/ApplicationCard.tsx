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
import { KANBAN_COLUMNS } from '@/lib/constants'

interface ApplicationCardProps {
  application: Application
  onClick: () => void
}

export default function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  // Bu başvurunun bulunduğu sütunun renk bilgisini al
  const column = KANBAN_COLUMNS.find(col => col.id === application.status)

  // Takip tarihi geçmiş mi kontrol et
  const isOverdue = application.follow_up_date 
    && new Date(application.follow_up_date) < new Date()

  // Tarihi Türkçe formatla (ör: "19 Tem 2026")
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
      className="group cursor-pointer rounded-xl border border-slate-700/50 bg-slate-800 p-4 shadow-sm transition-all hover:border-slate-600 hover:shadow-md hover:shadow-slate-900/50"
    >
      {/* Üst renkli çizgi — hangi durumda olduğunu görselleştirir */}
      <div
        className="mb-3 h-1 w-12 rounded-full"
        style={{ backgroundColor: column?.color || '#64748B' }}
      />

      {/* Şirket adı */}
      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
        {application.company_name}
      </h3>

      {/* Pozisyon */}
      <p className="mt-1 text-sm text-slate-400">
        {application.position}
      </p>

      {/* Alt bilgiler */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Başvuru tarihi */}
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-700/50 px-2 py-0.5 text-xs text-slate-300">
          📅 {formatDate(application.application_date)}
        </span>

        {/* Kaynak (varsa) */}
        {application.source && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-700/50 px-2 py-0.5 text-xs text-slate-300">
            🔗 {application.source}
          </span>
        )}

        {/* CV versiyonu (varsa) */}
        {application.cv_version && (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
            📄 {application.cv_version}
          </span>
        )}
      </div>

      {/* Takip tarihi uyarısı */}
      {application.follow_up_date && (
        <div className={`mt-2 flex items-center gap-1 text-xs ${
          isOverdue ? 'text-red-400' : 'text-slate-500'
        }`}>
          {isOverdue ? '⚠️' : '🔔'} Takip: {formatDate(application.follow_up_date)}
          {isOverdue && <span className="ml-1 rounded bg-red-500/20 px-1.5 py-0.5 text-red-400">Gecikti!</span>}
        </div>
      )}

      {/* İletişim kişisi (varsa) */}
      {application.contact_name && (
        <div className="mt-2 text-xs text-slate-500">
          👤 {application.contact_name}
          {application.contact_role && ` — ${application.contact_role}`}
        </div>
      )}
    </div>
  )
}
