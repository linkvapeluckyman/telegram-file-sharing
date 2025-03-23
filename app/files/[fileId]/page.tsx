import type { Metadata } from "next"
import { getFileById } from "@/lib/files"
import FileViewer from "@/components/files/file-viewer"
import { notFound } from "next/navigation"
import { checkSubscription } from "@/lib/telegram"
import { isUserBanned } from "@/lib/models/banned-user"
import { cookies } from "next/headers"

type Props = {
  params: { fileId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const fileId = params.fileId
  const file = await getFileById(fileId)

  if (!file) {
    return {
      title: "File Not Found",
    }
  }

  return {
    title: `${file.name || "File"} | Telegram File Sharing`,
  }
}

export default async function FilePage({ params }: Props) {
  const fileId = params.fileId
  const file = await getFileById(fileId)

  if (!file) {
    notFound()
  }

  // Get user ID from cookies (if available)
  const userId = cookies().get("user_id")?.value

  // Check if user is banned (if we have a user ID)
  const isBanned = userId ? await isUserBanned(userId) : false

  // Check if force subscription is enabled and user is subscribed
  const subscriptionCheck = await checkSubscription(file.userId)

  return <FileViewer file={file} subscriptionCheck={subscriptionCheck} userCheck={{ isBanned }} />
}

