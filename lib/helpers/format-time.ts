/**
 * Formats seconds into a human-readable time string
 * @param seconds Total seconds to format
 * @returns Formatted time string (e.g., "2 hours 30 minutes 15 seconds")
 */
export function formatTimeFromSeconds(seconds: number): string {
  if (seconds <= 0) return "0 seconds"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  const parts = []

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`)
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`)
  }

  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}`)
  }

  return parts.join(" ")
}

