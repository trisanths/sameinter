"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Database, Zap } from "lucide-react"

interface HealthStatus {
  status: string
  database: string
  ai: string
  timestamp: string
}

export function StatusIndicator() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("/api/health")
        const data = await response.json()
        setHealth(data)
      } catch (error) {
        setHealth(null)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOnline) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    )
  }

  if (!health) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Wifi className="h-3 w-3" />
        Checking...
      </Badge>
    )
  }

  const isHealthy = health.status === "ok"
  const dbConnected = health.database === "connected"
  const aiConfigured = health.ai === "configured"

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isHealthy ? "default" : "destructive"} className="flex items-center gap-1">
        <Wifi className="h-3 w-3" />
        {isHealthy ? "Online" : "Issues"}
      </Badge>

      <Badge variant={dbConnected ? "default" : "secondary"} className="flex items-center gap-1">
        <Database className="h-3 w-3" />
        {dbConnected ? "DB" : "Memory"}
      </Badge>

      <Badge variant={aiConfigured ? "default" : "secondary"} className="flex items-center gap-1">
        <Zap className="h-3 w-3" />
        {aiConfigured ? "AI" : "No AI"}
      </Badge>
    </div>
  )
}
