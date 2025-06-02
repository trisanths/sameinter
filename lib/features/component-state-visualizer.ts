import { z } from "zod"

export const ComponentStateSchema = z.object({
  componentName: z.string(),
  props: z.record(z.any()),
  state: z.record(z.any()),
  hooks: z.array(
    z.object({
      type: z.string(),
      value: z.any(),
      dependencies: z.array(z.string()).optional(),
    }),
  ),
  renderCount: z.number(),
  lastRender: z.date(),
})

export type ComponentState = z.infer<typeof ComponentStateSchema>

export interface StateVisualizerData {
  components: Map<string, ComponentState>
  selectedComponent: string | null
  isRecording: boolean
}

export class ComponentStateVisualizer {
  private static instance: ComponentStateVisualizer
  private data: StateVisualizerData = {
    components: new Map(),
    selectedComponent: null,
    isRecording: true,
  }
  private listeners: Set<(data: StateVisualizerData) => void> = new Set()

  static getInstance(): ComponentStateVisualizer {
    if (!ComponentStateVisualizer.instance) {
      ComponentStateVisualizer.instance = new ComponentStateVisualizer()
    }
    return ComponentStateVisualizer.instance
  }

  subscribe(listener: (data: StateVisualizerData) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.data }))
  }

  recordComponentState(componentId: string, state: Omit<ComponentState, "lastRender">) {
    if (!this.data.isRecording) return

    this.data.components.set(componentId, {
      ...state,
      lastRender: new Date(),
    })
    this.notify()
  }

  selectComponent(componentId: string | null) {
    this.data.selectedComponent = componentId
    this.notify()
  }

  toggleRecording() {
    this.data.isRecording = !this.data.isRecording
    this.notify()
  }

  clearData() {
    this.data.components.clear()
    this.data.selectedComponent = null
    this.notify()
  }

  getComponentHistory(componentId: string): ComponentState[] {
    // In a real implementation, this would return historical data
    const current = this.data.components.get(componentId)
    return current ? [current] : []
  }

  exportStateData(): string {
    const data = Array.from(this.data.components.entries()).map(([id, state]) => ({
      id,
      ...state,
      lastRender: state.lastRender.toISOString(),
    }))
    return JSON.stringify(data, null, 2)
  }
}
