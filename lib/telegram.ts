import { Telegram } from "telegraf"
import { recordFileAccess } from "@/lib/models/file-access"
import { formatTelegramMessage } from "@/lib/helpers/telegram-formatter"
import { isUserBanned } from "@/lib/models/banned-user"
import { getSettings } from "@/lib/actions/settings"

// Import the time formatter at the top of the file
import { formatTimeFromSeconds } from "./helpers/format-time"

const botToken = process.env.TG_BOT_TOKEN || ""
const channelId = process.env.CHANNEL_ID || ""
const forceSubChannelId = process.env.FORCE_SUB_CHANNEL || ""

// Initialize with default values, will be updated from database
let PROTECT_CONTENT = process.env.PROTECT_CONTENT === "True"
let AUTO_DELETE_TIME = Number.parseInt(process.env.AUTO_DELETE_TIME || "0")
let AUTO_DELETE_MSG = process.env.AUTO_DELETE_MSG || "This file will be automatically deleted in {time} seconds."
let AUTO_DEL_SUCCESS_MSG =
  process.env.AUTO_DEL_SUCCESS_MSG || "Your file has been successfully deleted. Thank you for using our service. ✅"

// Add these variables at the top with the other settings
let AD_ENABLED = process.env.AD_ENABLED === "true"
let AD_LINK = process.env.AD_LINK || ""
let AD_WAIT_TIME = Number.parseInt(process.env.AD_WAIT_TIME || "10")

// At the top of the file, add these variables to track force subscription settings
let FORCE_SUBSCRIPTION = process.env.FORCE_SUB_CHANNEL !== "0"
let FORCE_SUB_CHANNEL_ID = process.env.FORCE_SUB_CHANNEL || ""

// Function to refresh settings from database
export async function refreshBotSettings() {
  try {
    console.log("Refreshing bot settings from database...")
    const settingsResult = await getSettings()

    if (settingsResult.success) {
      const settings = settingsResult.settings

      // Update global settings variables
      PROTECT_CONTENT = settings.protectContent
      AUTO_DELETE_TIME = settings.autoDeleteTime
      AUTO_DELETE_MSG = settings.autoDeleteMessage
      AUTO_DEL_SUCCESS_MSG = settings.autoDelSuccessMsg
      AD_ENABLED = settings.adEnabled
      AD_LINK = settings.adLink
      AD_WAIT_TIME = settings.adWaitTime

      // Add these lines to update force subscription settings
      FORCE_SUBSCRIPTION = settings.forceSubscription
      FORCE_SUB_CHANNEL_ID = settings.forceSubscriptionChannel

      console.log("Bot settings refreshed successfully:", {
        PROTECT_CONTENT,
        AUTO_DELETE_TIME,
        AUTO_DELETE_MSG: AUTO_DELETE_MSG.substring(0, 30) + "...", // Log truncated message
        AUTO_DEL_SUCCESS_MSG: AUTO_DEL_SUCCESS_MSG.substring(0, 30) + "...", // Log truncated message
        AD_ENABLED,
        AD_LINK: AD_LINK.substring(0, 30) + "...", // Log truncated link
        AD_WAIT_TIME,
        FORCE_SUBSCRIPTION,
        FORCE_SUB_CHANNEL_ID,
      })

      return true
    } else {
      console.error("Failed to refresh bot settings:", settingsResult.error)
      return false
    }
  } catch (error) {
    console.error("Error refreshing bot settings:", error)
    return false
  }
}

// Refresh settings on module load
refreshBotSettings()

const telegram = new Telegram(botToken)

export async function processUpdate(update: any) {
  try {
    // Only refresh settings occasionally to reduce delay
    // Use a static variable to track last refresh time
    const now = Date.now()
    if (!processUpdate.lastRefresh || now - processUpdate.lastRefresh > 60000) {
      // Refresh once per minute
      await refreshBotSettings()
      processUpdate.lastRefresh = now
    }

    // Handle different types of updates
    if (update.message) {
      await handleMessage(update.message)
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query)
    }
  } catch (error) {
    console.error("Error processing update:", error)
  }
}
// Add the static property
processUpdate.lastRefresh = 0

