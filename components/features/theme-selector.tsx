"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Palette } from "lucide-react"
import { ThemeManager, type Theme } from "@/lib/features/theme-manager"

export function ThemeSelector() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null)

  useEffect(() => {
    setThemes(ThemeManager.getAllThemes())
    setCurrentTheme(ThemeManager.getCurrentTheme())

    // Load saved theme on mount
    ThemeManager.loadSavedTheme()
  }, [])

  const handleThemeChange = (themeId: string) => {
    const success = ThemeManager.setTheme(themeId)
    if (success) {
      setCurrentTheme(ThemeManager.getCurrentTheme())
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Customization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`relative p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                currentTheme?.id === theme.id ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => handleThemeChange(theme.id)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{theme.name}</h3>
                    {theme.accessibility.highContrast && (
                      <Badge variant="secondary" className="text-xs">
                        High Contrast
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{theme.description}</p>

                  {/* Color Preview */}
                  <div className="flex gap-1">
                    {Object.entries(theme.colors)
                      .slice(0, 6)
                      .map(([key, color]) => (
                        <div
                          key={key}
                          className="w-4 h-4 rounded border border-border"
                          style={{ backgroundColor: color }}
                          title={key}
                        />
                      ))}
                  </div>
                </div>

                {currentTheme?.id === theme.id && <Check className="h-5 w-5 text-primary" />}
              </div>
            </div>
          ))}
        </div>

        {/* Accessibility Options */}
        {currentTheme && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-medium">Accessibility Features</h4>
            <div className="flex flex-wrap gap-2">
              {currentTheme.accessibility.highContrast && <Badge variant="outline">High Contrast</Badge>}
              {currentTheme.accessibility.reducedMotion && <Badge variant="outline">Reduced Motion</Badge>}
              <Badge variant="outline">Font Size: {currentTheme.accessibility.fontSize}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
