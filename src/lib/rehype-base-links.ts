// Markdown pages link to each other as "/donate/" or "/about/". On a project
// Pages site the whole site lives under "/your-repo-name/", so this prefixes
// `base` onto every root-relative link and image at build time. Links that
// already carry the base, protocol-relative links ("//host"), and full URLs are
// left alone.

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

export function rehypeBaseLinks(base: string) {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const fix = (value: unknown) =>
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith(prefix)
      ? prefix + value.slice(1)
      : value;

  const walk = (node: HastNode) => {
    if (node.type === "element" && node.properties) {
      if (node.tagName === "a") node.properties.href = fix(node.properties.href);
      if (node.tagName === "img") node.properties.src = fix(node.properties.src);
    }
    node.children?.forEach(walk);
  };

  return () => (tree: HastNode) => walk(tree);
}