async function handleMessage(message: any) {
  try {
    const { from, chat, text, document, photo, video, audio } = message

    // Handle private messages
    if (chat.type === "private") {
      // Check if user is banned
      const isBanned = await isUserBanned(from.id.toString())

      if (isBanned) {
        // Send banned message
        await telegram.sendMessage(
          chat.id,
          "You have been banned from using this bot. Please contact the administrator if you believe this is a mistake.",
        )
        return
      }

      // Check if user is an admin
      const admins = process.env.ADMINS?.split(" ") || []
      const ownerId = process.env.OWNER_ID
      const isAdmin = admins.includes(from.id.toString()) || from.id.toString() === ownerId

      // Handle start command with parameters (file access)
      if (text && text.startsWith("/start ")) {
        await handleStartCommand(message)
        return
      }

      // Handle file uploads from admins
      if (isAdmin && (document || photo || video || audio)) {
        await handleFileUpload(message)
        return
      }

      // Handle commands from admins
      if (isAdmin && text && text.startsWith("/")) {
        await handleAdminCommands(message)
        return
      }

      // Reply to regular users with the user reply text
      const userReplyText = process.env.USER_REPLY_TEXT || "I'm a file sharing bot!"
      await telegram.sendMessage(chat.id, userReplyText, {
        protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
      })
    }
  } catch (error) {
    console.error("Error handling message:", error)
  }
}

