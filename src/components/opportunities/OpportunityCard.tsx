'use client'

import {
  ArrowUpRight,
  CalendarDays,
  Globe2,
  GripVertical,
  MapPin,
} from 'lucide-react'
import type { Opportunity } from '@/lib/types'
import {
  getOpportunityFormatLabel,
  getOpportunityTypeLabel,
} from '@/lib/opportunity-options'

interface OpportunityCardProps {
  opportunity: Opportunity
  accentColor: string
  onClick: () => void
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`))
}

export default function OpportunityCard({ opportunity, accentColor, onClick }: OpportunityCardProps) {
  const eventDate = formatDate(opportunity.event_date)

  return (
    <article className="group/card relative overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)] transition-[border-color,background-color,box-shadow] duration-150 hover:border-[var(--border-hover)] hover:bg-[var(--bg-elevated)] hover:shadow-[var(--shadow-soft)]">
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: accentColor }} aria-hidden="true" />

      <button
        type="button"
        onClick={onClick}
        className="block w-full px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
        aria-label={`${opportunity.title} programını aç`}
      >
        <div className="flex items-start gap-2.5">
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border text-xs font-bold"
            style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}12`, color: accentColor }}
            aria-hidden="true"
          >
            {opportunity.organizer.trim().charAt(0).toLocaleUpperCase('tr-TR') || 'F'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              {opportunity.title}
            </span>
            <span className="mt-px block truncate text-[12px] font-medium text-[var(--text-secondary)]">
              {opportunity.organizer}
            </span>
          </span>
          <GripVertical aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-[var(--text-tertiary)] transition-colors group-hover/card:text-[var(--text-secondary)]" />
        </div>

        <div className="mt-2.5 flex min-w-0 items-center gap-1.5">
          <span className="truncate rounded-[5px] border border-[var(--border)] bg-[var(--badge-bg)] px-1.5 py-1 text-[9px] font-bold text-[var(--text-secondary)]">
            {getOpportunityTypeLabel(opportunity.opportunity_type)}
          </span>
          <span className="shrink-0 rounded-[5px] bg-[var(--bg-column)] px-1.5 py-1 text-[9px] font-semibold text-[var(--text-tertiary)]">
            {getOpportunityFormatLabel(opportunity.event_format)}
          </span>
        </div>
      </button>

      <div className="flex min-h-8 items-center gap-2 border-t border-[var(--border)] px-3.5 py-1.5 text-[10px] font-medium text-[var(--text-tertiary)]">
        {eventDate ? (
          <span className="inline-flex items-center gap-1" title="Etkinlik tarihi">
            <CalendarDays aria-hidden="true" size={12} />
            {eventDate}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <CalendarDays aria-hidden="true" size={12} />
            Tarih yok
          </span>
        )}

        {opportunity.location ? (
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin aria-hidden="true" size={12} className="shrink-0" />
            <span className="truncate">{opportunity.location}</span>
          </span>
        ) : opportunity.event_format === 'online' ? (
          <span className="inline-flex items-center gap-1">
            <Globe2 aria-hidden="true" size={12} /> Online
          </span>
        ) : null}

        {opportunity.opportunity_url ? (
          <a
            href={opportunity.opportunity_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-[5px] px-1 py-0.5 font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            aria-label={`${opportunity.title} bağlantısını yeni sekmede aç`}
          >
            Aç
            <ArrowUpRight aria-hidden="true" size={12} strokeWidth={2.2} />
          </a>
        ) : null}
      </div>
    </article>
  )
}
