import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-white shadow-[var(--shadow-button)] hover:bg-[var(--accent-hover)] active:translate-y-px',
  secondary:
    'border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-xs)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]',
  danger:
    'bg-[var(--danger-subtle)] text-[var(--danger)] hover:bg-[var(--danger-subtle-strong)]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-[var(--radius-md)] px-3 text-sm',
  md: 'h-10 rounded-[var(--radius-lg)] px-4 text-sm',
  icon: 'h-9 w-9 rounded-[var(--radius-md)]',
}

export function Button({
  className = '',
  variant = 'secondary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center gap-2 font-semibold transition-[color,background-color,border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
}
