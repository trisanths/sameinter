"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FunctionInsights, type FunctionSignature } from "@/lib/features/function-insights"

interface FunctionTooltipProps {
  functionName: string
  code: string
  language: string
  position: { x: number; y: number }
  onClose: () => void
}

export function FunctionTooltip({ functionName, code, language, position, onClose }: FunctionTooltipProps) {
  const [signature, setSignature] = useState<FunctionSignature | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSignature = async () => {
      setIsLoading(true)
      try {
        const result = await FunctionInsights.getFunctionSignature(functionName, code, language)
        setSignature(result)
      } catch (error) {
        console.error("Failed to load function signature:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSignature()
  }, [functionName, code, language])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest("[data-function-tooltip]")) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  if (isLoading) {
    return (
      <div
        data-function-tooltip
        className="fixed z-50 w-80 animate-in fade-in-0 zoom-in-95"
        style={{ left: position.x, top: position.y }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Loading function info...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!signature) {
    return (
      <div
        data-function-tooltip
        className="fixed z-50 w-80 animate-in fade-in-0 zoom-in-95"
        style={{ left: position.x, top: position.y }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              No documentation available for <code className="font-mono">{functionName}</code>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      data-function-tooltip
      className="fixed z-50 w-96 max-h-96 overflow-auto animate-in fade-in-0 zoom-in-95"
      style={{ left: position.x, top: position.y }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <code className="font-mono">{signature.name}</code>
            <Badge variant="secondary">{language}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Function Signature */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Signature</h4>
            <div className="p-2 bg-muted rounded font-mono text-sm">
              {signature.name}(
              {signature.parameters.map((param, index) => (
                <span key={index}>
                  {param.name}
                  {param.optional && "?"}: {param.type}
                  {param.defaultValue && ` = ${param.defaultValue}`}
                  {index < signature.parameters.length - 1 && ", "}
                </span>
              ))}
              ): {signature.returnType}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Description</h4>
            <p className="text-sm text-muted-foreground">{signature.description}</p>
          </div>

          {/* Parameters */}
          {signature.parameters.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Parameters</h4>
              <div className="space-y-2">
                {signature.parameters.map((param, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm">{param.name}</code>
                      <Badge variant="outline" className="text-xs">
                        {param.type}
                      </Badge>
                      {param.optional && (
                        <Badge variant="secondary" className="text-xs">
                          optional
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground ml-2">{param.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples */}
          {signature.examples && signature.examples.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Examples</h4>
                <div className="space-y-2">
                  {signature.examples.map((example, index) => (
                    <div key={index} className="p-2 bg-muted rounded font-mono text-xs">
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
