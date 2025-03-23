import { connectToDatabase } from "@/lib/mongodb"

export type AdClick = {
  userId: string
  lastClickTime?: Date
  clickAttempt?: Date
  fileParam?: string
  status: "pending" | "clicked" | "verified"
  totalViews: number // Track total number of ads shown to user
  lastViewTime?: Date // Track when the last ad was shown (not just clicked)
  lastFileAccess?: Date // Track when user last accessed a file
  adHistory?: Array<{
    // Track history of ad interactions
    viewTime: Date
    clickTime?: Date
    verifiedTime?: Date
    fileParam?: string
  }>
}

export async function recordAdClickAttempt(userId: string, fileParam: string) {
  try {
    const { db } = await connectToDatabase()

    // Add to history array - but don't count as a view yet
    const historyEntry = {
      viewTime: new Date(),
      fileParam,
    }

    await db.collection("ad_clicks").updateOne(
      { userId },
      {
        $set: {
          clickAttempt: new Date(),
          fileParam,
          status: "pending",
          // We no longer update lastViewTime here
          // We no longer increment totalViews here
        },
        $push: { adHistory: historyEntry },
        $setOnInsert: {
          userId,
          totalViews: 0,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    console.log(`Recorded ad click attempt for user ${userId} with file param ${fileParam}`)
    return { success: true }
  } catch (error) {
    console.error("Error recording ad click attempt:", error)
    return { success: false, error: "An error occurred while recording ad click attempt" }
  }
}

export async function recordAdClick(userId: string) {
  try {
    const { db } = await connectToDatabase()

    // Update the main record with verified status
    // Now we update lastViewTime and increment totalViews here
    await db.collection("ad_clicks").updateOne(
      { userId },
      {
        $set: {
          lastClickTime: new Date(),
          lastViewTime: new Date(), // Only count as a view when verified
          status: "verified",
        },
        $inc: { totalViews: 1 }, // Only increment view count when verified
      },
    )

    // Also update the most recent history entry
    await db.collection("ad_clicks").updateOne(
      {
        userId,
        "adHistory.fileParam": { $exists: true },
        "adHistory.verifiedTime": { $exists: false },
      },
      {
        $set: {
          "adHistory.$.clickTime": new Date(),
          "adHistory.$.verifiedTime": new Date(),
        },
      },
    )

    console.log(`Recorded verified ad click for user ${userId}`)
    return { success: true }
  } catch (error) {
    console.error("Error recording ad click:", error)
    return { success: false, error: "An error occurred while recording ad click" }
  }
}

export async function getAdClickStatus(userId: string): Promise<AdClick | null> {
  try {
    const { db } = await connectToDatabase()

    const adClick = await db.collection("ad_clicks").findOne({ userId })

    return adClick as AdClick | null
  } catch (error) {
    console.error("Error getting ad click status:", error)
    return null
  }
}

export async function shouldShowAd(userId: string) {
  try {
    const { db } = await connectToDatabase()

    // Get the user's ad click record
    const adClick = await db.collection("ad_clicks").findOne({ userId })

    if (!adClick) {
      // User has never seen an ad, so show one
      console.log(`User ${userId} has never seen an ad, showing one`)
      return true
    }

    // Check if there's an abandoned ad attempt (started but not completed)
    if (adClick.status === "pending" && adClick.clickAttempt) {
      const clickAttemptTime = adClick.clickAttempt
      const now = new Date()
      const minutesSinceAttempt = (now.getTime() - clickAttemptTime.getTime()) / (1000 * 60)

      // If the attempt was more than 30 minutes ago, consider it abandoned
      if (minutesSinceAttempt > 30) {
        console.log(
          `User ${userId} has an abandoned ad attempt from ${minutesSinceAttempt.toFixed(2)} minutes ago, showing ad again`,
        )
        return true
      }
    }

    // If the user has a verified status, check when it was last verified
    if (adClick.status === "verified" && adClick.lastViewTime) {
      // Check if it's been more than 24 hours since the last VERIFIED view
      const lastViewTime = adClick.lastViewTime
      const now = new Date()
      const hoursSinceLastView = (now.getTime() - lastViewTime.getTime()) / (1000 * 60 * 60)

      // Only show ad if it's been more than 24 hours since last verified view
      const shouldShow = hoursSinceLastView >= 24

      console.log(
        `User ${userId} has verified status: hoursSinceLastView=${hoursSinceLastView.toFixed(2)}, shouldShow=${shouldShow}`,
      )

      return shouldShow
    }

    // Check if it's been more than 24 hours since the last VERIFIED view
    const lastViewTime = adClick.lastViewTime || new Date(0)
    const now = new Date()
    const hoursSinceLastView = (now.getTime() - lastViewTime.getTime()) / (1000 * 60 * 60)

    // Check if user has accessed files recently
    const lastFileAccess = adClick.lastFileAccess || new Date(0)
    const hoursSinceLastAccess = (now.getTime() - lastFileAccess.getTime()) / (1000 * 60 * 60)
    const totalViews = adClick.totalViews || 0

    // Show ad if:
    // 1. It's been more than 24 hours since last verified view, OR
    // 2. User has accessed files recently but hasn't seen many ads
    const shouldShow = hoursSinceLastView >= 24 || (hoursSinceLastAccess < 24 && totalViews < 3)

    console.log(
      `User ${userId} ad check: hoursSinceLastView=${hoursSinceLastView.toFixed(2)}, hoursSinceLastAccess=${hoursSinceLastAccess.toFixed(2)}, totalViews=${totalViews}, shouldShow=${shouldShow}`,
    )

    return shouldShow
  } catch (error) {
    console.error("Error checking if should show ad:", error)
    // Default to not showing ad in case of error
    return false
  }
}

export async function checkPendingAdClick(userId: string, fileParam: string) {
  try {
    const { db } = await connectToDatabase()

    console.log(`Checking ad click for user ${userId} with file param ${fileParam}`)

    // First, check if the user already has a verified status that's recent
    const verifiedUser = await db.collection("ad_clicks").findOne({
      userId,
      status: "verified",
      lastViewTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Within last 24 hours
    })

    if (verifiedUser) {
      console.log(`User ${userId} already has a recent verified status, accepting as valid`)
      return true
    }

    // Get the ad click record for this user that has been clicked (not just attempted)
    const adClick = await db.collection("ad_clicks").findOne({
      userId,
      fileParam,
      status: "clicked", // Check for clicked status, not just clickAttempt
    })

    // Log what we found
    if (adClick) {
      console.log(`Found valid ad click record: status=${adClick.status}, clickAttempt=${adClick.clickAttempt}`)

      // Check if the click was recent enough (within the last hour)
      const clickTime = adClick.lastClickTime || adClick.clickAttempt || new Date(0)
      const timeSinceClick = Date.now() - clickTime.getTime()
      const minutesSinceClick = timeSinceClick / (1000 * 60)

      console.log(`Time since click: ${minutesSinceClick.toFixed(2)} minutes`)

      // If the click was more than 60 minutes ago, consider it expired
      if (minutesSinceClick > 60) {
        console.log(`Click expired (${minutesSinceClick.toFixed(2)} minutes old)`)
        return false
      }

      // If we found a record with clicked status, consider it valid
      return true
    } else {
      console.log(`No valid ad click record found for user ${userId} with file param ${fileParam}`)

      // Check if there's a pending record that hasn't been clicked yet
      const pendingClick = await db.collection("ad_clicks").findOne({
        userId,
        fileParam,
        status: "pending",
      })

      if (pendingClick) {
        console.log(`Found pending ad click that hasn't been clicked yet: ${pendingClick.clickAttempt}`)
        return false // User hasn't clicked the ad yet
      }

      // As a fallback, check if there's any recent clicked ad for this user
      const anyClick = await db.collection("ad_clicks").findOne({
        userId,
        status: "clicked",
        lastClickTime: { $gte: new Date(Date.now() - 10 * 60 * 1000) }, // Within last 10 minutes
      })

      if (anyClick) {
        console.log(`Found recent ad click with different file param: ${anyClick.fileParam}`)
        return true // Accept any recent click as valid
      }
    }

    return false
  } catch (error) {
    console.error("Error checking pending ad click:", error)
    return false
  }
}

// Add a function to record file access
export async function recordFileAccess(userId: string) {
  try {
    const { db } = await connectToDatabase()

    await db.collection("ad_clicks").updateOne(
      { userId },
      {
        $set: { lastFileAccess: new Date() },
        $setOnInsert: {
          userId,
          totalViews: 0,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    console.log(`Recorded file access for user ${userId}`)
    return { success: true }
  } catch (error) {
    console.error("Error recording file access:", error)
    return { success: false, error: "An error occurred while recording file access" }
  }
}

