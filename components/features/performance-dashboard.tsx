"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Activity, Clock, MemoryStickIcon as Memory, Zap, RefreshCw } from "lucide-react"
import { PerformanceMonitor, type PerformanceMetrics, type ComponentMetrics } from "@/lib/features/performance-monitor"

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [componentMetrics, setComponentMetrics] = useState<Map<string, ComponentMetrics[]>>(new Map())
  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    // Start monitoring
    PerformanceMonitor.startMonitoring()
    setIsMonitoring(true)

    // Subscribe to metrics updates
    const unsubscribe = PerformanceMonitor.subscribe((newMetrics) => {
      setMetrics(PerformanceMonitor.getMetrics())
      setComponentMetrics(PerformanceMonitor.getAllComponentMetrics())
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const currentMetrics = metrics[metrics.length - 1]
  const averageRenderTime = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length : 0

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getPerformanceStatus = (renderTime: number) => {
    if (renderTime < 16) return { status: "excellent", color: "text-green-600" }
    if (renderTime < 33) return { status: "good", color: "text-yellow-600" }
    return { status: "needs improvement", color: "text-red-600" }
  }

  const handleClearMetrics = () => {
    PerformanceMonitor.clearMetrics()
    setMetrics([])
    setComponentMetrics(new Map())
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Dashboard
              {isMonitoring && (
                <Badge variant="secondary" className="animate-pulse">
                  Live
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleClearMetrics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Metrics */}
          {currentMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Render Time</span>
                </div>
                <div className="space-y-1">
                  <div className={`text-2xl font-bold ${getPerformanceStatus(currentMetrics.renderTime).color}`}>
                    {currentMetrics.renderTime.toFixed(1)}ms
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getPerformanceStatus(currentMetrics.renderTime).status}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Memory className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{formatMemory(currentMetrics.memoryUsage)}</div>
                  <Progress value={(currentMetrics.memoryUsage / (100 * 1024 * 1024)) * 100} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Components</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{currentMetrics.componentCount}</div>
                  <div className="text-xs text-muted-foreground">Active components</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Re-renders</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{currentMetrics.reRenderCount}</div>
                  <div className="text-xs text-muted-foreground">Since last reset</div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Trends */}
          {metrics.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Performance Trends</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Average Render Time</span>
                  <div className={`text-lg font-semibold ${getPerformanceStatus(averageRenderTime).color}`}>
                    {averageRenderTime.toFixed(1)}ms
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Metrics Collected</span>
                  <div className="text-lg font-semibold">{metrics.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* Component Metrics */}
          {componentMetrics.size > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Component Performance</h4>
              <div className="space-y-2 max-h-48 overflow-auto">
                {Array.from(componentMetrics.entries()).map(([name, metrics]) => {
                  const latestMetric = metrics[metrics.length - 1]
                  return (
                    <div key={name} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm font-mono">{name}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{latestMetric.renderTime.toFixed(1)}ms</span>
                        <span>{latestMetric.childrenCount} children</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* No Data State */}
          {metrics.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Performance monitoring is active</p>
              <p className="text-sm">Metrics will appear as you interact with components</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
