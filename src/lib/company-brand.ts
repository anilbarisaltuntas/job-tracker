export function normalizeCompanyDomain(value: string | null | undefined) {
  const candidate = value?.trim()
  if (!candidate) return null

  try {
    const url = new URL(candidate.includes('://') ? candidate : `https://${candidate}`)
    return url.hostname.replace(/^www\./i, '').toLocaleLowerCase('en-US') || null
  } catch {
    return null
  }
}

export function getCompanyLogoUrl(companyName: string, companyDomain?: string | null) {
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY
  if (!token) return null

  const domain = normalizeCompanyDomain(companyDomain)
  const normalizedName = companyName.trim()
  if (!normalizedName && !domain) return null

  const identifier = domain
    ? encodeURIComponent(domain)
    : `name/${encodeURIComponent(normalizedName)}`
  const params = new URLSearchParams({
    token,
    size: '96',
    format: 'png',
    theme: 'auto',
    retina: 'true',
    fallback: '404',
  })

  return `https://img.logo.dev/${identifier}?${params.toString()}`
}
