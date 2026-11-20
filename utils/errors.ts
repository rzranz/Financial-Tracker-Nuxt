/**
 * Extracts a human-readable error message from Nitro / Fetch / Supabase errors.
 */
export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') {
    return fallback
  }

  const candidate = err as {
    data?: { statusMessage?: string; message?: string }
    statusMessage?: string
    message?: string
  }

  return (
    candidate.data?.statusMessage ||
    candidate.data?.message ||
    candidate.statusMessage ||
    candidate.message ||
    fallback
  )
}
