"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowRight, Copy, AlertTriangle } from "lucide-react"
import { CodeTranslator, type TranslationRequest, type TranslationResult } from "@/lib/features/code-translator"

interface CodeTranslatorPanelProps {
  initialCode?: string
  initialLanguage?: string
}

export function CodeTranslatorPanel({ initialCode = "", initialLanguage = "javascript" }: CodeTranslatorPanelProps) {
  const [sourceCode, setSourceCode] = useState(initialCode)
  const [fromLanguage, setFromLanguage] = useState(initialLanguage)
  const [toLanguage, setToLanguage] = useState("python")
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supportedLanguages = CodeTranslator.getSupportedLanguages()

  const handleTranslate = async () => {
    if (!sourceCode.trim()) return

    setIsTranslating(true)
    setError(null)
    setResult(null)

    try {
      const request: TranslationRequest = {
        code: sourceCode,
        fromLanguage,
        toLanguage,
        preserveComments: true,
      }

      const translationResult = await CodeTranslator.translateCode(request)
      setResult(translationResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed")
    } finally {
      setIsTranslating(false)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleSwapLanguages = () => {
    setFromLanguage(toLanguage)
    setToLanguage(fromLanguage)
    if (result) {
      setSourceCode(result.translatedCode)
      setResult(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔄 Code Translator
            <Badge variant="secondary">AI-Powered</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className="flex items-center gap-2">
            <Select value={fromLanguage} onValueChange={setFromLanguage}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="From language" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={handleSwapLanguages}>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Select value={toLanguage} onValueChange={setToLanguage}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="To language" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source Code Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Source Code ({fromLanguage})</label>
            <Textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder={`Enter your ${fromLanguage} code here...`}
              className="min-h-[200px] font-mono"
            />
          </div>

          {/* Translate Button */}
          <Button onClick={handleTranslate} disabled={!sourceCode.trim() || isTranslating} className="w-full">
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Translating...
              </>
            ) : (
              `Translate to ${toLanguage}`
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* Translation Result */}
          {result && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Translated Code ({toLanguage})</label>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(result.translatedCode)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea value={result.translatedCode} readOnly className="min-h-[200px] font-mono bg-muted" />
              </div>

              {result.explanation && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Explanation</label>
                  <div className="p-3 bg-muted rounded-lg text-sm">{result.explanation}</div>
                </div>
              )}

              {result.warnings && result.warnings.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Warnings</label>
                  <div className="space-y-1">
                    {result.warnings.map((warning, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm"
                      >
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-yellow-800">{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
