const timeFmt = new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: '2-digit' })
const dateFmt = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
const dayFmt = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' })

const isSameDay = (a, b) => a.toDateString() === b.toDateString()

/** "٨:٢٤ م" today, "أمس", weekday within a week, otherwise full date. */
export function formatListDate(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (isSameDay(d, now)) return timeFmt.format(d)
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (isSameDay(d, yesterday)) return 'أمس'
  if (now - d < 6 * 86400000) return dayFmt.format(d)
  return dateFmt.format(d)
}
export const formatFullDate = (value) => {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : `${dateFmt.format(d)} · ${timeFmt.format(d)}`
}
export const formatDate = (value) => {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : dateFmt.format(d)
}
export const toArabicNumber = (n) => new Intl.NumberFormat('ar-EG').format(n)
export const shortId = (id = '') => id.slice(-6)