// Update the handleStartCommand function to implement the new ad verification system
async function handleStartCommand(message: any) {
  try {
    const { text, from, chat } = message
    const params = text.split(" ")[1]

    // Send immediate acknowledgment to let user know the bot is processing their request
    let processingMessage
    if (params) {
      processingMessage = await telegram.sendMessage(chat.id, "Processing your request...", {
        protect_content: PROTECT_CONTENT,
      })
    }

    // Check if user is banned
    const isBanned = await isUserBanned(from.id.toString())

    if (isBanned) {
      // Send banned message
      await telegram.sendMessage(
        chat.id,
        "You have been banned from using this bot. Please contact the administrator if you believe this is a mistake.",
        {
          protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
        },
      )
      return
    }

    if (!params) {
      // Send welcome message
      const startMessage = process.env.START_MESSAGE || "Welcome to the file sharing bot!"
      const formattedMessage = formatTelegramMessage(
        startMessage
          .replace("{first}", from.first_name)
          .replace("{last}", from.last_name || "")
          .replace("{username}", from.username ? `@${from.username}` : "")
          .replace("{mention}", `[${from.first_name}](tg://user?id=${from.id})`)
          .replace("{id}", from.id.toString()),
      )

      await telegram.sendMessage(chat.id, formattedMessage, {
        parse_mode: "Markdown",
        protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
      })
      return
    }

    // Check if force subscription is enabled
    if (FORCE_SUBSCRIPTION && FORCE_SUB_CHANNEL_ID) {
      const isMember = await checkUserSubscription(from.id)

      if (!isMember) {
        // Send force subscription message
        const forceMsg = process.env.FORCE_SUB_MESSAGE || "You need to join our channel to use this bot."
        const formattedMessage = formatTelegramMessage(
          forceMsg
            .replace("{first}", from.first_name)
            .replace("{last}", from.last_name || "")
            .replace("{username}", from.username ? `@${from.username}` : "")
            .replace("{mention}", `[${from.first_name}](tg://user?id=${from.id})`)
            .replace("{id}", from.id.toString()),
        )

        // Create invite link
        let inviteLink
        try {
          // Get chat for invite link
          const chat = await telegram.getChat(FORCE_SUB_CHANNEL_ID)
          inviteLink = chat.invite_link || `https://t.me/${chat.username}`

          if (!inviteLink) {
            // Try to create an invite link if one doesn't exist
            const invite = await telegram.createChatInviteLink(FORCE_SUB_CHANNEL_ID)
            inviteLink = invite.invite_link
          }
        } catch (error) {
          console.error("Error getting invite link:", error)
          inviteLink = `https://t.me/${FORCE_SUB_CHANNEL_ID.replace("-100", "")}`
        }

        // Create buttons
        const buttons = [[{ text: "Join Channel", url: inviteLink }]]

        // Add "Try Again" button if there's a parameter
        if (params) {
          buttons.push([
            { text: "Try Again", url: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}?start=${params}` },
          ])
        }

        await telegram.sendMessage(chat.id, formattedMessage, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: buttons,
          },
          protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
        })
        return
      }
    }

    // Decode the parameter to get file ID(s)
    const decoded = Buffer.from(params, "base64").toString("utf-8")

    // Check if it's a batch link (contains a hyphen between IDs)
    const batchMatch = decoded.match(/get-(\d+)-(\d+)/)

    // Check if it's an ad confirmation
    const adConfirmMatch = decoded.match(/ad-confirm-(.+)/)

    if (adConfirmMatch) {
      // This is an ad confirmation, extract the original parameter
      const originalParam = adConfirmMatch[1]
      const userId = from.id.toString()

      // Check if the user has actually clicked the ad
      const { checkPendingAdClick } = await import("./models/ad-clicks")
      const hasClickedAd = await checkPendingAdClick(userId, originalParam)

      if (!hasClickedAd) {
        // User hasn't clicked the ad yet
        await telegram.sendMessage(
          chat.id,
          "You need to click the ad link first before accessing the file. Please try again.",
          {
            protect_content: PROTECT_CONTENT,
          },
        )
        return
      }

      // Record that the user has completed the ad flow
      const { recordAdClick } = await import("./models/ad-clicks")
      await recordAdClick(userId)

      // Send a waiting message
      const waitMessage = await telegram.sendMessage(
        chat.id,
        `Thank you for supporting us! Please wait ${AD_WAIT_TIME} seconds to access your file...`,
        {
          protect_content: PROTECT_CONTENT,
        },
      )

      // Wait for the specified time
      await new Promise((resolve) => setTimeout(resolve, AD_WAIT_TIME * 1000))

      // Delete the wait message
      try {
        await telegram.deleteMessage(chat.id, waitMessage.message_id)
      } catch (error) {
        console.error("Error deleting wait message:", error)
      }

      // Now process the original request
      // Reconstruct the original /start command
      message.text = `/start ${originalParam}`
      await handleStartCommand(message)
      return
    }

    // Check if ads are enabled and if the user should see an ad
    if (AD_ENABLED && AD_LINK) {
      const { shouldShowAd, recordAdClickAttempt, recordFileAccess } = await import("./models/ad-clicks")

      // Record this file access attempt regardless of whether we show an ad
      await recordFileAccess(from.id.toString())

      // Check if user already has a verified status within the last 24 hours
      const { db } = await import("./mongodb").then((mod) => mod.connectToDatabase())
      const verifiedUser = await db.collection("ad_clicks").findOne({
        userId: from.id.toString(),
        status: "verified",
        lastViewTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Within last 24 hours
      })

      if (verifiedUser) {
        console.log(`User ${from.id} has a recent verified status, skipping ad check`)
        // Skip the ad check and continue with file delivery
      } else {
        // Normal ad check flow
        const showAd = await shouldShowAd(from.id.toString())

        if (showAd) {
          // Delete the processing message if it exists
          if (processingMessage) {
            try {
              await telegram.deleteMessage(chat.id, processingMessage.message_id)
            } catch (error) {
              console.error("Error deleting processing message:", error)
            }
          }

          // Record the ad click attempt with the file parameter
          await recordAdClickAttempt(from.id.toString(), params)

          // Create an ad confirmation parameter by encoding the original parameter
          const adConfirmParam = `ad-confirm-${params}`
          const adConfirmBase64 = Buffer.from(adConfirmParam).toString("base64")

          // Create the redirect URL through our site
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.vercel.app"
          const redirectUrl = `${appUrl}/api/redirect?userId=${from.id}&fileParam=${params}`

          // Send the ad message with a button
          await telegram.sendMessage(
            chat.id,
            `*Please click the ad link below to access your file:*

Your support helps us keep our servers running. Thank you for supporting our service.`,
            {
              parse_mode: "Markdown",
              protect_content: PROTECT_CONTENT,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "📢 Click here to support us",
                      url: redirectUrl,
                    },
                  ],
                  [
                    {
                      text: "I've clicked the ad, verify now",
                      callback_data: `ad_clicked_${params}`,
                    },
                  ],
                ],
              },
            },
          )
          return
        }
      }
    }

    // Rest of the function remains the same...
    // (batch link handling, regular file link handling, etc.)

    if (batchMatch) {
      // This is a batch link
      const firstId = Number.parseInt(batchMatch[1]) / Math.abs(Number.parseInt(channelId))
      const secondId = Number.parseInt(batchMatch[2]) / Math.abs(Number.parseInt(channelId))

      // Determine the range (start and end)
      const startId = Math.min(firstId, secondId)
      const endId = Math.max(firstId, secondId)

      // Limit the number of messages to prevent abuse
      const maxMessages = 10
      const actualEndId = startId + Math.min(endId - startId, maxMessages - 1)

      // Send a message indicating batch processing
      await telegram.sendMessage(chat.id, `Processing batch request for messages ${startId} to ${actualEndId}...`, {
        protect_content: PROTECT_CONTENT,
      })

      // Send each message in the range - with proper bounds checking
      let successCount = 0
      const totalToSend = Math.min(actualEndId - startId + 1, maxMessages)

      // Use a for loop with strict bounds checking
      for (let i = startId; i <= actualEndId && i <= endId && successCount < maxMessages; i++) {
        try {
          // Forward the file from the channel to the user
          const sentMessage = await telegram.copyMessage(chat.id, channelId, i, {
            protect_content: PROTECT_CONTENT,
          })

          // Record the file access
          recordFileAccess({
            userId: from.id.toString(),
            fileId: i.toString(),
            fileName: `File ${i}`,
          }).catch((err) => console.error("Error recording file access:", err))

          successCount++

          // Add a small safety check to prevent infinite loops
          if (successCount >= maxMessages) {
            console.log(`Reached maximum message limit (${maxMessages}). Stopping batch processing.`)
            break
          }
        } catch (error) {
          console.error(`Error forwarding message ${i}:`, error)
        }
      }

      // Delete the processing message
      if (processingMessage) {
        try {
          await telegram.deleteMessage(chat.id, processingMessage.message_id)
        } catch (error) {
          console.error("Error deleting processing message:", error)
        }
      }

      // Update user access count in database
      updateUserAccess(from).catch((err) => console.error("Error updating user access:", err))

      // Send completion message
      await telegram.sendMessage(
        chat.id,
        `✅ Batch processing complete. Successfully sent ${successCount} files.${
          endId - startId + 1 > maxMessages
            ? `\n\nNote: Showing only ${maxMessages} out of ${
                endId - startId + 1
              } messages due to limits. Please use a more specific range for the remaining files.`
            : ""
        }`,
        {
          protect_content: PROTECT_CONTENT,
        },
      )

      return
    }

    // Regular single file link
    const match = decoded.match(/get-(\d+)/)

    if (!match) {
      await telegram.sendMessage(chat.id, "Invalid file link.", {
        protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
      })
      return
    }

    const fileId = Number.parseInt(match[1]) / Math.abs(Number.parseInt(channelId))

    // Forward the file from the channel to the user with protect_content setting
    const sentMessage = await telegram.copyMessage(chat.id, channelId, fileId, {
      protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
    })

    // Record the file access
    await recordFileAccess({
      userId: from.id.toString(),
      fileId: fileId.toString(),
      fileName: `File ${fileId}`,
    })

    // Update user access count in database
    await updateUserAccess(from)

    // Delete the processing message
    if (processingMessage) {
      try {
        await telegram.deleteMessage(chat.id, processingMessage.message_id)
      } catch (error) {
        console.error("Error deleting processing message:", error)
      }
    }

    // Handle auto-delete if enabled
    if (AUTO_DELETE_TIME > 0) {
      try {
        // Format the time for human readability
        const formattedTime = formatTimeFromSeconds(AUTO_DELETE_TIME)

        // Send auto-delete notification with formatted time
        const autoDeleteMessage = await telegram.sendMessage(
          chat.id,
          AUTO_DELETE_MSG.replace("{time}", AUTO_DELETE_TIME.toString()).replace("{formatted_time}", formattedTime),
          {
            protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
          },
        )

        console.log(
          `Scheduling auto-delete for message ${sentMessage.message_id} in ${AUTO_DELETE_TIME} seconds (${formattedTime})`,
        )

        // Calculate deletion time
        const deleteAt = new Date()
        deleteAt.setSeconds(deleteAt.getSeconds() + AUTO_DELETE_TIME)

        // Schedule the deletion in the database
        const { scheduleFileDeletion } = await import("./models/scheduled-deletion")
        await scheduleFileDeletion({
          fileId: fileId.toString(),
          chatId: chat.id.toString(),
          messageId: sentMessage.message_id,
          deleteAt: deleteAt,
          notificationMessageId: autoDeleteMessage.message_id,
        })

        console.log(`Auto-delete scheduled in database for ${deleteAt.toISOString()}`)
      } catch (error) {
        console.error("Error setting up auto-delete:", error)
      }
    }
  } catch (error) {
    console.error("Error handling start command:", error)
  }
}

// Update the handleCallbackQuery function to handle the ad click callback
async function handleCallbackQuery(callbackQuery: any) {
  try {
    const { data, message, from, id: callbackQueryId } = callbackQuery

    // Check if user is banned
    const isBanned = await isUserBanned(from.id.toString())

    if (isBanned) {
      // Answer callback query with banned message - using the correct API endpoint
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text: "You have been banned from using this bot.",
            show_alert: true,
          }),
        })
      } catch (error) {
        console.error("Error answering callback query:", error)
      }
      return
    }

    // Handle different callback data
    if (data === "about") {
      // Send about information
      await telegram.editMessageText(
        message.chat.id,
        message.message_id,
        undefined,
        "This is a file sharing bot powered by Next.js and Telegram.",
        {
          parse_mode: "HTML",
          protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
        },
      )
    } else if (data === "close") {
      // Delete the message
      await telegram.deleteMessage(message.chat.id, message.message_id)
    } else if (data.startsWith("ad_clicked_")) {
      const fileParam = data.replace("ad_clicked_", "")
      const userId = from.id.toString()

      console.log(`Ad click verification from user ${userId} for file param ${fileParam}`)

      try {
        // First, answer the callback to show we're processing
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              callback_query_id: callbackQueryId,
              text: "Verifying your ad click...",
            }),
          })
        } catch (answerError) {
          console.error("Error answering callback query:", answerError)
        }

        // Check if the user has actually clicked the ad
        const { checkPendingAdClick } = await import("./models/ad-clicks")
        const hasClicked = await checkPendingAdClick(userId, fileParam)

        if (hasClicked) {
          // Record the verified ad click
          const { recordAdClick } = await import("./models/ad-clicks")
          await recordAdClick(userId)

          // Update the message with a success message and a "Get your file" button
          await telegram.editMessageText(
            message.chat.id,
            message.message_id,
            undefined,
            `✅ *Ad click verified successfully!*
  
Thank you for supporting our service. Your support helps us keep the servers running.`,
            {
              parse_mode: "Markdown",
              protect_content: PROTECT_CONTENT,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🔄 Get your file now",
                      callback_data: `get_file_${fileParam}`,
                    },
                  ],
                ],
              },
            },
          )

          // Also send a notification to confirm success
          try {
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text: "Ad click verified! You can now access your file.",
                show_alert: false,
              }),
            })
          } catch (answerError) {
            console.error("Error sending verification success notification:", answerError)
          }
        } else {
          // User hasn't actually clicked the ad - SHOW BOTH BUTTONS
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.vercel.app"
          const redirectUrl = `${appUrl}/api/redirect?userId=${userId}&adLink=${encodeURIComponent(AD_LINK)}&fileParam=${fileParam}`

          await telegram.editMessageText(
            message.chat.id,
            message.message_id,
            undefined,
            `*Please click the ad link below to access your file:*
  
Your support helps us keep our servers running. You'll only see this ad once every 24 hours.
  
⚠️ *Verification failed. Please follow these steps:*
1. Click the "Click here to support us" button below
2. Wait at least 10 seconds on the ad page
3. Return to Telegram and click "I've clicked the ad" again`,
            {
              parse_mode: "Markdown",
              protect_content: PROTECT_CONTENT,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "📢 Click here to support us",
                      url: redirectUrl,
                    },
                  ],
                  [
                    {
                      text: "I've clicked the ad, verify now",
                      callback_data: `ad_clicked_${fileParam}`,
                    },
                  ],
                ],
              },
            },
          )

          // Also send a notification to the user
          try {
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text: "Verification failed. Please click the ad link first and try again.",
                show_alert: true,
              }),
            })
          } catch (answerError) {
            console.error("Error sending verification failed notification:", answerError)
          }
        }
      } catch (error) {
        console.error(`Error handling ad click verification for user ${userId}:`, error)

        // Provide feedback to the user that something went wrong
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              callback_query_id: callbackQueryId,
              text: "An error occurred during verification. Please try again.",
              show_alert: true,
            }),
          })
        } catch (answerError) {
          console.error("Error sending error feedback to user:", answerError)
        }
      }
    } else if (data.startsWith("get_file_")) {
      // Handle the "Get your file" button click
      const originalParam = data.replace("get_file_", "")
      const userId = from.id.toString()

      // Answer the callback query - using direct API call
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text: "Processing your file request...",
          }),
        })
      } catch (answerError) {
        console.error("Error answering callback query:", answerError)
      }

      // Delete the verification message
      await telegram.deleteMessage(message.chat.id, message.message_id)

      console.log(`Processing file request for user ${userId} after ad verification`)
      // Now process the original request by simulating a /start command
      await handleStartCommand({
        text: `/start ${originalParam}`,
        from,
        chat: { id: message.chat.id, type: "private" },
      })
    }
  } catch (error) {
    console.error("Error handling callback query:", error)
  }
}

async function handleFileUpload(message: any) {
  try {
    const { chat, from, message_id, document, photo, video, audio } = message

    // Forward the file to the database channel WITHOUT protect_content setting
    // We don't want to protect content in the channel, only in bot messages
    const forwardedMsg = await telegram.copyMessage(channelId, chat.id, message_id)

    // Store file metadata in MongoDB
    const { db } = await import("./mongodb").then((mod) => mod.connectToDatabase())

    // Determine file type and name
    let fileName = "Unknown File"
    let fileSize = 0
    let fileType = "application/octet-stream"

    if (document) {
      fileName = document.file_name || "Document"
      fileSize = document.file_size || 0
      fileType = document.mime_type || "application/octet-stream"
    } else if (photo) {
      fileName = "Photo.jpg"
      fileSize = photo[photo.length - 1].file_size || 0
      fileType = "image/jpeg"
    } else if (video) {
      fileName = video.file_name || "Video.mp4"
      fileSize = video.file_size || 0
      fileType = video.mime_type || "video/mp4"
    } else if (audio) {
      fileName = audio.file_name || "Audio.mp3"
      fileSize = audio.file_size || 0
      fileType = audio.mime_type || "audio/mpeg"
    }

    // Insert file metadata into database
    await db.collection("files").insertOne({
      messageId: forwardedMsg.message_id,
      name: fileName,
      size: fileSize,
      type: fileType,
      createdAt: new Date(),
      uploadedBy: from.id.toString(),
      uploadMethod: "telegram_bot",
    })

    // Generate sharing link
    const convertedId = forwardedMsg.message_id * Math.abs(Number.parseInt(channelId))
    const string = `get-${convertedId}`
    const base64String = Buffer.from(string).toString("base64")
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME
    const link = `https://t.me/${botUsername}?start=${base64String}`

    // Send the link back to the admin
    const linkMessage = await telegram.sendMessage(chat.id, `<b>Here is your link</b>\n\n${link}`, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "🔁 Share URL", url: `https://telegram.me/share/url?url=${link}` }]],
      },
      protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
    })

    // Apply auto-delete to the link message if enabled
    if (AUTO_DELETE_TIME > 0) {
      // Format the time for human readability
      const formattedTime = formatTimeFromSeconds(AUTO_DELETE_TIME)

      // Calculate deletion time
      const deleteAt = new Date()
      deleteAt.setSeconds(deleteAt.getSeconds() + AUTO_DELETE_TIME)

      // Schedule the deletion in the database
      const { scheduleFileDeletion } = await import("./models/scheduled-deletion")
      await scheduleFileDeletion({
        fileId: "link-" + linkMessage.message_id,
        chatId: chat.id.toString(),
        messageId: linkMessage.message_id,
        deleteAt: deleteAt,
      })

      console.log(
        `Auto-delete scheduled for link message ${linkMessage.message_id} at ${deleteAt.toISOString()} (${formattedTime})`,
      )
    }
  } catch (error) {
    console.error("Error handling file upload:", error)
  }
}

