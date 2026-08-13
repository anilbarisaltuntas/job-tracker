'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getCompanyLogoUrl } from '@/lib/company-brand'

interface CompanyLogoProps {
  companyName: string
  companyDomain?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'h-8 w-8 rounded-[8px]',
  md: 'h-9 w-9 rounded-[9px]',
  lg: 'h-14 w-14 rounded-[14px]',
}

const imageSizes = {
  sm: 32,
  md: 36,
  lg: 56,
}

function getCompanyInitial(companyName: string) {
  return companyName.trim().charAt(0).toLocaleUpperCase('tr-TR') || '—'
}

export default function CompanyLogo({
  companyName,
  companyDomain,
  size = 'md',
  className = '',
}: CompanyLogoProps) {
  const logoUrl = getCompanyLogoUrl(companyName, companyDomain)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const pixels = imageSizes[size]
  const showLogo = logoUrl && failedUrl !== logoUrl

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-[var(--border)] bg-[var(--bg-column)] font-bold text-[var(--text-secondary)] ${sizeStyles[size]} ${className}`}
      aria-hidden="true"
    >
      {showLogo ? (
        <Image
          src={logoUrl}
          alt=""
          width={pixels}
          height={pixels}
          unoptimized
          referrerPolicy="origin"
          className="h-full w-full object-contain p-1"
          onError={() => setFailedUrl(logoUrl)}
        />
      ) : (
        <span className={size === 'lg' ? 'text-base' : 'text-xs'}>
          {getCompanyInitial(companyName)}
        </span>
      )}
    </span>
  )
}
