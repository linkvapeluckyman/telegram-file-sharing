import { format, formatDistanceToNow } from "date-fns"

/**
 * Formats a date for display
 * @param date Date to format
 * @param formatString Optional format string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, formatString = "PPP"): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return format(dateObj, formatString)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid date"
  }
}

/**
 * Formats a date as relative time (e.g., "2 days ago")
 * @param date Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch (error) {
    console.error("Error formatting relative time:", error)
    return "Unknown time"
  }
}

