// Environment configuration with proper defaults
export const envConfig = {
  // Bot configuration
  TG_BOT_TOKEN: process.env.TG_BOT_TOKEN || "",
  APP_ID: process.env.APP_ID || "",
  API_HASH: process.env.API_HASH || "",
  CHANNEL_ID: process.env.CHANNEL_ID || "",
  OWNER_ID: process.env.OWNER_ID || "",

  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || "",
  DATABASE_NAME: process.env.DATABASE_NAME || "filesharexbot",

  // Force subscription
  FORCE_SUB_CHANNEL: process.env.FORCE_SUB_CHANNEL || "0",
  JOIN_REQUEST_ENABLE: process.env.JOIN_REQUEST_ENABLE === "true",
  FORCE_SUB_MESSAGE:
    process.env.FORCE_SUB_MESSAGE ||
    "Hello {first}\n\nYou need to join in my Channel/Group to use me\n\nKindly Please join Channel",

  // Bot messages
  START_MESSAGE:
    process.env.START_MESSAGE ||
    "Hello {first}\n\nI can store private files in Specified Channel and other users can access it from special link.",
  CUSTOM_CAPTION: process.env.CUSTOM_CAPTION || "",
  USER_REPLY_TEXT: process.env.USER_REPLY_TEXT || "I'm a file sharing bot!",

  // Auto delete
  PROTECT_CONTENT: process.env.PROTECT_CONTENT === "True",
  AUTO_DELETE_TIME: Number.parseInt(process.env.AUTO_DELETE_TIME || "0"),
  AUTO_DELETE_MSG: process.env.AUTO_DELETE_MSG || "This file will be automatically deleted in {time} seconds.",
  AUTO_DEL_SUCCESS_MSG:
    process.env.AUTO_DEL_SUCCESS_MSG || "Your file has been successfully deleted. Thank you for using our service. ✅",

  // Ad settings
  AD_LINK: process.env.AD_LINK || "",
  AD_ENABLED: process.env.AD_ENABLED === "true",
  AD_WAIT_TIME: Number.parseInt(process.env.AD_WAIT_TIME || "10"),
  AD_WEBHOOK_SECRET: process.env.AD_WEBHOOK_SECRET || "",

  // Public variables
  NEXT_PUBLIC_BOT_USERNAME: process.env.NEXT_PUBLIC_BOT_USERNAME || "",
  NEXT_PUBLIC_ADMINS: process.env.NEXT_PUBLIC_ADMINS || "",
  NEXT_PUBLIC_OWNER_ID: process.env.NEXT_PUBLIC_OWNER_ID || "",
}

