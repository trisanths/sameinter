"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Palette, Zap, Database, Shield, Download, Trash2 } from "lucide-react"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface AppSettings {
  theme: "light" | "dark" | "system"
  autoSave: boolean
  showLineNumbers: boolean
  fontSize: number
  aiModel: string
  temperature: number
  maxTokens: number
  enableAnalytics: boolean
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>({
    theme: "dark",
    autoSave: true,
    showLineNumbers: true,
    fontSize: 14,
    aiModel: "gpt-4o",
    temperature: 0.7,
    maxTokens: 2048,
    enableAnalytics: false,
  })

  const [storageUsage, setStorageUsage] = useState<number>(0)

  useEffect(() => {
    const savedSettings = localStorage.getItem("devchat-settings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }

    calculateStorageUsage()
  }, [])

  const calculateStorageUsage = () => {
    try {
      let total = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length
        }
      }
      setStorageUsage(total)
    } catch (error) {
      setStorageUsage(0)
    }
  }

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
    localStorage.setItem("devchat-settings", JSON.stringify(newSettings))
  }

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const newSettings = { ...settings, [key]: value }
    saveSettings(newSettings)
  }

  const exportData = () => {
    try {
      const data = {
        settings,
        conversations: localStorage.getItem("devchat-storage"),
        timestamp: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `devchat-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export data:", error)
    }
  }

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      localStorage.removeItem("devchat-storage")
      localStorage.removeItem("devchat-settings")
      setStorageUsage(0)
      window.location.reload()
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </SheetTitle>
          <SheetDescription>Customize your DevChat experience</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <h3 className="text-lg font-medium">Appearance</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.theme} onValueChange={(value: any) => updateSetting("theme", value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Font Size: {settings.fontSize}px</Label>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([value]) => updateSetting("fontSize", value)}
                  min={12}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="line-numbers">Show Line Numbers</Label>
                <Switch
                  id="line-numbers"
                  checked={settings.showLineNumbers}
                  onCheckedChange={(checked) => updateSetting("showLineNumbers", checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <h3 className="text-lg font-medium">AI Configuration</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-model">Model</Label>
                <Select value={settings.aiModel} onValueChange={(value) => updateSetting("aiModel", value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Temperature: {settings.temperature}</Label>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={([value]) => updateSetting("temperature", value)}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Max Tokens: {settings.maxTokens}</Label>
                <Slider
                  value={[settings.maxTokens]}
                  onValueChange={([value]) => updateSetting("maxTokens", value)}
                  min={256}
                  max={4096}
                  step={256}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <h3 className="text-lg font-medium">Data & Storage</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-save">Auto Save</Label>
                <Switch
                  id="auto-save"
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => updateSetting("autoSave", checked)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Storage Usage</Label>
                  <Badge variant="outline">{formatBytes(storageUsage)}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Local storage used for conversations and settings</div>
              </div>

              <div className="flex gap-2">
                <Button onClick={exportData} variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button onClick={clearAllData} variant="destructive" size="sm" className="flex-1">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <h3 className="text-lg font-medium">Privacy</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="analytics">Enable Analytics</Label>
                  <div className="text-sm text-muted-foreground">Help improve DevChat with usage data</div>
                </div>
                <Switch
                  id="analytics"
                  checked={settings.enableAnalytics}
                  onCheckedChange={(checked) => updateSetting("enableAnalytics", checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