// Add this function to handle the batch command
async function handleBatchCommand(message: any) {
  try {
    const { chat, from } = message

    // Check if user is an admin
    const admins = process.env.ADMINS?.split(" ") || []
    const ownerId = process.env.OWNER_ID
    const isAdmin = admins.includes(from.id.toString()) || from.id.toString() === ownerId

    if (!isAdmin) {
      await telegram.sendMessage(chat.id, "Only admins can use this command.", {
        protect_content: PROTECT_CONTENT,
      })
      return
    }

    // Get the app URL from environment variables or use a default
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.vercel.app"
    const adminUrl = `${appUrl}/admin/dashboard`

    // Send a message directing the user to the web admin interface
    await telegram.sendMessage(
      chat.id,
      `⚠️ The batch command is not available directly in the bot due to Telegram's limitations with conversation handling.

Please use our Web Admin Interface to generate batch links:
${adminUrl}

1. Log in to the admin dashboard
2. Navigate to the "Generate Links" tab
3. Use the Batch Link Generator to create links for multiple files at once`,
      {
        protect_content: PROTECT_CONTENT,
        disable_web_page_preview: false, // Allow the URL preview
      },
    )
  } catch (error) {
    console.error("Error handling batch command:", error)
  }
}

// Helper function to extract message ID from forwarded message or link
async function extractMessageId(message: any): Promise<number | null> {
  try {
    // Check if it's a forwarded message
    if (message.forward_from_chat && message.forward_from_chat.id.toString() === channelId) {
      return message.forward_message_id
    }

    // Check if it's a text message with a link
    if (message.text) {
      // Try to extract message ID from a Telegram link
      const linkMatch = message.text.match(/https:\/\/t\.me\/(?:c\/)?([^/]+)\/(\d+)/)
      if (linkMatch) {
        return Number.parseInt(linkMatch[2])
      }

      // Try to extract message ID from a plain number
      if (/^\d+$/.test(message.text.trim())) {
        return Number.parseInt(message.text.trim())
      }
    }

    return null
  } catch (error) {
    console.error("Error extracting message ID:", error)
    return null
  }
}

