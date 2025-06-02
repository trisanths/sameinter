// React import regex for cleaning code
const REACT_IMPORT_REGEX =
  /^import\s+(React(?:,\s*\{[^}]+\})?|\{[^}]+\})\s+from\s+['"]react['"];?/gm;

/**
 * Validates if code contains valid React patterns
 */
export function isValidReactCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;

  const reactIndicators = [
    /import.*from\s+['"]react['"]/,
    /export\s+default\s+function/,
    /export\s+default\s+\w+/,
    /function\s+\w+.*\{[\s\S]*return[\s\S]*<\w+/,
    /const\s+\w+\s*=\s*$$[^)]*$$\s*=>\s*{[\s\S]*return[\s\S]*<\w+/,
    /<\w+[^>]*>/,
  ];

  return reactIndicators.some((pattern) => pattern.test(code));
}

/**
 * Cleans and transforms React code for preview execution
 */
export function getPreviewCode(code: string): string {
  if (!code || typeof code !== "string") return "";

  try {
    const matches = Array.from(code.matchAll(REACT_IMPORT_REGEX));
    const namedBindings = new Set<string>();

    // Extract named imports
    for (const match of matches) {
      const imported = match[1];
      if (imported?.includes("{")) {
        const names = imported
          .replace(/React,?/, "")
          .replace(/[{}]/g, "")
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean);

        names.forEach((name) => namedBindings.add(name));
      }
    }

    // Remove import statements
    let transformed = code.replace(REACT_IMPORT_REGEX, "").trim();

    // Replace named imports with React.* syntax
    namedBindings.forEach((name) => {
      const usageRegex = new RegExp(`\\b${name}\\b`, "g");
      transformed = transformed.replace(usageRegex, `React.${name}`);
    });

    // Transform export default to render call
    transformed = transformed.replace(
      /export\s+default\s+([a-zA-Z_$][\w$]*)\s*;?/,
      "render($1);"
    );

    return transformed;
  } catch (error) {
    console.error("Error processing React code:", error);
    return code;
  }
}

/**
 * Sanitizes code to prevent XSS and other security issues
 */
export function sanitizeCode(code: string): string {
  if (!code || typeof code !== "string") return "";

  // Remove potentially dangerous patterns
  const dangerousPatterns = [
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /document\.write/gi,
    /innerHTML/gi,
    /outerHTML/gi,
    /dangerouslySetInnerHTML/gi,
    /javascript:/gi,
    /data:text\/html/gi,
  ];

  let sanitized = code;
  dangerousPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "/* BLOCKED */");
  });

  return sanitized;
}
