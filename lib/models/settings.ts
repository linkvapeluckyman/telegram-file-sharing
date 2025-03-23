import { connectToDatabase } from "@/lib/mongodb"

export type BotSettings = {
  forceSubscription: boolean
  forceSubscriptionChannel: string
  protectContent: boolean
  autoDeleteTime: number
  autoDeleteMessage: string
  autoDelSuccessMsg: string
  startMessage: string
  customCaption: string
  adLink: string
  adEnabled: boolean
  adWaitTime: number
}

export async function getSettings() {
  try {
    const { db } = await connectToDatabase()

    // Try to get settings from database first
    const settingsDoc = await db.collection("settings").findOne({ type: "bot_settings" })

    if (settingsDoc) {
      return {
        success: true,
        settings: {
          forceSubscription: settingsDoc.forceSubscription,
          forceSubscriptionChannel: settingsDoc.forceSubscriptionChannel || "",
          protectContent: settingsDoc.protectContent,
          autoDeleteTime: settingsDoc.autoDeleteTime,
          autoDeleteMessage: settingsDoc.autoDeleteMessage,
          autoDelSuccessMsg: settingsDoc.autoDelSuccessMsg,
          startMessage: settingsDoc.startMessage,
          customCaption: settingsDoc.customCaption,
          adLink: settingsDoc.adLink || "",
          adEnabled: settingsDoc.adEnabled || false,
          adWaitTime: settingsDoc.adWaitTime || 10,
        },
      }
    }

    // If no settings in database, use environment variables
    return {
      success: true,
      settings: {
        forceSubscription: process.env.FORCE_SUB_CHANNEL !== "0",
        forceSubscriptionChannel: process.env.FORCE_SUB_CHANNEL || "",
        protectContent: process.env.PROTECT_CONTENT === "True",
        autoDeleteTime: Number.parseInt(process.env.AUTO_DELETE_TIME || "0"),
        autoDeleteMessage: process.env.AUTO_DELETE_MSG || "This file will be automatically deleted in {time} seconds.",
        autoDelSuccessMsg:
          process.env.AUTO_DEL_SUCCESS_MSG ||
          "Your file has been successfully deleted. Thank you for using our service. ✅",
        startMessage: process.env.START_MESSAGE || "",
        customCaption: process.env.CUSTOM_CAPTION || "",
        adLink: process.env.AD_LINK || "",
        adEnabled: process.env.AD_ENABLED === "true",
        adWaitTime: Number.parseInt(process.env.AD_WAIT_TIME || "10"),
      },
    }
  } catch (error) {
    console.error("Error getting settings:", error)
    return { success: false, error: "An error occurred while fetching settings" }
  }
}