// Function to generate batch links
async function generateBatchLinks(chatId: number | string, startId: number, endId: number) {
  try {
    // Generate links for the range
    const start = Math.min(startId, endId)
    const end = Math.max(startId, endId)

    // Limit the number of links to prevent abuse
    const maxLinks = 100
    const actualEnd = start + Math.min(end - start, maxLinks)

    let linksText = ""
    const links = []

    for (let i = start; i <= actualEnd; i++) {
      const convertedId = i * Math.abs(Number.parseInt(channelId))
      const string = `get-${convertedId}`
      const base64String = Buffer.from(string).toString("base64")
      const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME
      const link = `https://t.me/${botUsername}?start=${base64String}`
      links.push(link)
      linksText += `${link}\n\n`
    }

    // Send the links in chunks to avoid message length limits
    const chunkSize = 10
    for (let i = 0; i < links.length; i += chunkSize) {
      const chunk = links.slice(i, i + chunkSize).join("\n\n")
      await telegram.sendMessage(chatId, chunk, {
        protect_content: PROTECT_CONTENT,
      })
    }

    // Send a completion message
    await telegram.sendMessage(chatId, `✅ Generated ${links.length} links from message ID ${start} to ${actualEnd}.`, {
      protect_content: PROTECT_CONTENT,
    })
  } catch (error) {
    console.error("Error generating batch links:", error)
  }
}

