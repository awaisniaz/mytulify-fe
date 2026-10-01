import { getToolIcon, isToolAvailable, toolHref, type Tool } from "@/lib/catalog";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Compact crawlable tool links. Names and descriptions stay as text; icons are a sprite reference. */
export function toolDirectoryHtml(
  tools: { tool: Tool; name: string; description: string; soonLabel?: string }[],
  opts?: { categoryAttr?: boolean },
): string {
  return tools
    .map(({ tool, name, description, soonLabel }) => {
      const soon = !isToolAvailable(tool);
      const icon = getToolIcon(tool);
      const cat = opts?.categoryAttr ? ` data-cat="${esc(tool.category ?? "")}"` : "";
      return `<a class="tool-row"${cat} href="${esc(toolHref(tool))}"><svg aria-hidden="true"><use href="/icons.svg#${esc(icon)}"/></svg><span><b>${esc(name)}</b>${soon && soonLabel ? `<em>${esc(soonLabel)}</em>` : ""}<small>${esc(description)}</small></span></a>`;
    })
    .join("");
}
