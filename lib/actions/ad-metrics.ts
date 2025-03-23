"use server"

import { connectToDatabase } from "@/lib/mongodb"
import { startOfDay, subDays, format, startOfWeek, startOfMonth, subMonths, subWeeks } from "date-fns"

// Add more metrics to the AdMetrics type
export type AdMetrics = {
  totalClicks: number
  verifiedClicks: number
  totalViews: number
  clickThroughRate: number
  averageViewsPerUser: number
  dailyClicks: { date: string; clicks: number }[]
  weeklyClicks: { date: string; clicks: number }[]
  monthlyClicks: { date: string; clicks: number }[]
  topUsers: { userId: string; clicks: number; views: number }[]
  hourlyDistribution: { hour: number; clicks: number }[]
  userRetention: {
    singleView: number
    multiplePending: number
    multipleVerified: number
  }
}

// Update the getAdMetrics function to include the new metrics
export async function getAdMetrics(): Promise<{ success: boolean; metrics?: AdMetrics; error?: string }> {
  try {
    const { db } = await connectToDatabase()

    // Get total clicks and views
    const totalClickAttempts = await db.collection("ad_clicks").countDocuments({ clickAttempt: { $exists: true } })
    const verifiedClicks = await db.collection("ad_clicks").countDocuments({ status: "verified" })

    // Get total views (sum of totalViews field across all users)
    const viewsAggregation = await db
      .collection("ad_clicks")
      .aggregate([{ $group: { _id: null, totalViews: { $sum: "$totalViews" } } }])
      .toArray()
    const totalViews = viewsAggregation.length > 0 ? viewsAggregation[0].totalViews : 0

    // Calculate click-through rate
    const clickThroughRate = totalViews > 0 ? (verifiedClicks / totalViews) * 100 : 0

    // Calculate average views per user
    const totalUsers = await db.collection("ad_clicks").countDocuments()
    const averageViewsPerUser = totalUsers > 0 ? totalViews / totalUsers : 0

    // Get daily clicks for the last 7 days
    const dailyClicks = []
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i))
      const nextDate = startOfDay(subDays(new Date(), i - 1))

      const clicks = await db.collection("ad_clicks").countDocuments({
        status: "verified",
        lastClickTime: { $gte: date, $lt: nextDate },
      })

      dailyClicks.push({
        date: format(date, "MMM dd"),
        clicks,
      })
    }

    // Get weekly clicks for the last 4 weeks
    const weeklyClicks = []
    for (let i = 3; i >= 0; i--) {
      const startDate = startOfWeek(subWeeks(new Date(), i))
      const endDate = i > 0 ? startOfWeek(subWeeks(new Date(), i - 1)) : new Date()

      const clicks = await db.collection("ad_clicks").countDocuments({
        status: "verified",
        lastClickTime: { $gte: startDate, $lt: endDate },
      })

      weeklyClicks.push({
        date: `Week ${i + 1}`,
        clicks,
      })
    }

    // Get monthly clicks for the last 6 months
    const monthlyClicks = []
    for (let i = 5; i >= 0; i--) {
      const startDate = startOfMonth(subMonths(new Date(), i))
      const endDate = i > 0 ? startOfMonth(subMonths(new Date(), i - 1)) : new Date()

      const clicks = await db.collection("ad_clicks").countDocuments({
        status: "verified",
        lastClickTime: { $gte: startDate, $lt: endDate },
      })

      monthlyClicks.push({
        date: format(startDate, "MMM yyyy"),
        clicks,
      })
    }

    // Get top users by click count with views
    const topUsers = await db
      .collection("ad_clicks")
      .aggregate([
        { $match: { status: "verified" } },
        {
          $project: {
            userId: 1,
            totalViews: { $ifNull: ["$totalViews", 0] },
          },
        },
        { $group: { _id: "$userId", clicks: { $sum: 1 }, views: { $max: "$totalViews" } } },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, userId: "$_id", clicks: 1, views: 1 } },
      ])
      .toArray()

    // Get hourly distribution
    const hourlyDistribution = []
    for (let hour = 0; hour < 24; hour++) {
      const clicks = await db.collection("ad_clicks").countDocuments({
        status: "verified",
        $expr: { $eq: [{ $hour: "$lastClickTime" }, hour] },
      })

      hourlyDistribution.push({ hour, clicks })
    }

    // Get user retention metrics
    const singleView = await db.collection("ad_clicks").countDocuments({ totalViews: 1 })
    const multiplePending = await db.collection("ad_clicks").countDocuments({
      totalViews: { $gt: 1 },
      status: { $ne: "verified" },
    })
    const multipleVerified = await db.collection("ad_clicks").countDocuments({
      totalViews: { $gt: 1 },
      status: "verified",
    })

    return {
      success: true,
      metrics: {
        totalClicks: totalClickAttempts,
        verifiedClicks,
        totalViews,
        clickThroughRate,
        averageViewsPerUser,
        dailyClicks,
        weeklyClicks,
        monthlyClicks,
        topUsers,
        hourlyDistribution,
        userRetention: {
          singleView,
          multiplePending,
          multipleVerified,
        },
      },
    }
  } catch (error) {
    console.error("Error getting ad metrics:", error)
    return { success: false, error: "An error occurred while fetching ad metrics" }
  }
}