// Update the handleAdminCommands function to properly handle the batch command
async function handleAdminCommands(message: any) {
  try {
    const { text, chat } = message

    if (text === "/stats") {
      // Send bot stats
      const uptime = process.env.BOT_STATS_TEXT || "Bot Uptime: {uptime}"
      await telegram.sendMessage(chat.id, uptime.replace("{uptime}", "Active"), {
        protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
      })
    } else if (text.startsWith("/broadcast")) {
      // Handle broadcast command
      await telegram.sendMessage(chat.id, "Please reply to a message to broadcast it to all users.", {
        protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
      })
    } else if (text.startsWith("/genlink")) {
      // Handle generate link command
      await telegram.sendMessage(chat.id, "Forward a message from the database channel to generate a link.", {
        protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
      })
    } else if (text.startsWith("/batch")) {
      // Handle batch link generation
      await handleBatchCommand(message)
    } else if (text.startsWith("/settings")) {
      // Show current settings
      await telegram.sendMessage(
        chat.id,
        `<b>Current Bot Settings:</b>\n\n` +
          `Protect Content: ${PROTECT_CONTENT ? "Enabled" : "Disabled"}\n` +
          `Auto Delete: ${AUTO_DELETE_TIME > 0 ? `${AUTO_DELETE_TIME} seconds` : "Disabled"}\n`,
        {
          parse_mode: "HTML",
          protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
        },
      )
    }
  } catch (error) {
    console.error("Error handling admin commands:", error)
  }
}

