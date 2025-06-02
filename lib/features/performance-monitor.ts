export interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  componentCount: number
  reRenderCount: number
  timestamp: number
}

export interface ComponentMetrics {
  name: string
  renderTime: number
  propsSize: number
  stateSize: number
  childrenCount: number
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = []
  private static componentMetrics: Map<string, ComponentMetrics[]> = new Map()
  private static observers: ((metrics: PerformanceMetrics) => void)[] = []

  static startMonitoring(): void {
    // Monitor memory usage
    if ("memory" in performance) {
      setInterval(() => {
        this.recordMetrics()
      }, 1000)
    }

    // Monitor render performance
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "measure" && entry.name.startsWith("React")) {
            this.recordRenderTime(entry.duration)
          }
        }
      })
      observer.observe({ entryTypes: ["measure"] })
    }
  }

  static recordMetrics(): void {
    const memory = (performance as any).memory
    const metrics: PerformanceMetrics = {
      renderTime: this.getAverageRenderTime(),
      memoryUsage: memory ? memory.usedJSHeapSize : 0,
      componentCount: this.getComponentCount(),
      reRenderCount: this.getReRenderCount(),
      timestamp: Date.now(),
    }

    this.metrics.push(metrics)

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }

    // Notify observers
    this.observers.forEach((observer) => observer(metrics))
  }

  static recordComponentMetrics(name: string, metrics: ComponentMetrics): void {
    if (!this.componentMetrics.has(name)) {
      this.componentMetrics.set(name, [])
    }

    const componentHistory = this.componentMetrics.get(name)!
    componentHistory.push(metrics)

    // Keep only last 50 metrics per component
    if (componentHistory.length > 50) {
      componentHistory.shift()
    }
  }

  static getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  static getComponentMetrics(name: string): ComponentMetrics[] {
    return this.componentMetrics.get(name) || []
  }

  static getAllComponentMetrics(): Map<string, ComponentMetrics[]> {
    return new Map(this.componentMetrics)
  }

  static subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(observer)
    return () => {
      const index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  static clearMetrics(): void {
    this.metrics.length = 0
    this.componentMetrics.clear()
  }

  private static getAverageRenderTime(): number {
    const recentMetrics = this.metrics.slice(-10)
    if (recentMetrics.length === 0) return 0

    const total = recentMetrics.reduce((sum, m) => sum + m.renderTime, 0)
    return total / recentMetrics.length
  }

  private static getComponentCount(): number {
    return document.querySelectorAll("[data-react-component]").length
  }

  private static getReRenderCount(): number {
    // This would need to be implemented with React DevTools integration
    return 0
  }

  private static recordRenderTime(duration: number): void {
    // Record render time for current metrics
    if (this.metrics.length > 0) {
      this.metrics[this.metrics.length - 1].renderTime = duration
    }
  }
}
