import { z } from "zod"

export const ComponentElementSchema = z.object({
  id: z.string(),
  type: z.enum(["div", "button", "input", "text", "image", "card", "form", "list"]),
  props: z.record(z.any()),
  children: z.array(z.lazy(() => ComponentElementSchema)).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }),
})

export type ComponentElement = z.infer<typeof ComponentElementSchema>

export interface DragDropBuilderState {
  elements: ComponentElement[]
  selectedElement: string | null
  draggedElement: ComponentElement | null
  canvasSize: { width: number; height: number }
}

export class DragDropBuilder {
  private static instance: DragDropBuilder
  private state: DragDropBuilderState = {
    elements: [],
    selectedElement: null,
    draggedElement: null,
    canvasSize: { width: 800, height: 600 },
  }
  private listeners: Set<(state: DragDropBuilderState) => void> = new Set()

  static getInstance(): DragDropBuilder {
    if (!DragDropBuilder.instance) {
      DragDropBuilder.instance = new DragDropBuilder()
    }
    return DragDropBuilder.instance
  }

  subscribe(listener: (state: DragDropBuilderState) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.state }))
  }

  addElement(element: Omit<ComponentElement, "id">): string {
    const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newElement: ComponentElement = { ...element, id }

    this.state.elements.push(newElement)
    this.state.selectedElement = id
    this.notify()
    return id
  }

  updateElement(id: string, updates: Partial<ComponentElement>) {
    const index = this.state.elements.findIndex((el) => el.id === id)
    if (index !== -1) {
      this.state.elements[index] = { ...this.state.elements[index], ...updates }
      this.notify()
    }
  }

  deleteElement(id: string) {
    this.state.elements = this.state.elements.filter((el) => el.id !== id)
    if (this.state.selectedElement === id) {
      this.state.selectedElement = null
    }
    this.notify()
  }

  selectElement(id: string | null) {
    this.state.selectedElement = id
    this.notify()
  }

  generateReactCode(): string {
    const generateElementCode = (element: ComponentElement, indent = 0): string => {
      const spaces = "  ".repeat(indent)
      const { type, props, children, position, size } = element

      // Convert props to JSX attributes
      const propsString = Object.entries({
        ...props,
        style: {
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          ...props.style,
        },
      })
        .map(([key, value]) => {
          if (key === "style") {
            const styleString = Object.entries(value as Record<string, any>)
              .map(([k, v]) => `${k}: '${v}'`)
              .join(", ")
            return `style={{${styleString}}}`
          }
          return `${key}="${value}"`
        })
        .join(" ")

      const openTag = `${spaces}<${type}${propsString ? " " + propsString : ""}>`
      const closeTag = `${spaces}</${type}>`

      if (children && children.length > 0) {
        const childrenCode = children.map((child) => generateElementCode(child, indent + 1)).join("\n")
        return `${openTag}\n${childrenCode}\n${closeTag}`
      } else if (props.children) {
        return `${spaces}<${type}${propsString ? " " + propsString : ""}>${props.children}</${type}>`
      } else {
        return `${spaces}<${type}${propsString ? " " + propsString : ""} />`
      }
    }

    const componentsCode = this.state.elements.map((element) => generateElementCode(element, 2)).join("\n")

    return `import React from 'react'

export default function GeneratedComponent() {
  return (
    <div style={{ position: 'relative', width: '${this.state.canvasSize.width}px', height: '${this.state.canvasSize.height}px' }}>
${componentsCode}
    </div>
  )
}`
  }

  getState(): DragDropBuilderState {
    return { ...this.state }
  }

  clearCanvas() {
    this.state.elements = []
    this.state.selectedElement = null
    this.notify()
  }
}
