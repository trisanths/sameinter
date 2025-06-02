"use client"

import { useState, useEffect, useCallback } from "react"
import { DragDropBuilder, type ComponentElement } from "@/lib/features/drag-drop-builder"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Square, Type, ImageIcon, MousePointer, Trash2, Download, Grid, Layers } from "lucide-react"

const COMPONENT_PALETTE = [
  { type: "div", icon: Square, label: "Container", defaultProps: { className: "border p-4" } },
  { type: "button", icon: MousePointer, label: "Button", defaultProps: { children: "Click me" } },
  { type: "input", icon: Type, label: "Input", defaultProps: { placeholder: "Enter text..." } },
  { type: "text", icon: Type, label: "Text", defaultProps: { children: "Sample text" } },
  { type: "image", icon: ImageIcon, label: "Image", defaultProps: { src: "/placeholder.svg", alt: "Image" } },
]

export function DragDropBuilderPanel() {
  const [builder] = useState(() => DragDropBuilder.getInstance())
  const [state, setState] = useState(builder.getState())
  const [generatedCode, setGeneratedCode] = useState("")
  const [selectedElementProps, setSelectedElementProps] = useState<Record<string, any>>({})

  useEffect(() => {
    const unsubscribe = builder.subscribe(setState)
    return unsubscribe
  }, [builder])

  useEffect(() => {
    setGeneratedCode(builder.generateReactCode())
  }, [state.elements, builder])

  useEffect(() => {
    if (state.selectedElement) {
      const element = state.elements.find((el) => el.id === state.selectedElement)
      setSelectedElementProps(element?.props || {})
    }
  }, [state.selectedElement, state.elements])

  const handleDragStart = useCallback(
    (componentType: string) => {
      const paletteItem = COMPONENT_PALETTE.find((item) => item.type === componentType)
      if (paletteItem) {
        const element: Omit<ComponentElement, "id"> = {
          type: componentType as any,
          props: { ...paletteItem.defaultProps },
          position: { x: 50, y: 50 },
          size: { width: 150, height: 50 },
        }
        builder.addElement(element)
      }
    },
    [builder],
  )

  const handleElementUpdate = useCallback(
    (id: string, updates: Partial<ComponentElement>) => {
      builder.updateElement(id, updates)
    },
    [builder],
  )

  const handlePropChange = useCallback(
    (key: string, value: any) => {
      if (state.selectedElement) {
        const currentElement = state.elements.find((el) => el.id === state.selectedElement)
        if (currentElement) {
          const newProps = { ...currentElement.props, [key]: value }
          builder.updateElement(state.selectedElement, { props: newProps })
          setSelectedElementProps(newProps)
        }
      }
    },
    [state.selectedElement, state.elements, builder],
  )

  const downloadCode = useCallback(() => {
    const blob = new Blob([generatedCode], { type: "text/javascript" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "generated-component.jsx"
    a.click()
    URL.revokeObjectURL(url)
  }, [generatedCode])

  return (
    <div className="h-full flex">
      {/* Component Palette */}
      <div className="w-64 border-r bg-secondary/10 p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Components
        </h3>
        <div className="space-y-2">
          {COMPONENT_PALETTE.map((component) => (
            <Button
              key={component.type}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleDragStart(component.type)}
            >
              <component.icon className="h-4 w-4 mr-2" />
              {component.label}
            </Button>
          ))}
        </div>

        <div className="mt-6">
          <h4 className="font-medium mb-2">Canvas Actions</h4>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full" onClick={() => builder.clearCanvas()}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Canvas
            </Button>
            <Button variant="outline" size="sm" className="w-full" onClick={downloadCode}>
              <Download className="h-4 w-4 mr-2" />
              Download Code
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-2 bg-secondary/5">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{state.elements.length} elements</Badge>
            <div className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {state.canvasSize.width} × {state.canvasSize.height}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div
            className="relative border-2 border-dashed border-muted-foreground/20 bg-background"
            style={{
              width: state.canvasSize.width,
              height: state.canvasSize.height,
              minHeight: "400px",
            }}
          >
            {state.elements.map((element) => (
              <div
                key={element.id}
                className={`absolute border cursor-pointer ${
                  state.selectedElement === element.id ? "border-blue-500 border-2" : "border-gray-300"
                }`}
                style={{
                  left: element.position.x,
                  top: element.position.y,
                  width: element.size.width,
                  height: element.size.height,
                }}
                onClick={() => builder.selectElement(element.id)}
              >
                <div className="w-full h-full flex items-center justify-center bg-white/50">
                  <span className="text-xs text-muted-foreground">{element.type}</span>
                </div>
                {state.selectedElement === element.id && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      builder.deleteElement(element.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 border-l bg-secondary/10">
        <Tabs defaultValue="properties" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="p-4 space-y-4">
            {state.selectedElement ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Element Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(selectedElementProps).map(([key, value]) => (
                    <div key={key}>
                      <Label htmlFor={key} className="text-xs">
                        {key}
                      </Label>
                      <Input
                        id={key}
                        value={String(value)}
                        onChange={(e) => handlePropChange(key, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => handlePropChange("newProp", "")}>
                    Add Property
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center text-muted-foreground py-8">Select an element to edit properties</div>
            )}
          </TabsContent>

          <TabsContent value="code" className="p-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Generated Code</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">{generatedCode}</pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
