"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { getSettings, updateSettings, type BotSettings } from "@/lib/actions/settings"

export function Settings() {
  const [settings, setSettings] = useState<BotSettings>({
    forceSubscription: true,
    forceSubscriptionChannel: "-100123456789",
    protectContent: true,
    autoDeleteTime: 3600,
    autoDeleteMessage: "This file will be automatically deleted in {time} seconds.",
    autoDelSuccessMsg: "Your file has been successfully deleted. Thank you for using our service. ✅",
    startMessage:
      "Hello {first}\n\nI can store private files in Specified Channel and other users can access it from special link.",
    customCaption: "",
    adLink: "",
    adEnabled: false,
    adWaitTime: 10,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const result = await getSettings()
      if (result.success) {
        setSettings(result.settings)
        console.log("Settings loaded:", result.settings)
      } else {
        toast.error(result.error || "Failed to load settings")
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("An error occurred while loading settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)

    try {
      console.log("Saving settings:", settings)

      // Ensure the force subscription channel ID is properly formatted
      let formattedChannelId = settings.forceSubscriptionChannel

      // If it doesn't start with -100 and it's not empty, add it
      if (formattedChannelId && !formattedChannelId.startsWith("-100") && !isNaN(Number(formattedChannelId))) {
        formattedChannelId = `-100${formattedChannelId}`
        // Update the settings object
        settings.forceSubscriptionChannel = formattedChannelId
      }

      console.log("Formatted channel ID:", formattedChannelId)

      const result = await updateSettings(settings)

      if (result.success) {
        toast.success("Settings saved successfully! The bot will now use these new settings.")
      } else {
        toast.error(result.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("An error occurred while saving settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="force-subscription">Force Subscription</Label>
            <p className="text-sm text-muted-foreground">Require users to join a channel before accessing files</p>
          </div>
          <Switch
            id="force-subscription"
            checked={settings.forceSubscription}
            onCheckedChange={(checked) => setSettings({ ...settings, forceSubscription: checked })}
          />
        </div>

        {settings.forceSubscription && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="force-subscription-channel">Force Subscription Channel ID</Label>
              <Input
                id="force-subscription-channel"
                value={settings.forceSubscriptionChannel}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    forceSubscriptionChannel: e.target.value,
                  })
                }
                placeholder="Enter channel ID (e.g., -100xxxxxxxxxx)"
              />
              <p className="text-xs text-muted-foreground">
                Enter the full channel ID including -100 prefix (e.g., -1001234567890). For public channels, you can
                also use the username without @ (e.g., mychannel).
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="protect-content">Protect Content</Label>
          <p className="text-sm text-muted-foreground">Prevent users from forwarding or saving files from the bot</p>
        </div>
        <Switch
          id="protect-content"
          checked={settings.protectContent}
          onCheckedChange={(checked) => setSettings({ ...settings, protectContent: checked })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-delete">Auto Delete</Label>
            <p className="text-sm text-muted-foreground">Automatically delete files after a specified time</p>
          </div>
          <Switch
            id="auto-delete"
            checked={settings.autoDeleteTime > 0}
            onCheckedChange={(checked) =>
              setSettings({
                ...settings,
                autoDeleteTime: checked ? 3600 : 0, // Default: 1 hour
              })
            }
          />
        </div>

        {settings.autoDeleteTime > 0 && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="auto-delete-time">Auto Delete Time (seconds)</Label>
              <Input
                id="auto-delete-time"
                type="number"
                value={settings.autoDeleteTime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoDeleteTime: Number.parseInt(e.target.value),
                  })
                }
                min={60}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="auto-delete-message">Auto Delete Message</Label>
              <Textarea
                id="auto-delete-message"
                value={settings.autoDeleteMessage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoDeleteMessage: e.target.value,
                  })
                }
                placeholder="This file will be automatically deleted in {formatted_time}. Please ensure you have saved any necessary content before this time."
              />
              <p className="text-xs text-muted-foreground">
                Use {"{time}"} for seconds or {"{formatted_time}"} for human-readable format (e.g., "2 hours 30
                minutes").
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="auto-delete-success-message">Auto Delete Success Message</Label>
              <Textarea
                id="auto-delete-success-message"
                value={settings.autoDelSuccessMsg}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoDelSuccessMsg: e.target.value,
                  })
                }
                placeholder="Your file has been successfully deleted. Thank you for using our service. ✅"
              />
            </div>
          </>
        )}
      </div>

      {/* Ad Settings Section */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium">Monetization Settings</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="ad-enabled">Enable Ads</Label>
            <p className="text-sm text-muted-foreground">Show ads to users before they can access files</p>
          </div>
          <Switch
            id="ad-enabled"
            checked={settings.adEnabled}
            onCheckedChange={(checked) => setSettings({ ...settings, adEnabled: checked })}
          />
        </div>

        {settings.adEnabled && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="ad-link">Ad Link</Label>
              <Input
                id="ad-link"
                value={settings.adLink}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    adLink: e.target.value,
                  })
                }
                placeholder="Enter the ad link (e.g., https://example.com)"
              />
              <p className="text-xs text-muted-foreground">
                Users will be required to click this link before accessing files (once every 24 hours)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ad-wait-time">Wait Time (seconds)</Label>
              <Input
                id="ad-wait-time"
                type="number"
                value={settings.adWaitTime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    adWaitTime: Number.parseInt(e.target.value),
                  })
                }
                min={5}
                max={30}
              />
              <p className="text-xs text-muted-foreground">
                How long users must wait after clicking the ad before they can access the file (5-30 seconds)
              </p>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="start-message">Start Message</Label>
        <Textarea
          id="start-message"
          value={settings.startMessage}
          onChange={(e) => setSettings({ ...settings, startMessage: e.target.value })}
          placeholder="Welcome message when users start the bot"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="custom-caption">Custom Caption</Label>
        <Textarea
          id="custom-caption"
          value={settings.customCaption}
          onChange={(e) => setSettings({ ...settings, customCaption: e.target.value })}
          placeholder="Custom caption for shared files"
        />
      </div>

      <Button onClick={handleSaveSettings} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  )
}

