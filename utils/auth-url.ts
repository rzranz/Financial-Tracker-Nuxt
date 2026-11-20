/**
 * Builds the /confirm callback URL for Supabase Auth email links.
 */
export function getAuthConfirmUrl(configuredSiteUrl?: string): string | undefined {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/confirm`
  }

  const trimmed = configuredSiteUrl?.trim().replace(/\/+$/, '')
  if (trimmed) {
    return `${trimmed}/confirm`
  }

  return undefined
}