export async function sendTelegramMessage(chatId: number | string, text: string, options?: any) {
  try {
    // Apply protect_content setting to all messages
    const messageOptions = {
      ...options,
      protect_content: PROTECT_CONTENT, // Apply protect_content to bot messages
    }

    const sentMessage = await telegram.sendMessage(chatId, text, messageOptions)
    return { success: true, messageId: sentMessage.message_id }
  } catch (error) {
    console.error("Error sending Telegram message:", error)
    return { success: false, error: "Failed to send message" }
  }
}

export async function forwardToChannel(file: File) {
  try {
    // Refresh settings to ensure we have the latest
    await refreshBotSettings()

    if (!botToken || !channelId) {
      throw new Error("Bot token or channel ID is missing")
    }

    // Create a buffer from the file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create form data for the API request
    const formData = new FormData()
    formData.append("chat_id", channelId)

    // Determine API endpoint based on file type
    let endpoint = "sendDocument"
    if (file.type.startsWith("image/") && !file.name.endsWith(".gif")) {
      endpoint = "sendPhoto"
      formData.append("photo", new Blob([buffer], { type: file.type }), file.name)
    } else if (file.type.startsWith("video/")) {
      endpoint = "sendVideo"
      formData.append("video", new Blob([buffer], { type: file.type }), file.name)
    } else if (file.type.startsWith("audio/")) {
      endpoint = "sendAudio"
      formData.append("audio", new Blob([buffer], { type: file.type }), file.name)
    } else {
      formData.append("document", new Blob([buffer], { type: file.type }), file.name)
    }

    // Add caption if needed
    const customCaption = process.env.CUSTOM_CAPTION
    if (customCaption) {
      formData.append("caption", customCaption)
    }

    // DO NOT apply protect_content to channel messages
    // We only want to protect bot messages, not channel content

    // Send to Telegram
    const response = await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
      method: "POST",
      body: formData,
    })

    const result = await response.json()

    if (!result.ok) {
      console.error("Telegram API error:", result)
      throw new Error(result.description || "Failed to send file to Telegram")
    }

    // Get the message ID from the response
    const messageId = result.result.message_id

    console.log(`File uploaded successfully to Telegram. Message ID: ${messageId}`)

    return { success: true, messageId }
  } catch (error) {
    console.error("Error forwarding to channel:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to forward file to channel" }
  }
}

