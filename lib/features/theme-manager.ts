export interface Theme {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    background: string
    foreground: string
    muted: string
    accent: string
    destructive: string
    border: string
    input: string
    ring: string
  }
  accessibility: {
    highContrast: boolean
    reducedMotion: boolean
    fontSize: "small" | "medium" | "large"
  }
}

export class ThemeManager {
  private static currentTheme: Theme | null = null
  private static themes: Map<string, Theme> = new Map()

  static {
    // Initialize default themes
    this.registerTheme({
      id: "dark",
      name: "Dark",
      description: "Dark theme for low-light environments",
      colors: {
        primary: "hsl(210 40% 98%)",
        secondary: "hsl(210 40% 96%)",
        background: "hsl(222.2 84% 4.9%)",
        foreground: "hsl(210 40% 98%)",
        muted: "hsl(217.2 32.6% 17.5%)",
        accent: "hsl(217.2 32.6% 17.5%)",
        destructive: "hsl(0 62.8% 30.6%)",
        border: "hsl(217.2 32.6% 17.5%)",
        input: "hsl(217.2 32.6% 17.5%)",
        ring: "hsl(212.7 26.8% 83.9%)",
      },
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        fontSize: "medium",
      },
    })

    this.registerTheme({
      id: "light",
      name: "Light",
      description: "Light theme for bright environments",
      colors: {
        primary: "hsl(222.2 84% 4.9%)",
        secondary: "hsl(210 40% 96%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222.2 84% 4.9%)",
        muted: "hsl(210 40% 96%)",
        accent: "hsl(210 40% 96%)",
        destructive: "hsl(0 84.2% 60.2%)",
        border: "hsl(214.3 31.8% 91.4%)",
        input: "hsl(214.3 31.8% 91.4%)",
        ring: "hsl(222.2 84% 4.9%)",
      },
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        fontSize: "medium",
      },
    })

    this.registerTheme({
      id: "high-contrast",
      name: "High Contrast",
      description: "High contrast theme for accessibility",
      colors: {
        primary: "hsl(0 0% 100%)",
        secondary: "hsl(0 0% 90%)",
        background: "hsl(0 0% 0%)",
        foreground: "hsl(0 0% 100%)",
        muted: "hsl(0 0% 20%)",
        accent: "hsl(60 100% 50%)",
        destructive: "hsl(0 100% 50%)",
        border: "hsl(0 0% 100%)",
        input: "hsl(0 0% 10%)",
        ring: "hsl(60 100% 50%)",
      },
      accessibility: {
        highContrast: true,
        reducedMotion: true,
        fontSize: "large",
      },
    })
  }

  static registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme)
  }

  static getTheme(id: string): Theme | null {
    return this.themes.get(id) || null
  }

  static getAllThemes(): Theme[] {
    return Array.from(this.themes.values())
  }

  static setTheme(themeId: string): boolean {
    const theme = this.getTheme(themeId)
    if (!theme) return false

    this.currentTheme = theme
    this.applyTheme(theme)
    localStorage.setItem("selected-theme", themeId)
    return true
  }

  static getCurrentTheme(): Theme | null {
    return this.currentTheme
  }

  static loadSavedTheme(): void {
    const savedThemeId = localStorage.getItem("selected-theme")
    if (savedThemeId) {
      this.setTheme(savedThemeId)
    } else {
      this.setTheme("dark") // Default theme
    }
  }

  private static applyTheme(theme: Theme): void {
    const root = document.documentElement

    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })

    // Apply accessibility settings
    if (theme.accessibility.reducedMotion) {
      root.style.setProperty("--animation-duration", "0s")
    } else {
      root.style.removeProperty("--animation-duration")
    }

    // Apply font size
    const fontSizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
    }
    root.style.setProperty("--base-font-size", fontSizeMap[theme.accessibility.fontSize])

    // Update HTML class for theme-specific styles
    document.documentElement.className = document.documentElement.className
      .replace(/theme-\w+/g, "")
      .concat(` theme-${theme.id}`)
  }
}
