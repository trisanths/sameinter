"use client"

import { useState, useEffect } from "react"
import { ComponentStateVisualizer } from "@/lib/features/component-state-visualizer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Pause, Trash2, Download, Eye, Activity, Database, Zap } from "lucide-react"

export function ComponentStateVisualizerPanel() {
  const [visualizer] = useState(() => ComponentStateVisualizer.getInstance())
  const [data, setData] = useState(visualizer.getState())

  useEffect(() => {
    const unsubscribe = visualizer.subscribe(setData)
    return unsubscribe
  }, [visualizer])

  const selectedComponent = data.selectedComponent ? data.components.get(data.selectedComponent) : null

  const exportData = () => {
    const exportedData = visualizer.exportStateData()
    const blob = new Blob([exportedData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "component-state-data.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatValue = (value: any): string => {
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <h3 className="font-semibold">Component State Visualizer</h3>
            <Badge variant={data.isRecording ? "default" : "secondary"}>
              {data.isRecording ? "Recording" : "Paused"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => visualizer.toggleRecording()}>
              {data.isRecording ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={() => visualizer.clearData()}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={exportData}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Component List */}
        <div className="w-64 border-r bg-secondary/5 p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Database className="h-4 w-4" />
            Components ({data.components.size})
          </h4>
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {Array.from(data.components.entries()).map(([id, component]) => (
                <Card
                  key={id}
                  className={`cursor-pointer transition-colors ${
                    data.selectedComponent === id ? "border-blue-500 bg-blue-50" : "hover:bg-secondary/50"
                  }`}
                  onClick={() => visualizer.selectComponent(id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{component.componentName}</span>
                      <Badge variant="outline" className="text-xs">
                        {component.renderCount}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {component.lastRender.toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Component Details */}
        <div className="flex-1 p-4">
          {selectedComponent ? (
            <Tabs defaultValue="state" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="state">State</TabsTrigger>
                <TabsTrigger value="props">Props</TabsTrigger>
                <TabsTrigger value="hooks">Hooks</TabsTrigger>
              </TabsList>

              <TabsContent value="state" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Component State
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <pre className="text-sm bg-muted p-4 rounded">{formatValue(selectedComponent.state)}</pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="props" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Component Props
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <pre className="text-sm bg-muted p-4 rounded">{formatValue(selectedComponent.props)}</pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hooks" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      React Hooks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {selectedComponent.hooks.map((hook, index) => (
                          <div key={index} className="border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{hook.type}</Badge>
                              {hook.dependencies && (
                                <span className="text-xs text-muted-foreground">
                                  deps: [{hook.dependencies.join(", ")}]
                                </span>
                              )}
                            </div>
                            <pre className="text-sm bg-muted p-2 rounded">{formatValue(hook.value)}</pre>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Component Selected</p>
                <p className="text-sm">Select a component from the list to view its state</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
