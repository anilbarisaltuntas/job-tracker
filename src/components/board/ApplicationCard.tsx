'use client'

import { ArrowUpRight, CalendarDays, GripVertical, UserRound } from 'lucide-react'
import { Application, MatchLevel } from '@/lib/types'
import CompanyLogo from '@/components/ui/CompanyLogo'

interface ApplicationCardProps {
  application: Application
  accentColor?: string
  onClick: () => void
}

const matchLabels: Record<MatchLevel, string> = {
  high: 'Yüksek uyum',
  medium: 'Orta uyum',
  low: 'Düşük uyum',
}

const matchStyles: Record<MatchLevel, string> = {
  high: 'border-emerald-500/20 bg-emerald-500/8 text-emerald-500',
  medium: 'border-amber-500/20 bg-amber-500/8 text-amber-500',
  low: 'border-rose-500/20 bg-rose-500/8 text-rose-500',
}

export default function ApplicationCard({ application, accentColor = 'var(--accent)', onClick }: ApplicationCardProps) {
  const contactCount = application.contacts?.length ?? 0

  return (
    <article className="group/card relative overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)] transition-[border-color,background-color,box-shadow] duration-150 hover:border-[var(--border-hover)] hover:bg-[var(--bg-elevated)] hover:shadow-[var(--shadow-soft)]">
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: accentColor }} aria-hidden="true" />

      <button
        type="button"
        onClick={onClick}
        className="block w-full px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
        aria-label={`${application.company_name}, ${application.position} başvurusunu aç`}
      >
        <div className="flex items-center gap-2.5">
          <CompanyLogo companyName={application.company_name} companyDomain={application.company_domain} size="sm" />

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              {application.company_name}
            </span>
            <span className="mt-px block truncate text-[12px] font-medium text-[var(--text-secondary)]">
              {application.position}
            </span>
          </span>

          <GripVertical
            aria-hidden="true"
            size={16}
            className="shrink-0 text-[var(--text-tertiary)] transition-colors group-hover/card:text-[var(--text-secondary)]"
          />
        </div>
      </button>

      <div className="flex min-h-8 items-center gap-2 border-t border-[var(--border)] px-3.5 py-1.5 text-[10px] font-medium text-[var(--text-tertiary)]">
        <span className={`inline-flex h-5 shrink-0 items-center rounded-[5px] border px-1.5 text-[9px] font-semibold ${matchStyles[application.match_level]}`}>
          {matchLabels[application.match_level]}
        </span>

        <span className="inline-flex items-center gap-1.5" title="Başvuru tarihi">
          <CalendarDays aria-hidden="true" size={12} />
          {new Date(application.application_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
        </span>

        {contactCount > 0 && (
          <span className="inline-flex items-center gap-1.5" title={`${contactCount} iletişim kişisi`}>
            <UserRound aria-hidden="true" size={12} />
            {contactCount} kişi
          </span>
        )}

        {application.job_url && (
          <a
            href={application.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 rounded-[5px] px-1 py-0.5 font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            aria-label={`${application.company_name} ilanını yeni sekmede aç`}
          >
            İlan
            <ArrowUpRight aria-hidden="true" size={12} strokeWidth={2.2} />
          </a>
        )}
      </div>
    </article>
  )
}
