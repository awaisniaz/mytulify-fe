/** Google-style robots.txt allow/disallow test (longest match, Allow wins ties). */

export type RobotsRule = { allow: boolean; path: string };
export type RobotsGroup = { agents: string[]; rules: RobotsRule[] };

export type RobotsTest = {
  allowed: boolean;
  agentGroup: string;
  matchedRule: string | null;
  path: string;
};

function stripComment(line: string): string {
  let q = false;
  let out = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') q = !q;
    if (ch === "#" && !q) break;
    out += ch;
  }
  return out.trim();
}

export function parseRobotsGroups(robotsTxt: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = stripComment(raw);
    if (!line) continue;
    const ua = line.match(/^user-agent\s*:\s*(.+)$/i);
    if (ua) {
      const agent = ua[1]!.trim();
      if (!current || current.rules.length > 0) {
        current = { agents: [agent], rules: [] };
        groups.push(current);
      } else {
        current.agents.push(agent);
      }
      continue;
    }
    if (!current) continue;
    const dis = line.match(/^disallow\s*:\s*(.*)$/i);
    if (dis) {
      current.rules.push({ allow: false, path: dis[1]!.trim() });
      continue;
    }
    const all = line.match(/^allow\s*:\s*(.*)$/i);
    if (all) current.rules.push({ allow: true, path: all[1]!.trim() });
  }
  return groups;
}

/** Pattern is a prefix unless it ends with `$`. `*` matches any sequence. */
export function robotsRuleMatches(pattern: string, path: string): boolean {
  if (!pattern) return false;
  const end = pattern.endsWith("$");
  const src = end ? pattern.slice(0, -1) : pattern;
  const body = src
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${end ? "$" : ""}`).test(path);
}

function pickGroup(groups: RobotsGroup[], userAgent: string): RobotsGroup | null {
  const ua = userAgent.trim().toLowerCase();
  let best: { group: RobotsGroup; len: number } | null = null;
  let star: RobotsGroup | null = null;
  for (const group of groups) {
    for (const agent of group.agents) {
      const a = agent.trim().toLowerCase();
      if (a === "*") {
        star = group;
        continue;
      }
      if (!a || !ua.includes(a)) continue;
      if (!best || a.length > best.len) best = { group, len: a.length };
    }
  }
  return best?.group ?? star;
}

export function testRobotsUrl(robotsTxt: string, pageUrl: string, userAgent = "Googlebot"): RobotsTest {
  let path = "/";
  try {
    const u = new URL(pageUrl.includes("://") ? pageUrl : `https://${pageUrl}`);
    path = `${u.pathname}${u.search}` || "/";
  } catch {
    path = pageUrl.startsWith("/") ? pageUrl : `/${pageUrl}`;
  }
  const group = pickGroup(parseRobotsGroups(robotsTxt), userAgent);
  if (!group) return { allowed: true, agentGroup: "(none)", matchedRule: null, path };

  let winner: RobotsRule | null = null;
  for (const rule of group.rules) {
    if (!rule.path) continue;
    if (!robotsRuleMatches(rule.path, path)) continue;
    if (!winner || rule.path.length > winner.path.length) winner = rule;
    else if (rule.path.length === winner.path.length && rule.allow && !winner.allow) winner = rule;
  }
  return {
    allowed: winner ? winner.allow : true,
    agentGroup: group.agents.join(", "),
    matchedRule: winner ? `${winner.allow ? "Allow" : "Disallow"}: ${winner.path}` : null,
    path,
  };
}
