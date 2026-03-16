/**
 * Formats an ISO date string using UTC methods so it displays
 * identically on both server (Vercel) and client (browser).
 * The date is stored without timezone offset so UTC = the intended local time.
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '—'

  const day = String(d.getUTCDate()).padStart(2, '0')
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const month = monthNames[d.getUTCMonth()]
  const year = d.getUTCFullYear()

  let hours = d.getUTCHours()
  const minutes = String(d.getUTCMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const hoursStr = String(hours).padStart(2, '0')

  return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`
}
