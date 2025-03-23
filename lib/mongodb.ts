"use server"

import { MongoClient } from "mongodb"

const uri = process.env.DATABASE_URL || ""
const dbName = process.env.DATABASE_NAME || ""

let cachedClient: MongoClient | null = null
let cachedDb: any = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  if (!uri) {
    throw new Error("Please define the DATABASE_URL environment variable")
  }

  if (!dbName) {
    throw new Error("Please define the DATABASE_NAME environment variable")
  }

  const client = new MongoClient(uri)
  await client.connect()

  const db = client.db(dbName)

  cachedClient = client
  cachedDb = db

  return { client, db }
}

