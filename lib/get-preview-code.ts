"use client";

const reactImportRegex =
  /^import\s+(React(?:,\s*\{[^}]+\})?|\{[^}]+\})\s+from\s+['"]react['"];?/gm;

export function getPreviewCode(code: string): string {
  let transformed = code;

  transformed = transformed.replace(
    /import\s+.*?from\s+['"].*?['"];?\s*/gs,
    ""
  );
  transformed = transformed.replace(/interface\s+.*?{[\s\S]*?}/g, "");
  transformed = transformed.replace(/type\s+.*?;/g, "");
  transformed = transformed.replace(/:\s*[A-Za-z0-9_<>[\]]+/g, "");
  transformed = transformed.replace(/<[A-Za-z0-9_<>[\]]+>/g, "");
  transformed = transformed.replace(/useState<[^>]+>/g, "useState");
  transformed = transformed.replace(/useEffect<[^>]+>/g, "useEffect");
  transformed = transformed.replace(/useRef<[^>]+>/g, "useRef");
  transformed = transformed.replace(/useContext<[^>]+>/g, "useContext");
  transformed = transformed.replace(/useReducer<[^>]+>/g, "useReducer");
  transformed = transformed.replace(/useCallback<[^>]+>/g, "useCallback");
  transformed = transformed.replace(/useMemo<[^>]+>/g, "useMemo");
  transformed = transformed.replace(
    /useLayoutEffect<[^>]+>/g,
    "useLayoutEffect"
  );
  transformed = transformed.replace(
    /useImperativeHandle<[^>]+>/g,
    "useImperativeHandle"
  );
  transformed = transformed.replace(/useDebugValue<[^>]+>/g, "useDebugValue");
  transformed = transformed.replace(/useId<[^>]+>/g, "useId");
  transformed = transformed.replace(/useTransition<[^>]+>/g, "useTransition");
  transformed = transformed.replace(
    /useDeferredValue<[^>]+>/g,
    "useDeferredValue"
  );
  transformed = transformed.replace(
    /useSyncExternalStore<[^>]+>/g,
    "useSyncExternalStore"
  );
  transformed = transformed.replace(
    /useInsertionEffect<[^>]+>/g,
    "useInsertionEffect"
  );
  transformed = transformed.replace(/use<[^>]+>/g, "use");
  transformed = transformed.replace(/:\s*[A-Za-z0-9_<>[\]]+/g, "");
  transformed = transformed.replace(/export\s+default\s+/g, "");
  transformed = transformed.replace(/export\s+const\s+/g, "const ");
  transformed = transformed.replace(/export\s+function\s+/g, "function ");
  transformed = transformed.replace(/export\s+class\s+/g, "class ");
  transformed = transformed.replace(/export\s+type\s+.*?;/g, "");
  transformed = transformed.replace(/export\s+interface\s+.*?{[\s\S]*?}/g, "");
  transformed = transformed.replace(/type\s+.*?;/g, "");
  transformed = transformed.replace(/interface\s+.*?{[\s\S]*?}/g, "");
  transformed = transformed.replace(/:\s*[A-Za-z0-9_<>[\]]+/g, "");
  transformed = transformed.replace(/<[A-Za-z0-9_<>[\]]+>/g, "");

  const expressions: string[] = [];
  transformed = transformed.replace(/{([^{}]+)}/g, (match, expr) => {
    const placeholder = `__EXPR${expressions.length}__`;
    expressions.push(expr);
    return placeholder;
  });

  transformed = transformed.replace(
    /<([A-Z][A-Za-z0-9]*)\s*\/>/g,
    (match, tag) => {
      return `React.createElement(${tag})`;
    }
  );

  transformed = transformed.replace(
    /<([A-Z][A-Za-z0-9]*)([^>]*)>/g,
    (match, tag, attrs) => {
      const props = parseAttributes(attrs);
      return `React.createElement(${tag}, ${props})`;
    }
  );

  transformed = transformed.replace(
    /<([a-z][a-z0-9]*)\s*\/>/g,
    (match, tag) => {
      return `React.createElement("${tag}")`;
    }
  );

  transformed = transformed.replace(
    /<([a-z][a-z0-9]*)([^>]*)>/g,
    (match, tag, attrs) => {
      const props = parseAttributes(attrs);
      return `React.createElement("${tag}", ${props})`;
    }
  );

  expressions.forEach((expr, i) => {
    transformed = transformed.replace(`__EXPR${i}__`, expr);
  });

  const componentName =
    transformed.match(/function\s+(\w+)/)?.[1] ||
    transformed.match(/const\s+(\w+)\s*=/)?.[1];
  if (componentName) {
    transformed = `render(<${componentName} />)\n${transformed}`;
  }

  return transformed;
}

function parseAttributes(attrs: string): string {
  if (!attrs.trim()) return "null";

  const props: Record<string, string> = {};
  let i = 0;

  while (i < attrs.length) {
    while (i < attrs.length && /\s/.test(attrs[i])) i++;

    if (i >= attrs.length) break;

    let name = "";
    while (i < attrs.length && !/\s/.test(attrs[i]) && attrs[i] !== "=") {
      name += attrs[i++];
    }

    while (i < attrs.length && /\s/.test(attrs[i])) i++;

    if (i >= attrs.length || attrs[i] !== "=") {
      props[name] = "true";
      continue;
    }

    i++;
    while (i < attrs.length && /\s/.test(attrs[i])) i++;

    if (i >= attrs.length) break;

    let value = "";
    if (attrs[i] === '"') {
      i++;
      while (i < attrs.length && attrs[i] !== '"') {
        value += attrs[i++];
      }
      i++;
    } else if (attrs[i] === "'") {
      i++;
      while (i < attrs.length && attrs[i] !== "'") {
        value += attrs[i++];
      }
      i++;
    } else if (attrs[i] === "{") {
      i++;
      let depth = 1;
      while (i < attrs.length && depth > 0) {
        if (attrs[i] === "{") depth++;
        if (attrs[i] === "}") depth--;
        if (depth > 0) value += attrs[i];
        i++;
      }
    } else {
      while (i < attrs.length && !/\s/.test(attrs[i])) {
        value += attrs[i++];
      }
    }

    props[name] = value;
  }

  return JSON.stringify(props);
}
