/**
 * Formats a message for Telegram, ensuring proper line breaks
 * @param message The message to format
 * @returns Formatted message
 */
export function formatTelegramMessage(message: string): string {
  // Replace \n with actual line breaks
  return message.replace(/\\n/g, "\n")
}

