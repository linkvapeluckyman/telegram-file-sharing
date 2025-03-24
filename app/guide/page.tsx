import type { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InfoIcon, AlertTriangle, FileIcon, Settings, Users, BarChart, Clock, Shield } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Guide | Telegram File Sharing",
  description: "Comprehensive guide for setting up and using the Telegram File Sharing Bot",
}

export default function GuidePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col space-y-8 max-w-4xl mx-auto">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Telegram File Sharing Bot Guide</h1>
          <p className="text-xl text-muted-foreground">
            A comprehensive guide to setting up and using the Telegram File Sharing Bot
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="installation">Installation</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="env-vars">Environment Variables</TabsTrigger>
            <TabsTrigger value="admin">Admin Dashboard</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription>
                  A secure and feature-rich file sharing system built on top of Telegram's infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>
                  This application allows you to share files through Telegram with enhanced features like auto-deletion,
                  content protection, forced subscription, and monetization options.
                </p>

                <div>
                  <h3 className="text-lg font-medium mb-3">Key Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <FileIcon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Secure File Sharing</h4>
                        <p className="text-sm text-muted-foreground">
                          Share files through Telegram with unique encoded links
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Users className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Force Subscribe</h4>
                        <p className="text-sm text-muted-foreground">
                          Require users to join your channel before accessing files
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Content Protection</h4>
                        <p className="text-sm text-muted-foreground">
                          Prevent forwarding and saving of files outside your system
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Auto-Delete</h4>
                        <p className="text-sm text-muted-foreground">
                          Files are automatically deleted after a specified time period
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Settings className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Admin Dashboard</h4>
                        <p className="text-sm text-muted-foreground">
                          Comprehensive web interface to manage files, users, and settings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <BarChart className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Analytics</h4>
                        <p className="text-sm text-muted-foreground">Track file access and ad performance metrics</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Quick links to get you started with the project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/guide?tab=installation" className="block">
                    <Card className="h-full hover:bg-muted/50 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Installation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Set up the project on your local environment</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/guide?tab=configuration" className="block">
                    <Card className="h-full hover:bg-muted/50 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Configuration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Configure your Telegram bot and channels</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/guide?tab=deployment" className="block">
                    <Card className="h-full hover:bg-muted/50 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Deployment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Deploy your application to Vercel</p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="installation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Installation</CardTitle>
                <CardDescription>Follow these steps to set up the project on your local environment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Prerequisites</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Node.js 18.x or higher</li>
                    <li>MongoDB database</li>
                    <li>Telegram Bot Token</li>
                    <li>Vercel account (for deployment)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Local Development</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">1. Clone the repository</h4>
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                        <code>
                          git clone https://github.com/yourusername/telegram-filesharing.git
                          <br />
                          cd telegram-filesharing
                        </code>
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">2. Install dependencies</h4>
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                        <code>npm install</code>
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">3. Set up environment variables</h4>
                      <p className="mb-2">
                        Create a <code>.env.local</code> file in the root directory with the required variables. See the{" "}
                        <Link href="/guide?tab=env-vars" className="text-primary hover:underline">
                          Environment Variables
                        </Link>{" "}
                        section for details.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">4. Run the development server</h4>
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                        <code>npm run dev</code>
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">5. Open the application</h4>
                      <p>
                        Open{" "}
                        <a
                          href="http://localhost:3000"
                          className="text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          http://localhost:3000
                        </a>{" "}
                        in your browser.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Configure your Telegram bot and channels for the file sharing system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Setting Up a Telegram Bot</h3>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>
                      Talk to{" "}
                      <a
                        href="https://t.me/BotFather"
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        @BotFather
                      </a>{" "}
                      on Telegram
                    </li>
                    <li>
                      Send <code>/newbot</code> and follow the instructions to create a new bot
                    </li>
                    <li>Copy the API token provided by BotFather</li>
                    <li>
                      Set the token as <code>TG_BOT_TOKEN</code> in your environment variables
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Creating a Storage Channel</h3>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Create a new channel in Telegram (can be private)</li>
                    <li>Add your bot as an administrator with full permissions</li>
                    <li>
                      Get the channel ID (forward a message from the channel to{" "}
                      <a
                        href="https://t.me/userinfobot"
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        @userinfobot
                      </a>
                      )
                    </li>
                    <li>
                      Set the channel ID as <code>CHANNEL_ID</code> in your environment variables (must start with -100)
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Force Subscription Channel (Optional)</h3>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Create a channel where users must subscribe to access files</li>
                    <li>Add your bot as an administrator</li>
                    <li>
                      Get the channel ID and set it as <code>FORCE_SUB_CHANNEL</code> in your environment variables
                    </li>
                    <li>
                      Set <code>FORCE_SUB_MESSAGE</code> to customize the subscription prompt
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">User Access</h3>
                  <p className="mb-2">Users can access files through:</p>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>
                      <strong>Direct Bot Interaction</strong>: Users can send the file link to the bot on Telegram
                    </li>
                    <li>
                      <strong>Web Interface</strong>: Users can access files through the web interface at{" "}
                      <code>/files</code>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="env-vars" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
                <CardDescription>Configure your application with these environment variables</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    These environment variables should be set in your <code>.env.local</code> file for local development
                    and in your Vercel project settings for deployment.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="text-lg font-medium mb-3">Required Variables</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variable</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono">TG_BOT_TOKEN</TableCell>
                        <TableCell>Your Telegram Bot Token (get it from @BotFather)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">CHANNEL_ID</TableCell>
                        <TableCell>
                          ID of the Telegram channel where files will be stored (must start with -100)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">DATABASE_URL</TableCell>
                        <TableCell>MongoDB connection string</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">DATABASE_NAME</TableCell>
                        <TableCell>Name of the MongoDB database</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">JWT_SECRET</TableCell>
                        <TableCell>Secret key for JWT authentication (min 32 characters)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">ADMIN_SECRET_KEY</TableCell>
                        <TableCell>Secret key for admin registration</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">NEXT_PUBLIC_BOT_USERNAME</TableCell>
                        <TableCell>Username of your Telegram bot (without @)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">ADMINS</TableCell>
                        <TableCell>Space-separated list of Telegram user IDs who have admin access</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">OWNER_ID</TableCell>
                        <TableCell>Telegram user ID of the bot owner</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">FORCE_SUB_CHANNEL</TableCell>
                        <TableCell>ID of the channel users must join to access files</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">PROTECT_CONTENT</TableCell>
                        <TableCell>Prevent forwarding/saving files</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">AUTO_DELETE_TIME</TableCell>
                        <TableCell>Time in seconds before files are auto-deleted</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">AD_ENABLED</TableCell>
                        <TableCell>Enable ad monetization</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">AD_LINK</TableCell>
                        <TableCell>URL for monetization ads</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">AD_WAIT_TIME</TableCell>
                        <TableCell>Time in seconds users must wait after viewing an ad</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Message Customization Variables</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variable</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono">START_MESSAGE</TableCell>
                        <TableCell>Welcome message when users start the bot</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">CUSTOM_CAPTION</TableCell>
                        <TableCell>Custom caption for shared files</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">FORCE_SUB_MESSAGE</TableCell>
                        <TableCell>Message shown when users need to subscribe to a channel</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">USER_REPLY_TEXT</TableCell>
                        <TableCell>Default reply to user messages</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">AUTO_DELETE_MSG</TableCell>
                        <TableCell>Message shown to users about auto-deletion</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">AUTO_DEL_SUCCESS_MSG</TableCell>
                        <TableCell>Message shown after successful auto-deletion</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>
                  Manage your file sharing system through the comprehensive admin dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>
                  The admin dashboard is available at <code>/admin</code> and provides a comprehensive interface to
                  manage your file sharing system.
                </p>

                <div>
                  <h3 className="text-lg font-medium mb-3">Dashboard Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Files Management</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Upload, delete, and manage files. Organize files with categories and tags.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Batch Link Generator</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Generate sharing links for multiple files at once.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">User Management</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          View user activity, track file access, and ban/unban users.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Ad Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Monitor ad clicks, view engagement metrics, and track monetization.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Categories & Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Create and manage categories and tags to organize your files.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Auto-Delete Monitor</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Track scheduled file deletions and manage auto-delete settings.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Bot Settings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Configure bot behavior, message templates, force subscription, content protection, and
                          monetization options.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Admin Access</h3>
                  <p className="mb-2">There are two ways to access the admin dashboard:</p>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>
                      <strong>Admin Registration</strong>: Use the <code>/admin/signup</code> route to create an admin
                      account with the <code>ADMIN_SECRET_KEY</code>
                    </li>
                    <li>
                      <strong>Telegram Admin</strong>: Users listed in the <code>ADMINS</code> environment variable can
                      access admin features through the Telegram bot
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deployment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deployment</CardTitle>
                <CardDescription>Deploy your Telegram File Sharing Bot to Vercel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Deploying to Vercel</h3>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Fork this repository to your GitHub account</li>
                    <li>
                      Create a new project on{" "}
                      <a
                        href="https://vercel.com"
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Vercel
                      </a>
                    </li>
                    <li>Import your forked repository</li>
                    <li>Configure the environment variables in the Vercel project settings</li>
                    <li>Deploy the project</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Setting Up the Webhook</h3>
                  <p className="mb-2">After deployment, set up the webhook to receive Telegram updates:</p>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code>
                      curl -F "url=https://your-app-url.vercel.app/api/telegram/webhook"
                      https://api.telegram.org/bot&lt;YOUR_BOT_TOKEN&gt;/setWebhook
                    </code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Setting Up Cron Jobs</h3>
                  <p className="mb-2">For auto-deletion to work properly, set up the following cron job in Vercel:</p>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Go to your project settings in Vercel</li>
                    <li>Navigate to the "Cron Jobs" section</li>
                    <li>
                      Add a new cron job with the following settings:
                      <ul className="list-disc pl-6 mt-2">
                        <li>
                          <strong>Path</strong>: <code>/api/cron/auto-delete?secret=YOUR_CRON_SECRET</code>
                        </li>
                        <li>
                          <strong>Schedule</strong>: <code>0 0 * * *</code> (runs daily at midnight)
                        </li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>External Cron Service</AlertTitle>
                  <AlertDescription>
                    For more frequent auto-deletion processing, you can use an external cron service like{" "}
                    <a
                      href="https://cron-job.org"
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      cron-job.org
                    </a>{" "}
                    with the URL:
                    <pre className="bg-muted p-2 rounded-md mt-2 overflow-x-auto">
                      <code>https://your-app-url.vercel.app/api/cron/auto-delete?secret=YOUR_CRON_SECRET</code>
                    </pre>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Support & Resources</CardTitle>
                <CardDescription>
                  Get help and find additional resources for your Telegram File Sharing Bot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Getting Help</h3>
                  <p className="mb-2">If you encounter any issues or have questions, you can:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Open an Issue</strong>: Report bugs or request features on GitHub
                    </li>
                    <li>
                      <strong>Contact the Maintainer</strong>: Reach out to the project maintainer for support
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Troubleshooting</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Webhook Issues</h4>
                      <p>If your bot is not responding to messages, check that the webhook is properly set up:</p>
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                        <code>
                          curl -F "url=https://your-app-url.vercel.app/api/telegram/webhook"
                          https://api.telegram.org/bot&lt;YOUR_BOT_TOKEN&gt;/getWebhookInfo
                        </code>
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Database Connection Issues</h4>
                      <p>
                        If you're having trouble connecting to MongoDB, check your connection string and make sure your
                        IP is whitelisted in the MongoDB Atlas dashboard.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Auto-Delete Not Working</h4>
                      <p>
                        If auto-delete is not working, verify that your cron job is properly set up and that the{" "}
                        <code>CRON_SECRET</code> matches your environment variable.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Additional Resources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Telegram Bot API</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Official documentation for the Telegram Bot API</p>
                        <a
                          href="https://core.telegram.org/bots/api"
                          className="text-primary hover:underline text-sm block mt-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit Documentation →
                        </a>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">MongoDB Documentation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Learn how to work with MongoDB databases</p>
                        <a
                          href="https://docs.mongodb.com/"
                          className="text-primary hover:underline text-sm block mt-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit Documentation →
                        </a>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Next.js Documentation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Learn about Next.js features and API</p>
                        <a
                          href="https://nextjs.org/docs"
                          className="text-primary hover:underline text-sm block mt-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit Documentation →
                        </a>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Vercel Documentation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Learn about deploying and managing your application on Vercel
                        </p>
                        <a
                          href="https://vercel.com/docs"
                          className="text-primary hover:underline text-sm block mt-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit Documentation →
                        </a>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Alert variant="default">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>License Information</AlertTitle>
                  <AlertDescription>
                    This project is licensed under the MIT License. You are free to use, modify, and distribute this
                    software, but please include the original copyright notice and license in any copy of the
                    software/source.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

