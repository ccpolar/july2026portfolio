/**
 * Dates are stored as day-precision ISO strings; formatting in UTC keeps the
 * shown day identical between the server (UTC on Vercel) and any local run.
 */
export const formatDate = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : ''
