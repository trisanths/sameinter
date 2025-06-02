"use client";

import { memo, useMemo } from "react";
import { LiveProvider, LivePreview, LiveError } from "react-live";
import { getPreviewCode, sanitizeCode } from "@/lib/utils/react-preview";
import { AlertTriangle } from "lucide-react";

interface ReactPreviewProps {
  fileSystem?: Record<string, { content: string; language: string }>;
  onRefresh?: () => void;
}

export const ReactPreview = memo(function ReactPreview({
  fileSystem = {},
  onRefresh = () => {},
}: ReactPreviewProps) {
  const previewCode = useMemo(() => {
    const reactFile = Object.keys(fileSystem).find(
      (path) => path.endsWith(".tsx") || path.endsWith(".jsx")
    );

    if (!reactFile || !fileSystem[reactFile]) {
      return null;
    }

    const rawCode = fileSystem[reactFile].content;
    const sanitized = sanitizeCode(rawCode);
    return getPreviewCode(sanitized);
  }, [fileSystem]);

  if (!previewCode) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Preview Available</p>
          <p className="text-sm">No valid React component found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-2 bg-secondary/10">
        <span className="text-sm font-medium">Live Preview</span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <LiveProvider
          code={previewCode}
          noInline={true}
          theme={{
            plain: {
              backgroundColor: "transparent",
              color: "inherit",
            },
            styles: [],
          }}
        >
          <div className="h-full flex flex-col gap-4">
            <div className="flex-1 min-h-0 border border-border rounded-lg p-4 bg-card overflow-auto">
              <LivePreview className="w-full h-full" />
            </div>
            <LiveError className="text-destructive bg-destructive/10 rounded-lg p-3 text-sm font-mono whitespace-pre-wrap max-h-32 overflow-auto" />
          </div>
        </LiveProvider>
      </div>
    </div>
  );
});
