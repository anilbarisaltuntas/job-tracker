import { AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface FeedbackBannerProps {
  message: string
  tone?: 'error' | 'success'
  onDismiss?: () => void
  onRetry?: () => void
  className?: string
}

export function FeedbackBanner({
  message,
  tone = 'error',
  onDismiss,
  onRetry,
  className = '',
}: FeedbackBannerProps) {
  const isError = tone === 'error'
  const Icon = isError ? AlertCircle : CheckCircle2

  return (
    <div
      className={`flex flex-col gap-3 rounded-[10px] border px-4 py-3 text-sm sm:flex-row sm:items-center ${
        isError
          ? 'border-[var(--danger)]/20 bg-[var(--danger-subtle)] text-[var(--danger)]'
          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
      } ${className}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <Icon aria-hidden="true" size={17} className="shrink-0" />
      <span className="min-w-0 flex-1 font-medium">{message}</span>
      <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
        {onRetry ? (
          <Button variant="ghost" size="sm" onClick={onRetry} className={isError ? '!text-[var(--danger)]' : ''}>
            <RefreshCw aria-hidden="true" size={14} />
            Tekrar dene
          </Button>
        ) : null}
        {onDismiss ? (
          <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Bildirimi kapat" className="!h-8 !w-8">
            <X aria-hidden="true" size={15} />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
