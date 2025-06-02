"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { PanelRightOpen, PanelRightClose } from "lucide-react"
import { motion } from "framer-motion"

interface PreviewToggleProps {
  isPreviewVisible: boolean
  onToggle: () => void
  disabled?: boolean
}

export const PreviewToggle = memo(function PreviewToggle({
  isPreviewVisible,
  onToggle,
  disabled = false,
}: PreviewToggleProps) {
  const tooltipContent = disabled
    ? "Code preview is only supported for valid React code"
    : `${isPreviewVisible ? "Hide" : "Show"} code preview`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onToggle}
        title={tooltipContent}
        className="h-8 w-8 p-0"
      >
        {isPreviewVisible ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
      </Button>
    </motion.div>
  )
})
