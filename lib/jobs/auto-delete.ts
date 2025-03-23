import { Telegram } from "telegraf"
import { getFilesToDeleteBatched, removeScheduledDeletion } from "@/lib/models/scheduled-deletion"
import { getSettings } from "@/lib/actions/settings"

const botToken = process.env.TG_BOT_TOKEN || ""
const telegram = new Telegram(botToken)

export async function processAutoDeleteJobsBatched(batchSize = 10) {
  try {
    console.log(`Processing auto-delete jobs with batch size: ${batchSize}...`)

    // Get files that need to be deleted (with batching)
    const result = await getFilesToDeleteBatched(batchSize)

    if (!result.success) {
      console.error("Failed to get files to delete:", result.error)
      return { processed: 0, remaining: 0 }
    }

    const { files, totalRemaining } = result
    console.log(`Found ${files.length} files to delete (${totalRemaining} remaining for future batches)`)

    if (files.length === 0) {
      return { processed: 0, remaining: 0 }
    }

    // Get success message from settings
    const settingsResult = await getSettings()
    const AUTO_DEL_SUCCESS_MSG = settingsResult.success
      ? settingsResult.settings.autoDelSuccessMsg
      : "Your file has been successfully deleted. Thank you for using our service. ✅"

    // Process each file
    let processedCount = 0
    const errors = []

    for (const file of files) {
      try {
        console.log(`Deleting file: ${file.fileId} from chat ${file.chatId}, message ID: ${file.messageId}`)

        // Delete the file message
        await telegram.deleteMessage(file.chatId, file.messageId)
        console.log(`Successfully deleted message ${file.messageId}`)

        // Delete the notification message if it exists
        if (file.notificationMessageId) {
          try {
            await telegram.deleteMessage(file.chatId, file.notificationMessageId)
            console.log(`Successfully deleted notification message ${file.notificationMessageId}`)
          } catch (notifError) {
            console.error(`Error deleting notification message ${file.notificationMessageId}:`, notifError)
            // Continue even if notification deletion fails
          }
        }

        // Send success message
        try {
          await telegram.sendMessage(file.chatId, AUTO_DEL_SUCCESS_MSG, {
            protect_content: true,
          })
          console.log(`Sent auto-delete success message to chat ${file.chatId}`)
        } catch (msgError) {
          console.error(`Error sending success message to chat ${file.chatId}:`, msgError)
          // Continue even if sending success message fails
        }

        // Remove the scheduled deletion from the database
        await removeScheduledDeletion(file._id)
        console.log(`Removed scheduled deletion from database`)

        processedCount++
      } catch (error) {
        console.error(`Error processing auto-delete for file ${file.fileId}:`, error)
        errors.push({
          fileId: file.fileId,
          error: error instanceof Error ? error.message : String(error),
        })

        // Try to remove the scheduled deletion even if there was an error
        // This prevents the system from repeatedly trying to process problematic files
        try {
          await removeScheduledDeletion(file._id)
          console.log(`Removed problematic scheduled deletion from database`)
        } catch (removeError) {
          console.error(`Failed to remove problematic scheduled deletion:`, removeError)
        }
      }
    }

    console.log(`Finished processing batch of auto-delete jobs. Processed: ${processedCount}, Errors: ${errors.length}`)
    return { processed: processedCount, remaining: totalRemaining }
  } catch (error) {
    console.error("Error in processAutoDeleteJobsBatched:", error)
    return { processed: 0, remaining: 0, error }
  }
}

// Keep the original function for backward compatibility
export async function processAutoDeleteJobs() {
  console.log("Using legacy non-batched auto-delete processing. Consider switching to batched version.")
  const result = await processAutoDeleteJobsBatched(10)
  return result.processed > 0
}

