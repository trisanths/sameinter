export interface DevicePreset {
  name: string
  width: number
  height: number
  userAgent?: string
  pixelRatio?: number
}

export const DEVICE_PRESETS: DevicePreset[] = [
  { name: "Mobile S", width: 320, height: 568 },
  { name: "Mobile M", width: 375, height: 667 },
  { name: "Mobile L", width: 425, height: 812 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Laptop", width: 1024, height: 768 },
  { name: "Laptop L", width: 1440, height: 900 },
  { name: "Desktop", width: 1920, height: 1080 },
  { name: "iPhone 12", width: 390, height: 844, pixelRatio: 3 },
  { name: "iPad Pro", width: 1024, height: 1366, pixelRatio: 2 },
]

export interface ResponsivePreviewState {
  selectedDevice: DevicePreset
  customSize: { width: number; height: number }
  orientation: "portrait" | "landscape"
  showRulers: boolean
  showGrid: boolean
  zoom: number
}

export class ResponsivePreview {
  private static instance: ResponsivePreview
  private state: ResponsivePreviewState = {
    selectedDevice: DEVICE_PRESETS[0],
    customSize: { width: 375, height: 667 },
    orientation: "portrait",
    showRulers: true,
    showGrid: false,
    zoom: 1,
  }
  private listeners: Set<(state: ResponsivePreviewState) => void> = new Set()

  static getInstance(): ResponsivePreview {
    if (!ResponsivePreview.instance) {
      ResponsivePreview.instance = new ResponsivePreview()
    }
    return ResponsivePreview.instance
  }

  subscribe(listener: (state: ResponsivePreviewState) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.state }))
  }

  setDevice(device: DevicePreset) {
    this.state.selectedDevice = device
    this.notify()
  }

  setCustomSize(width: number, height: number) {
    this.state.customSize = { width, height }
    this.notify()
  }

  toggleOrientation() {
    this.state.orientation = this.state.orientation === "portrait" ? "landscape" : "portrait"
    this.notify()
  }

  setZoom(zoom: number) {
    this.state.zoom = Math.max(0.1, Math.min(3, zoom))
    this.notify()
  }

  toggleRulers() {
    this.state.showRulers = !this.state.showRulers
    this.notify()
  }

  toggleGrid() {
    this.state.showGrid = !this.state.showGrid
    this.notify()
  }

  getCurrentDimensions(): { width: number; height: number } {
    const { selectedDevice, orientation } = this.state
    const { width, height } = selectedDevice

    return orientation === "landscape" ? { width: height, height: width } : { width, height }
  }

  getState(): ResponsivePreviewState {
    return { ...this.state }
  }
}
