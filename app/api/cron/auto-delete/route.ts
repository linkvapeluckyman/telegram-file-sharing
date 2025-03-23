import { NextResponse } from "next/server"
import { processAutoDeleteJobsBatched } from "@/lib/jobs/auto-delete"

export async function GET(request: Request) {
  try {
    // Get the URL object to extract query parameters
    const url = new URL(request.url)
    const secretParam = url.searchParams.get("secret")
    const authHeader = request.headers.get("authorization")?.replace("Bearer ", "")
    const batchSizeParam = url.searchParams.get("batchSize")
    const batchSize = batchSizeParam ? Number.parseInt(batchSizeParam, 10) : 10

    // Check if either the query parameter or auth header matches the secret
    const cronSecret = process.env.CRON_SECRET
    const isAuthorized = (secretParam && secretParam === cronSecret) || (authHeader && authHeader === cronSecret)

    if (cronSecret && !isAuthorized) {
      console.error("Unauthorized cron job attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Add CORS headers for external cron services
    const headers = new Headers()
    headers.set("Access-Control-Allow-Origin", "*")
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    // Handle OPTIONS request (preflight)
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { headers, status: 204 })
    }

    console.log(`Starting auto-delete cron job with batch size: ${batchSize}...`)

    // Process auto-delete jobs with batching
    const result = await processAutoDeleteJobsBatched(batchSize)

    return NextResponse.json(
      {
        success: true,
        message: "Auto-delete job completed successfully",
        processed: result.processed,
        remaining: result.remaining,
        timestamp: new Date().toISOString(),
      },
      { headers },
    )
  } catch (error) {
    console.error("Error processing auto-delete cron:", error)
    return NextResponse.json(
      {
        error: "Failed to process auto-delete jobs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  const headers = new Headers()
  headers.set("Access-Control-Allow-Origin", "*")
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

  return new NextResponse(null, { headers, status: 204 })
}

