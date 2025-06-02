"use client";

import type * as React from "react";

export class ReactRuntime {
  private static instance: ReactRuntime;
  private modules: Map<string, React.ComponentType> = new Map();
  fileSystem: Record<string, { content: string; language: string }> = {};

  static getInstance(): ReactRuntime {
    if (!ReactRuntime.instance) {
      ReactRuntime.instance = new ReactRuntime();
    }
    return ReactRuntime.instance;
  }

  async setFileSystem(
    files: Record<string, { content: string; language: string }>
  ) {
    this.fileSystem = files;
    this.modules.clear();

    for (const [filePath, fileData] of Object.entries(files)) {
      if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) {
        try {
          const component = await this.compileComponent(
            fileData.content,
            filePath
          );
          if (component) {
            this.modules.set(filePath, component);
          }
        } catch (error) {
          console.error(`Error compiling ${filePath}:`, error);
        }
      }
    }
  }

  private async compileComponent(
    code: string,
    filePath: string
  ): Promise<React.ComponentType | null> {
    try {
      const ReactModule = await import("react");

      const transformed = code
        .trim()
        .replace(/['"]use client['"];?\s*/g, "")
        .replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, "")
        .replace(/export\s+default\s+/g, "")
        .replace(/export\s+(?=const|function|class|let|var)/g, "")
        .replace(/:\s*React\.FC(<[^>]*>)?/g, "")
        .replace(/:\s*\w+Props/g, "")
        .replace(/interface\s+\w+\s*\{[^}]*\}/gs, "")
        .replace(/type\s+\w+\s*=\s*[^;]+;?/gs, "");

      const componentMatch = transformed.match(
        /(?:function\s+(\w+)|const\s+(\w+)\s*=)/
      );
      const componentName =
        componentMatch?.[1] || componentMatch?.[2] || "DefaultComponent";

      let bodyContent = "";
      const arrowBodyMatch = transformed.match(
        /=\s*$$[^)]*$$?\s*=>\s*(\{([\s\S]*)\}|([\s\S]*))/
      );
      const funcBodyMatch = transformed.match(
        /function\s+\w+\s*$$[^)]*$$?\s*(\{[\s\S]*\})/
      );

      if (arrowBodyMatch) {
        bodyContent =
          arrowBodyMatch[2] ||
          `return ${arrowBodyMatch[3]?.trim().replace(/;$/, "")};`;
      } else if (funcBodyMatch) {
        bodyContent = funcBodyMatch[1].slice(1, -1);
      }

      const transformedBody = this.transformJSX(bodyContent);

      const componentFunction = new Function(
        "React",
        "useState",
        "useEffect",
        "useCallback",
        "useMemo",
        "useRef",
        `
        try {
          function ${componentName}() {
            ${transformedBody}
          }
          return ${componentName};
        } catch (error) {
          return function ErrorComponent() {
            return React.createElement('div', {
              style: { padding: '20px', color: 'red', border: '1px solid red', borderRadius: '4px', backgroundColor: '#fee'}
            }, 'Error in ${filePath}: ' + String(error.message || error));
          };
        }
        `
      );

      return componentFunction(
        ReactModule.default || ReactModule,
        ReactModule.useState,
        ReactModule.useEffect,
        ReactModule.useCallback,
        ReactModule.useMemo,
        ReactModule.useRef
      );
    } catch (error: any) {
      console.error(`Error compiling ${filePath}:`, error);
      const ReactModule = await import("react");
      return () =>
        ReactModule.createElement(
          "div",
          {
            style: {
              padding: "20px",
              color: "red",
              border: "1px solid red",
              borderRadius: "4px",
              backgroundColor: "#fee",
            },
          },
          `Compilation Error in ${filePath}: ${error.message}`
        );
    }
  }

  private transformJSX(code: string): string {
    let transformed = code;
    const expressions: string[] = [];

    // Extract expressions
    transformed = transformed.replace(/\{([^{}]+)\}/g, (match, expr) => {
      const placeholder = `__EXPR_${expressions.length}__`;
      expressions.push(expr);
      return placeholder;
    });

    // Transform JSX elements
    for (let i = 0; i < 10; i++) {
      const prevTransformed = transformed;

      // Fragments
      transformed = transformed.replace(/<>(.*?)<\/>/gs, (match, children) => {
        const processedChildren = this.processJSXChildren(
          children.trim(),
          expressions
        );
        return `React.createElement(React.Fragment, null${
          processedChildren ? ", " + processedChildren : ""
        })`;
      });

      // Self-closing tags
      transformed = transformed.replace(
        /<([\w.]+)([^>]*?)\/>/gs,
        (match, tagName, attributes) => {
          const props = this.parseJSXAttributes(attributes.trim());
          const isComponent = /^[A-Z]/.test(tagName) || tagName.includes(".");
          return `React.createElement(${
            isComponent ? tagName : `'${tagName}'`
          }, ${props})`;
        }
      );

      // Tags with children
      transformed = transformed.replace(
        /<([\w.]+)([^>]*?)>([\s\S]*?)<\/\1>/gs,
        (match, tagName, attributes, children) => {
          const props = this.parseJSXAttributes(attributes.trim());
          const isComponent = /^[A-Z]/.test(tagName) || tagName.includes(".");
          const processedChildren = this.processJSXChildren(
            children.trim(),
            expressions
          );
          return `React.createElement(${
            isComponent ? tagName : `'${tagName}'`
          }, ${props}${processedChildren ? ", " + processedChildren : ""})`;
        }
      );

      if (transformed === prevTransformed) break;
    }

    // Restore expressions
    expressions.forEach((expr, i) => {
      transformed = transformed.split(`__EXPR_${i}__`).join(expr);
    });

    return transformed;
  }

  private parseJSXAttributes(attributeString: string): string {
    if (!attributeString.trim()) return "null";

    const props: string[] = [];
    const attrRegex = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|(__EXPR_\d+__)))?/g;
    let match;

    while ((match = attrRegex.exec(attributeString)) !== null) {
      const [, name, doubleQuoted, singleQuoted, expr] = match;
      const propName =
        name === "class" ? "className" : name === "for" ? "htmlFor" : name;

      if (doubleQuoted !== undefined) {
        props.push(`"${propName}": "${doubleQuoted}"`);
      } else if (singleQuoted !== undefined) {
        props.push(`"${propName}": "${singleQuoted}"`);
      } else if (expr !== undefined) {
        props.push(`"${propName}": ${expr}`);
      } else {
        props.push(`"${propName}": true`);
      }
    }

    return props.length > 0 ? `{ ${props.join(", ")} }` : "null";
  }

  private processJSXChildren(children: string, expressions: string[]): string {
    if (!children.trim()) return "";

    const parts = children
      .split(/(__EXPR_\d+__|React\.createElement$$[^)]+$$)/g)
      .filter((part) => part.trim());

    return parts
      .map((part) => {
        const trimmed = part.trim();
        if (
          trimmed.startsWith("__EXPR_") ||
          trimmed.startsWith("React.createElement(")
        ) {
          return trimmed;
        }
        return `"${trimmed.replace(/"/g, '\\"')}"`;
      })
      .join(", ");
  }

  getComponent(filePath: string): React.ComponentType | null {
    return this.modules.get(filePath) || null;
  }

  renderApp(): { component?: React.ComponentType; error?: string } {
    try {
      const PageComponent =
        this.getComponent("app/page.tsx") ||
        this.getComponent("main.tsx") ||
        this.getComponent("main.jsx");

      if (!PageComponent) {
        return { error: "No page component found" };
      }

      return { component: PageComponent };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
