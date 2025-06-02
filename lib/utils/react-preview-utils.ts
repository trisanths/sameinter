const reactImportRegex =
  /^import\s+(React(?:,\s*\{[^}]+\})?|\{[^}]+\})\s+from\s+['"]react['"];?/gm;

export const getPreviewCode = (code: string): string => {
  try {
    const matches = Array.from(code.matchAll(reactImportRegex));
    const namedBindings = new Set<string>();

    // Extract named imports from React
    for (const match of matches) {
      const imported = match[1];

      if (imported.includes("{")) {
        const names = imported
          .replace(/React,?/, "")
          .replace(/[{}]/g, "")
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean);

        names.forEach((n) => namedBindings.add(n));
      }
    }

    // Remove all import statements
    let transformed = code
      .replace(/import\s+.*?from\s+['"].*?['"];?\s*/gs, "")
      .trim();

    // Replace named React imports with React.* syntax
    namedBindings.forEach((name) => {
      const usageRegex = new RegExp(`\\b${name}\\b`, "g");
      transformed = transformed.replace(usageRegex, `React.${name}`);
    });

    // Remove TypeScript type annotations and interfaces
    transformed = transformed.replace(/interface\s+\w+\s*\{[^}]*\}/gs, "");
    transformed = transformed.replace(/type\s+\w+\s*=\s*[^;]+;/gs, "");
    transformed = transformed.replace(/:\s*React\.FC(<[^>]*>)?/g, "");
    transformed = transformed.replace(/:\s*\w+(\[\])?(?=\s*[=,)])/g, "");

    // Handle export default
    if (transformed.includes("export default")) {
      // Replace "export default ComponentName" with "render(<ComponentName />)"
      transformed = transformed.replace(
        /export\s+default\s+([a-zA-Z_$][\w$]*)\s*;?/,
        "render(React.createElement($1));"
      );

      // Handle anonymous export default function
      transformed = transformed.replace(
        /export\s+default\s+function\s+(\w+)/,
        "function $1"
      );

      // If we still have export default, it might be an arrow function
      if (transformed.includes("export default")) {
        transformed = transformed.replace(
          /export\s+default\s+/,
          "const DefaultComponent = "
        );
        transformed += "\nrender(React.createElement(DefaultComponent));";
      }
    } else {
      // Find the first component and render it
      const componentMatch = transformed.match(
        /(?:function\s+(\w+)|const\s+(\w+)\s*=)/
      );
      if (componentMatch) {
        const componentName = componentMatch[1] || componentMatch[2];
        transformed += `\nrender(React.createElement(${componentName}));`;
      }
    }

    return transformed;
  } catch (error) {
    console.error("Error in getPreviewCode:", error);
    return `render(React.createElement('div', { style: { color: 'red', padding: '20px' } }, 'Error transforming code: ${
      error instanceof Error ? error.message : "Unknown error"
    }'));`;
  }
};
