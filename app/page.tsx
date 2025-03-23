import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { FileIcon as FileShare, Shield, Clock, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Telegram File Sharing Bot</h1>
        <p className="text-muted-foreground max-w-[600px]">
          Securely share files through Telegram with features like auto-deletion, content protection, and forced
          subscription.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link href="/admin">
            <Button size="lg">Admin Dashboard</Button>
          </Link>
          <Link href="/files">
            <Button size="lg" variant="outline">
              Access Files
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <Card>
            <CardHeader>
              <FileShare className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>File Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Share files securely through Telegram with unique encoded links</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Force Subscribe</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Require users to join your channel before accessing shared files</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Content Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Prevent forwarding and saving of files outside your system</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Auto-Delete</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Files are automatically deleted after a specified time period</CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

