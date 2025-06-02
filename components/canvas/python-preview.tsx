"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Square, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeExecutor, ExecutionResult } from "@/lib/code-executor";

// Add type declaration for PyScript
declare global {
  interface Window {
    pyscript?: {
      interpreter: {
        global: any;
      };
    };
  }
}

interface PythonPreviewProps {
  code: string;
  className?: string;
}

export function PythonPreview({ code, className }: PythonPreviewProps) {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [executionTime, setExecutionTime] = useState<number>(0);

  useEffect(() => {
    // Initialize PyScript
    const loadPyScript = async () => {
      try {
        setIsLoading(true);
        console.log("Starting PyScript initialization...");

        // Initialize the code executor
        const executor = CodeExecutor.getInstance();

        // Test execution to ensure PyScript is loaded
        const result = await executor.executePython(
          "print('Initializing Python runtime...')"
        );

        if (result.success) {
          console.log("PyScript initialized successfully");
          setIsLoading(false);
        } else {
          throw new Error(result.error || "Failed to initialize PyScript");
        }
      } catch (err) {
        console.error("Failed to load PyScript:", err);
        setError(
          "Failed to load PyScript. Please refresh the page and try again."
        );
        setIsLoading(false);
      }
    };

    loadPyScript();
  }, []);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setOutput("");
    setExecutionTime(0);

    try {
      console.log("Preparing to run Python code...");
      const executor = CodeExecutor.getInstance();
      const result = await executor.executePython(code);

      console.log("Code execution complete:", result);

      if (result.success) {
        setOutput(result.output);
        setExecutionTime(result.executionTime);
      } else {
        setError(result.error || "Unknown error occurred");
      }
    } catch (err) {
      console.error("Error running Python code:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  }, [code]);

  const clearOutput = useCallback(() => {
    setOutput("");
    setError(null);
    setExecutionTime(0);
  }, []);

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <div className="border-b border-border p-2 bg-secondary/10 flex items-center justify-between">
        <span className="text-sm font-medium">Python Output</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearOutput}
            disabled={isRunning || isLoading}
            className="h-7 px-2"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={runCode}
            disabled={isRunning || isLoading}
            className="h-7 px-2"
          >
            {isRunning ? (
              <>
                <Square className="h-3 w-3 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Loading PyScript</p>
            <p className="text-sm">
              Please wait while we initialize the Python runtime...
            </p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="text-sm text-destructive font-medium mb-1">
              Error
            </div>
            <pre className="text-sm text-destructive/80 whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        ) : output ? (
          <div>
            <pre className="text-sm font-mono whitespace-pre-wrap text-foreground">
              {output}
            </pre>
            {executionTime > 0 && (
              <div className="text-xs text-muted-foreground mt-2">
                Execution time: {executionTime}ms
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Ready to Run</p>
            <p className="text-sm">
              Click the Run button to execute the Python code
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
