import React from "react"
import * as Babel from "@babel/standalone"

interface FileSystemEntry {
  content: string
  language: string
}

export class NextJSRuntime {
  private static instance: NextJSRuntime
  private fileSystem: Record<string, FileSystemEntry> = {}
  private compiledComponents: Record<string, React.ComponentType> = {}

  static getInstance(): NextJSRuntime {
    if (!NextJSRuntime.instance) {
      NextJSRuntime.instance = new NextJSRuntime()
    }
    return NextJSRuntime.instance
  }

  async setFileSystem(files: Record<string, FileSystemEntry>): Promise<void> {
    console.log("NextJSRuntime: Setting file system with files:", Object.keys(files))
    this.fileSystem = files
    this.compiledComponents = {}

    // Compile all React components
    for (const [path, file] of Object.entries(files)) {
      if (this.isReactFile(path)) {
        try {
          const component = this.compileComponent(file.content, path)
          if (component) {
            this.compiledComponents[path] = component
          }
        } catch (error) {
          console.error(`Error compiling ${path}:`, error)
        }
      }
    }
  }

  renderApp(route = "/"): { component?: React.ComponentType; error?: string } {
    try {
      // Find the main component (page.tsx, index.tsx, or App.tsx)
      const mainFiles = ["page.tsx", "app/page.tsx", "src/page.tsx", "index.tsx", "App.tsx", "main.jsx", "App.jsx"]

      for (const fileName of mainFiles) {
        if (this.compiledComponents[fileName]) {
          console.log("NextJSRuntime: Found main component:", fileName)
          return { component: this.compiledComponents[fileName] }
        }
      }

      // If no main file found, try the first available component
      const firstComponent = Object.values(this.compiledComponents)[0]
      if (firstComponent) {
        console.log("NextJSRuntime: Using first available component")
        return { component: firstComponent }
      }

      return { error: "No valid React component found" }
    } catch (error: any) {
      console.error("NextJSRuntime: Render error:", error)
      return { error: error.message }
    }
  }

  private isReactFile(path: string): boolean {
    return /\.(tsx|jsx)$/.test(path)
  }

  private compileComponent(code: string, fileName: string): React.ComponentType | null {
    try {
      // Transform JSX/TSX to JavaScript
      const result = Babel.transform(code, {
        presets: [
          ["react", { runtime: "automatic" }],
          ["typescript", { isTSX: true, allExtensions: true }],
        ],
        plugins: ["transform-modules-commonjs"],
        filename: fileName,
      })

      if (!result.code) {
        throw new Error("Babel transformation failed")
      }

      // Create a function that returns the component
      const componentFunction = new Function(
        "React",
        "useState",
        "useEffect",
        "useCallback",
        "useMemo",
        "useRef",
        `
        ${result.code}
        
        // Try to find and return the default export or main component
        if (typeof exports !== 'undefined' && exports.default) {
          return exports.default;
        }
        
        // Look for common component patterns
        const componentNames = ['App', 'TodoApp', 'Component', 'Main'];
        for (const name of componentNames) {
          if (typeof window !== 'undefined' && window[name]) {
            return window[name];
          }
        }
        
        // If we can't find a named export, try to extract from the code
        const match = code.match(/(?:function|const)\\s+(\\w+)\\s*[=\\(]/);
        if (match && typeof window !== 'undefined' && window[match[1]]) {
          return window[match[1]];
        }
        
        return null;
        `,
      )

      const component = componentFunction(
        React,
        React.useState,
        React.useEffect,
        React.useCallback,
        React.useMemo,
        React.useRef,
      )

      if (component && typeof component === "function") {
        return component as React.ComponentType
      }

      // Fallback: try to create a simple component wrapper
      return () =>
        React.createElement(
          "div",
          {
            style: { padding: "20px", color: "red" },
          },
          "Component compilation failed",
        )
    } catch (error) {
      console.error("Component compilation error:", error)
      return () =>
        React.createElement(
          "div",
          {
            style: { padding: "20px", color: "red" },
          },
          `Compilation error: ${error}`,
        )
    }
  }
}
