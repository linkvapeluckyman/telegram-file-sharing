import { NextResponse } from "next/server"
import { formatTelegramMessage } from "@/lib/helpers/telegram-formatter"

export async function GET(request: Request) {
  // Sample user data
  const user = {
    first_name: "John",
    last_name: "Doe",
    username: "johndoe",
    id: "123456789",
  }

  // Get the force subscription message from environment variables
  const rawMessage =
    process.env.FORCE_SUB_MESSAGE ||
    "Hello {first}\n\nYou need to join in my Channel/Group to use me\n\nKindly Please join Channel"

  // Replace placeholders
  const replacedMessage = rawMessage
    .replace("{first}", user.first_name)
    .replace("{last}", user.last_name)
    .replace("{username}", user.username ? `@${user.username}` : "")
    .replace("{mention}", `[${user.first_name}](tg://user?id=${user.id})`)
    .replace("{id}", user.id)

  // Format the message
  const formattedMessage = formatTelegramMessage(replacedMessage)

  // Sample buttons
  const buttons = [
    [{ text: "Join Channel", url: "https://t.me/example" }],
    [{ text: "Try Again", url: "https://t.me/bot?start=param" }],
  ]

  return NextResponse.json({
    original: rawMessage,
    replaced: replacedMessage,
    formatted: formattedMessage,
    buttons,
    telegramPayload: {
      text: formattedMessage,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: buttons,
      },
    },
  })
}

