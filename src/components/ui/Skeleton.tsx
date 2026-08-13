interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-[8px] bg-[var(--bg-surface-hover)] ${className}`}
    />
  )
}
