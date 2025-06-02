"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ResponsivePreview, DEVICE_PRESETS } from "@/lib/features/responsive-preview"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Smartphone, Tablet, Monitor, RotateCcw, Ruler, Grid3X3, ZoomIn, ZoomOut } from "lucide-react"

interface ResponsivePreviewPanelProps {
  children: React.ReactNode
}

export function ResponsivePreviewPanel({ children }: ResponsivePreviewPanelProps) {
  const [preview] = useState(() => ResponsivePreview.getInstance())
  const [state, setState] = useState(preview.getState())

  useEffect(() => {
    const unsubscribe = preview.subscribe(setState)
    return unsubscribe
  }, [preview])

  const currentDimensions = preview.getCurrentDimensions()

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.toLowerCase().includes("mobile") || deviceName.toLowerCase().includes("iphone")) {
      return <Smartphone className="h-4 w-4" />
    }
    if (deviceName.toLowerCase().includes("tablet") || deviceName.toLowerCase().includes("ipad")) {
      return <Tablet className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="border-b p-4 bg-secondary/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Responsive Preview
          </h3>
          <Badge variant="outline">
            {currentDimensions.width} × {currentDimensions.height}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Device Selection */}
          <div>
            <Label className="text-xs">Device Preset</Label>
            <Select
              value={state.selectedDevice.name}
              onValueChange={(value) => {
                const device = DEVICE_PRESETS.find((d) => d.name === value)
                if (device) preview.setDevice(device)
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_PRESETS.map((device) => (
                  <SelectItem key={device.name} value={device.name}>
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.name)}
                      {device.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Size */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                value={state.customSize.width}
                onChange={(e) => preview.setCustomSize(Number.parseInt(e.target.value) || 0, state.customSize.height)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Height</Label>
              <Input
                type="number"
                value={state.customSize.height}
                onChange={(e) => preview.setCustomSize(state.customSize.width, Number.parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Zoom Control */}
          <div>
            <Label className="text-xs">Zoom ({Math.round(state.zoom * 100)}%)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button size="sm" variant="outline" onClick={() => preview.setZoom(state.zoom - 0.1)}>
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Slider
                value={[state.zoom]}
                onValueChange={([value]) => preview.setZoom(value)}
                min={0.1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <Button size="sm" variant="outline" onClick={() => preview.setZoom(state.zoom + 0.1)}>
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button size="sm" variant="outline" onClick={() => preview.toggleOrientation()}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Rotate
            </Button>

            <div className="flex items-center gap-2">
              <Switch checked={state.showRulers} onCheckedChange={() => preview.toggleRulers()} />
              <Ruler className="h-4 w-4" />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={state.showGrid} onCheckedChange={() => preview.toggleGrid()} />
              <Grid3X3 className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <div className="flex items-center justify-center min-h-full">
          <div
            className="relative bg-white shadow-lg"
            style={{
              width: currentDimensions.width * state.zoom,
              height: currentDimensions.height * state.zoom,
              transform: `scale(${state.zoom})`,
              transformOrigin: "top left",
            }}
          >
            {/* Rulers */}
            {state.showRulers && (
              <>
                {/* Top ruler */}
                <div
                  className="absolute -top-6 left-0 bg-gray-200 border-b text-xs flex"
                  style={{ width: currentDimensions.width }}
                >
                  {Array.from({ length: Math.ceil(currentDimensions.width / 50) }, (_, i) => (
                    <div key={i} className="w-12 text-center border-r">
                      {i * 50}
                    </div>
                  ))}
                </div>

                {/* Left ruler */}
                <div
                  className="absolute -left-6 top-0 bg-gray-200 border-r text-xs"
                  style={{ height: currentDimensions.height }}
                >
                  {Array.from({ length: Math.ceil(currentDimensions.height / 50) }, (_, i) => (
                    <div key={i} className="h-12 flex items-center justify-center border-b">
                      {i * 50}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Grid */}
            {state.showGrid && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: "20px 20px",
                }}
              />
            )}

            {/* Content */}
            <div
              className="w-full h-full overflow-auto"
              style={{
                width: currentDimensions.width,
                height: currentDimensions.height,
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
