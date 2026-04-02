/**
 * Formats a UTC ISO timestamp from the database into IST (Asia/Kolkata) local time.
 * The DB stores TIMESTAMPTZ in UTC. We display in IST = UTC+5:30.
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '—'

  // Convert UTC to IST by adding 5h 30m
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000
  const ist = new Date(d.getTime() + IST_OFFSET_MS)

  const day = String(ist.getUTCDate()).padStart(2, '0')
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const month = monthNames[ist.getUTCMonth()]
  const year = ist.getUTCFullYear()

  let hours = ist.getUTCHours()
  const minutes = String(ist.getUTCMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const hoursStr = String(hours).padStart(2, '0')

  return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`
}