// Update the checkSubscription function to use the global variables
export async function checkSubscription(userId: string) {
  try {
    if (!FORCE_SUBSCRIPTION || !FORCE_SUB_CHANNEL_ID) {
      return { required: false, subscribed: true }
    }

    const isMember = await checkUserSubscription(userId)

    // Try to get the channel username or invite link
    let channelUrl = `https://t.me/${FORCE_SUB_CHANNEL_ID.replace("-100", "")}`
    try {
      const chat = await telegram.getChat(FORCE_SUB_CHANNEL_ID)
      if (chat.username) {
        channelUrl = `https://t.me/${chat.username}`
      } else if (chat.invite_link) {
        channelUrl = chat.invite_link
      }
    } catch (error) {
      console.error("Error getting channel info:", error)
    }

    return {
      required: true,
      subscribed: isMember,
      channelUrl: channelUrl,
    }
  } catch (error) {
    console.error("Error checking subscription:", error)
    return { required: true, subscribed: false }
  }
}

// Update the checkUserSubscription function to use the global variable
async function checkUserSubscription(userId: string | number) {
  try {
    if (!FORCE_SUBSCRIPTION || !FORCE_SUB_CHANNEL_ID) {
      return true
    }

    console.log(`Checking if user ${userId} is subscribed to channel ${FORCE_SUB_CHANNEL_ID}`)

    const chatMember = await telegram.getChatMember(FORCE_SUB_CHANNEL_ID, userId)
    console.log(`User ${userId} subscription status: ${chatMember.status}`)

    return ["creator", "administrator", "member"].includes(chatMember.status)
  } catch (error) {
    console.error(`Error checking user ${userId} subscription to channel ${FORCE_SUB_CHANNEL_ID}:`, error)
    return false
  }
}

async function updateUserAccess(user: any) {
  try {
    const { db } = await import("./mongodb").then((mod) => mod.connectToDatabase())

    await db.collection("users").updateOne(
      { userId: user.id.toString() },
      {
        $set: {
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          lastActive: new Date(),
        },
        $inc: { accessCount: 1 },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    )
  } catch (error) {
    console.error("Error updating user access:", error)
  }
}

