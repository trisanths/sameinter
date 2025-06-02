/**
 * JSX Transformer
 * A simplified JSX transformer that converts JSX to React.createElement calls
 */

export class JSXTransformer {
  /**
   * Transform JSX code to JavaScript with React.createElement calls
   */
  static transform(code: string): string {
    try {
      let transformed = code.trim();

      // Remove 'use client' directive
      transformed = transformed.replace(/['"]use client['"];?\s*/g, "");

      // Remove import statements
      transformed = transformed.replace(
        /import\s+.*?from\s+['"].*?['"];?\s*/g,
        ""
      );

      // Remove export statements but preserve the component
      transformed = transformed.replace(/export\s+default\s+/g, "");
      transformed = transformed.replace(/export\s+const\s+/g, "const ");
      transformed = transformed.replace(/export\s+function\s+/g, "function ");

      // Remove TypeScript interfaces and types completely
      transformed = transformed.replace(
        /interface\s+\w+\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs,
        ""
      );
      transformed = transformed.replace(/type\s+\w+\s*=\s*[^;]+;?/gs, "");

      // Remove TypeScript type annotations more aggressively
      // Remove type annotations from function parameters
      transformed = transformed.replace(
        /$$\s*\{([^}]*)\}\s*:\s*[^)]+$$/g,
        "({ $1 })"
      );
      transformed = transformed.replace(
        /\(\s*([^:)]+)\s*:\s*[^,)]+([,)])/g,
        "($1$2"
      );

      // Remove return type annotations
      transformed = transformed.replace(/\)\s*:\s*[^{]+\s*\{/g, ") {");

      // Remove variable type annotations
      transformed = transformed.replace(/:\s*React\.FC(<[^>]*>)?/g, "");
      transformed = transformed.replace(/:\s*React\.ReactNode/g, "");
      transformed = transformed.replace(/:\s*\w+Props/g, "");
      transformed = transformed.replace(/:\s*\{[^}]*\}/g, "");
      transformed = transformed.replace(
        /:\s*(string|number|boolean|any)\[\]/g,
        ""
      );
      transformed = transformed.replace(/:\s*(string|number|boolean|any)/g, "");

      // Remove generic type parameters
      transformed = transformed.replace(/<[^>]*>/g, "");

      // Transform JSX to React.createElement
      transformed = JSXTransformer.transformJSXElements(transformed);

      // Handle different component patterns
      if (transformed.includes("function")) {
        const functionMatch = transformed.match(/function\s+(\w+)/);
        if (functionMatch) {
          const componentName = functionMatch[1];
          if (!transformed.includes(`return ${componentName}`)) {
            transformed += `; return ${componentName};`;
          }
        }
      } else if (transformed.includes("const") && transformed.includes("=>")) {
        const constMatch = transformed.match(/const\s+(\w+)\s*=/);
        if (constMatch) {
          const componentName = constMatch[1];
          if (!transformed.includes(`return ${componentName}`)) {
            transformed += `; return ${componentName};`;
          }
        }
      }

      return transformed;
    } catch (error) {
      console.error("Error transforming JSX:", error);
      throw error;
    }
  }

  /**
   * Transform JSX elements to React.createElement calls
   */
  private static transformJSXElements(code: string): string {
    let transformed = code;

    // Extract and preserve JavaScript expressions
    const expressions: string[] = [];
    transformed = transformed.replace(/\{([^{}]+)\}/g, (match, expr) => {
      const placeholder = `__EXPR_${expressions.length}__`;
      expressions.push(expr);
      return placeholder;
    });

    // Handle self-closing tags
    transformed = transformed.replace(
      /<(\w+)([^>]*?)\/>/g,
      (match, tag, attrs) => {
        const props = JSXTransformer.parseAttributes(attrs);
        return `React.createElement('${tag}', ${props})`;
      }
    );

    // Handle component self-closing tags (capitalized)
    transformed = transformed.replace(
      /<([A-Z]\w*)([^>]*?)\/>/g,
      (match, component, attrs) => {
        const props = JSXTransformer.parseAttributes(attrs);
        return `React.createElement(${component}, ${props})`;
      }
    );

    // Handle regular tags with children
    transformed = transformed.replace(
      /<(\w+)([^>]*?)>(.*?)<\/\1>/gs,
      (match, tag, attrs, children) => {
        const props = JSXTransformer.parseAttributes(attrs);
        const processedChildren = JSXTransformer.processChildren(children);
        return `React.createElement('${tag}', ${props}, ${processedChildren})`;
      }
    );

    // Handle component tags with children
    transformed = transformed.replace(
      /<([A-Z]\w*)([^>]*?)>(.*?)<\/\1>/gs,
      (match, component, attrs, children) => {
        const props = JSXTransformer.parseAttributes(attrs);
        const processedChildren = JSXTransformer.processChildren(children);
        return `React.createElement(${component}, ${props}, ${processedChildren})`;
      }
    );

    // Restore expressions
    expressions.forEach((expr, i) => {
      transformed = transformed.replace(`__EXPR_${i}__`, expr);
    });

    return transformed;
  }

  /**
   * Parse JSX attributes into a props object
   */
  private static parseAttributes(attrString: string): string {
    if (!attrString || !attrString.trim()) {
      return "null";
    }

    const props: string[] = [];

    // Handle className
    const classNameMatch = attrString.match(/className=["']([^"']*)["']/);
    if (classNameMatch) {
      props.push(`className: "${classNameMatch[1]}"`);
    }

    // Handle other string attributes
    const stringAttrs = attrString.match(/(\w+)=["']([^"']*)["']/g);
    if (stringAttrs) {
      stringAttrs.forEach((attr) => {
        const [, name, value] = attr.match(/(\w+)=["']([^"']*)["']/) || [];
        if (name && name !== "className") {
          props.push(`${name}: "${value}"`);
        }
      });
    }

    // Handle expression attributes
    const exprAttrs = attrString.match(/(\w+)=\{([^}]+)\}/g);
    if (exprAttrs) {
      exprAttrs.forEach((attr) => {
        const [, name, value] = attr.match(/(\w+)=\{([^}]+)\}/) || [];
        if (name) {
          props.push(`${name}: ${value}`);
        }
      });
    }

    if (props.length === 0) {
      return "null";
    }

    return `{ ${props.join(", ")} }`;
  }

  /**
   * Process JSX children
   */
  private static processChildren(content: string): string {
    if (!content || !content.trim()) return '""';

    // If it's just text
    if (!content.includes("<") && !content.includes("__EXPR_")) {
      return `"${content.trim()}"`;
    }

    // If it contains multiple children, wrap them in an array
    if (
      (content.match(/<\w+/g) || []).length > 1 ||
      content.includes("__EXPR_")
    ) {
      return content;
    }

    return content;
  }
}
