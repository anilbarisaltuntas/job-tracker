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
      className="group cursor-pointer rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
    >
      {/* Üst renkli çizgi — hangi durumda olduğunu görselleştirir */}
      <div
        className="mb-3 h-[3px] w-10 rounded-full opacity-80"
        style={{ backgroundColor: column?.color || '#64748B' }}
      />

      {/* Şirket adı */}
      <h3 className="font-medium text-white/90 transition-colors group-hover:text-white">
        {application.company_name}
      </h3>

      {/* Pozisyon */}
      <p className="mt-1 text-sm text-white/50">
        {application.position}
      </p>

      {/* Alt bilgiler */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Başvuru tarihi */}
        <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.05] bg-white/[0.03] px-2 py-0.5 text-xs text-white/60">
          📅 {formatDate(application.application_date)}
        </span>

        {/* Kaynak (varsa) */}
        {application.source && (
          <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.05] bg-white/[0.03] px-2 py-0.5 text-xs text-white/60">
            🔗 {application.source}
          </span>
        )}

        {/* CV bilgisi (varsa) */}
        {(application.cv_version || application.cv_file_url) && (
          <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/10 bg-blue-500/5 px-2 py-0.5 text-xs text-blue-400/80">
            {application.cv_file_url ? '📎' : '📄'} {application.cv_version || 'CV'}
          </span>
        )}
      </div>

      {/* Takip tarihi uyarısı */}
      {application.follow_up_date && (
        <div className={`mt-3 flex items-center gap-1.5 text-xs ${
          isOverdue ? 'text-red-400/90' : 'text-white/40'
        }`}>
          {isOverdue ? '⚠️' : '🔔'} Takip: {formatDate(application.follow_up_date)}
          {isOverdue && <span className="ml-1 rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-red-400/90">Gecikti!</span>}
        </div>
      )}

      {/* İletişim kişisi (varsa) */}
      {application.contact_name && (
        <div className="mt-2 text-xs text-white/40">
          👤 {application.contact_name}
          {application.contact_role && ` — ${application.contact_role}`}
        </div>
      )}
    </div>
  )
}
