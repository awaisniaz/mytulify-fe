"use client";

import * as React from "react";
import { Input, Select, Textarea, Button } from "@/components/ui/primitives";
import { Field, Output, Notice, Stat, CopyButton } from "@/components/tools/shared";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/* --------------------------------- helpers --------------------------------- */
function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-[var(--brand,#6366f1)]"
      />
      {label}
    </label>
  );
}

const lines = (arr: (string | false | null | undefined)[]) =>
  arr.filter(Boolean).join("\n");

/* ============================ IP Subnet Calculator ========================= */
function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null;
    const v = Number(p);
    if (v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}
const intToIp = (n: number) =>
  [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");

export function SubnetCalculator() {
  const [cidr, setCidr] = React.useState("192.168.1.0/24");

  const result = React.useMemo(() => {
    const m = cidr.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
    if (!m) return { error: "Enter a CIDR block like 192.168.1.0/24" };
    const ip = ipToInt(m[1]);
    const bits = Number(m[2]);
    if (ip === null || bits > 32) return { error: "Invalid IP address or prefix length." };
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    const network = (ip & mask) >>> 0;
    const wildcard = ~mask >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const total = Math.pow(2, 32 - bits);
    const usable = bits >= 31 ? (bits === 32 ? 1 : 2) : total - 2;
    const first = bits >= 31 ? network : network + 1;
    const last = bits >= 31 ? broadcast : broadcast - 1;
    return {
      bits,
      rows: {
        "Network address": intToIp(network),
        "Usable host range": `${intToIp(first)} – ${intToIp(last)}`,
        "Broadcast address": intToIp(broadcast),
        "Subnet mask": intToIp(mask),
        "Wildcard mask": intToIp(wildcard),
        "Total addresses": total.toLocaleString(),
        "Usable hosts": usable.toLocaleString(),
        "CIDR notation": `${intToIp(network)}/${bits}`,
      } as Record<string, string>,
    };
  }, [cidr]);

  return (
    <div className="space-y-5">
      <Field label="CIDR block" hint="e.g. 10.0.0.0/16 or 192.168.1.0/24">
        <Input value={cidr} onChange={(e) => setCidr(e.target.value)} className="font-mono" />
      </Field>

      {"error" in result ? (
        <Notice tone="error">{result.error}</Notice>
      ) : (
        <>
          {/* Visual bit breakdown */}
          <Field label="Bit breakdown" hint="Network bits vs host bits (each cell = 1 bit)">
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 32 }).map((_, i) => (
                <span
                  key={i}
                  title={i < result.bits! ? "network bit" : "host bit"}
                  className={cn(
                    "h-6 w-[calc(3.125%-4px)] min-w-2 rounded-sm",
                    i < result.bits! ? "bg-brand" : "bg-surface-2 border border-border",
                    i % 8 === 7 && i !== 31 && "mr-2",
                  )}
                />
              ))}
            </div>
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(result.rows!).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5"
              >
                <span className="text-sm text-muted">{k}</span>
                <span className="font-mono text-sm font-medium">{v}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================== curl Command Builder ========================== */
export function CurlBuilder() {
  const [method, setMethod] = React.useState("GET");
  const [url, setUrl] = React.useState("https://api.example.com/users");
  const [headers, setHeaders] = React.useState("Content-Type: application/json\nAuthorization: Bearer TOKEN");
  const [body, setBody] = React.useState('{\n  "name": "Ada"\n}');

  const hdrList = React.useMemo(
    () =>
      headers
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.includes(":"))
        .map((l) => {
          const i = l.indexOf(":");
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()] as [string, string];
        }),
    [headers],
  );
  const hasBody = method !== "GET" && method !== "HEAD" && body.trim().length > 0;

  const curl = React.useMemo(() => {
    const parts = [`curl -X ${method} '${url}'`];
    for (const [k, v] of hdrList) parts.push(`  -H '${k}: ${v}'`);
    if (hasBody) parts.push(`  -d '${body.replace(/\n/g, "").trim()}'`);
    return parts.join(" \\\n");
  }, [method, url, hdrList, hasBody, body]);

  const python = React.useMemo(() => {
    const hdrObj = hdrList.map(([k, v]) => `        "${k}": "${v}"`).join(",\n");
    return lines([
      "import requests",
      "",
      `response = requests.request(`,
      `    "${method}",`,
      `    "${url}",`,
      hdrList.length ? `    headers={\n${hdrObj}\n    },` : false,
      hasBody ? `    data=${JSON.stringify(body.replace(/\n/g, "").trim())},` : false,
      ")",
      "print(response.status_code, response.text)",
    ]);
  }, [method, url, hdrList, hasBody, body]);

  const js = React.useMemo(() => {
    const hdrObj = hdrList.map(([k, v]) => `    "${k}": "${v}"`).join(",\n");
    return lines([
      `const response = await fetch("${url}", {`,
      `  method: "${method}",`,
      hdrList.length ? `  headers: {\n${hdrObj}\n  },` : false,
      hasBody ? `  body: ${JSON.stringify(body.replace(/\n/g, "").trim())},` : false,
      "});",
      "const data = await response.json();",
      "console.log(data);",
    ]);
  }, [method, url, hdrList, hasBody, body]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <Field label="Method">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="URL">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono" />
        </Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Headers (one per line, key: value)">
          <Textarea value={headers} onChange={(e) => setHeaders(e.target.value)} rows={5} />
        </Field>
        <Field label="Request body">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
        </Field>
      </div>
      <Field label="curl">
        <Output value={curl} rows={5} />
      </Field>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Python (requests)">
          <Output value={python} rows={9} filename="request.py" />
        </Field>
        <Field label="JavaScript (fetch)">
          <Output value={js} rows={9} filename="request.js" />
        </Field>
      </div>
    </div>
  );
}

/* =========================== Nginx Config Generator ======================== */
export function NginxGenerator() {
  const [tpl, setTpl] = React.useState("reverse-proxy");
  const [domain, setDomain] = React.useState("example.com");
  const [target, setTarget] = React.useState("http://localhost:3000");
  const [root, setRoot] = React.useState("/var/www/example");
  const [upstreams, setUpstreams] = React.useState("10.0.0.1:8080\n10.0.0.2:8080");
  const [ssl, setSsl] = React.useState(false);

  const out = React.useMemo(() => {
    const listen = ssl
      ? lines([
          "    listen 443 ssl;",
          "    listen [::]:443 ssl;",
          `    ssl_certificate     /etc/letsencrypt/live/${domain}/fullchain.pem;`,
          `    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;`,
        ])
      : lines(["    listen 80;", "    listen [::]:80;"]);

    const redirect = ssl
      ? lines([
          "server {",
          "    listen 80;",
          `    server_name ${domain};`,
          "    return 301 https://$host$request_uri;",
          "}",
          "",
        ])
      : "";

    const proxyHeaders = lines([
      "        proxy_set_header Host $host;",
      "        proxy_set_header X-Real-IP $remote_addr;",
      "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
      "        proxy_set_header X-Forwarded-Proto $scheme;",
    ]);

    if (tpl === "static-site") {
      return lines([
        "server {",
        listen,
        `    server_name ${domain};`,
        `    root ${root};`,
        "    index index.html;",
        "",
        "    location / {",
        "        try_files $uri $uri/ /index.html;",
        "    }",
        "}",
      ]);
    }
    if (tpl === "load-balancer") {
      const servers = upstreams
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => `    server ${s};`)
        .join("\n");
      return lines([
        "upstream backend {",
        "    least_conn;",
        servers,
        "}",
        "",
        redirect + "server {",
        listen,
        `    server_name ${domain};`,
        "",
        "    location / {",
        "        proxy_pass http://backend;",
        proxyHeaders,
        "    }",
        "}",
      ]);
    }
    // reverse-proxy (also covers ssl-termination)
    return lines([
      redirect + "server {",
      listen,
      `    server_name ${domain};`,
      "",
      "    location / {",
      `        proxy_pass ${target};`,
      proxyHeaders,
      "    }",
      "}",
    ]);
  }, [tpl, domain, target, root, upstreams, ssl]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Template">
          <Select value={tpl} onChange={(e) => setTpl(e.target.value)}>
            <option value="reverse-proxy">Reverse proxy</option>
            <option value="static-site">Static site</option>
            <option value="load-balancer">Load balancer</option>
          </Select>
        </Field>
        <Field label="Server name (domain)">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} className="font-mono" />
        </Field>
      </div>
      {tpl === "reverse-proxy" && (
        <Field label="Proxy target (proxy_pass)">
          <Input value={target} onChange={(e) => setTarget(e.target.value)} className="font-mono" />
        </Field>
      )}
      {tpl === "static-site" && (
        <Field label="Root directory">
          <Input value={root} onChange={(e) => setRoot(e.target.value)} className="font-mono" />
        </Field>
      )}
      {tpl === "load-balancer" && (
        <Field label="Upstream servers (one host:port per line)">
          <Textarea value={upstreams} onChange={(e) => setUpstreams(e.target.value)} rows={4} />
        </Field>
      )}
      <Check label="Enable SSL (HTTPS + HTTP→HTTPS redirect)" checked={ssl} onChange={setSsl} />
      <Field label="nginx.conf">
        <Output value={out} rows={16} filename={`${domain}.conf`} />
      </Field>
    </div>
  );
}

/* ========================= Kubernetes YAML Generator ======================= */
export function KubernetesGenerator() {
  const [name, setName] = React.useState("my-app");
  const [image, setImage] = React.useState("nginx:1.27");
  const [port, setPort] = React.useState("80");
  const [replicas, setReplicas] = React.useState("2");
  const [svcType, setSvcType] = React.useState("ClusterIP");
  const [ingress, setIngress] = React.useState(false);
  const [host, setHost] = React.useState("app.example.com");

  const out = React.useMemo(() => {
    const deployment = lines([
      "apiVersion: apps/v1",
      "kind: Deployment",
      "metadata:",
      `  name: ${name}`,
      `  labels:`,
      `    app: ${name}`,
      "spec:",
      `  replicas: ${replicas || "1"}`,
      "  selector:",
      "    matchLabels:",
      `      app: ${name}`,
      "  template:",
      "    metadata:",
      "      labels:",
      `        app: ${name}`,
      "    spec:",
      "      containers:",
      `        - name: ${name}`,
      `          image: ${image}`,
      "          ports:",
      `            - containerPort: ${port || "80"}`,
    ]);
    const service = lines([
      "apiVersion: v1",
      "kind: Service",
      "metadata:",
      `  name: ${name}`,
      "spec:",
      `  type: ${svcType}`,
      "  selector:",
      `    app: ${name}`,
      "  ports:",
      "    - protocol: TCP",
      "      port: 80",
      `      targetPort: ${port || "80"}`,
    ]);
    const ing = ingress
      ? lines([
          "apiVersion: networking.k8s.io/v1",
          "kind: Ingress",
          "metadata:",
          `  name: ${name}`,
          "  annotations:",
          "    nginx.ingress.kubernetes.io/rewrite-target: /",
          "spec:",
          "  rules:",
          `    - host: ${host}`,
          "      http:",
          "        paths:",
          "          - path: /",
          "            pathType: Prefix",
          "            backend:",
          "              service:",
          `                name: ${name}`,
          "                port:",
          "                  number: 80",
        ])
      : "";
    return [deployment, service, ing].filter(Boolean).join("\n---\n");
  }, [name, image, port, replicas, svcType, ingress, host]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="App name">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Container image">
          <Input value={image} onChange={(e) => setImage(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Container port">
          <Input value={port} onChange={(e) => setPort(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Replicas">
          <Input value={replicas} onChange={(e) => setReplicas(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Service type">
          <Select value={svcType} onChange={(e) => setSvcType(e.target.value)}>
            {["ClusterIP", "NodePort", "LoadBalancer"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Check label="Add an Ingress" checked={ingress} onChange={setIngress} />
      {ingress && (
        <Field label="Ingress host">
          <Input value={host} onChange={(e) => setHost(e.target.value)} className="font-mono" />
        </Field>
      )}
      <Field label={`Manifest (${ingress ? "Deployment + Service + Ingress" : "Deployment + Service"})`}>
        <Output value={out} rows={18} filename={`${name}.yaml`} />
      </Field>
    </div>
  );
}

/* ======================= GitHub Actions YAML Generator ===================== */
export function GithubActionsGenerator() {
  const [tpl, setTpl] = React.useState("node");
  const [version, setVersion] = React.useState("20");
  const [branch, setBranch] = React.useState("main");

  const out = React.useMemo(() => {
    const head = lines([
      `name: CI`,
      "on:",
      "  push:",
      `    branches: [${branch}]`,
      "  pull_request:",
      `    branches: [${branch}]`,
      "",
      "jobs:",
      "  build:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - uses: actions/checkout@v4",
    ]);
    if (tpl === "python") {
      return lines([
        head,
        "      - uses: actions/setup-python@v5",
        "        with:",
        `          python-version: '${version}'`,
        "      - run: pip install -r requirements.txt",
        "      - run: pytest",
      ]);
    }
    if (tpl === "docker") {
      return lines([
        head,
        "      - uses: docker/setup-buildx-action@v3",
        "      - name: Build image",
        "        run: docker build -t my-app:${{ github.sha }} .",
      ]);
    }
    return lines([
      head,
      "      - uses: actions/setup-node@v4",
      "        with:",
      `          node-version: '${version}'`,
      "          cache: 'npm'",
      "      - run: npm ci",
      "      - run: npm run build --if-present",
      "      - run: npm test",
    ]);
  }, [tpl, version, branch]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Template">
          <Select value={tpl} onChange={(e) => setTpl(e.target.value)}>
            <option value="node">Node.js</option>
            <option value="python">Python</option>
            <option value="docker">Docker build</option>
          </Select>
        </Field>
        {tpl !== "docker" && (
          <Field label={tpl === "python" ? "Python version" : "Node version"}>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} className="font-mono" />
          </Field>
        )}
        <Field label="Branch">
          <Input value={branch} onChange={(e) => setBranch(e.target.value)} className="font-mono" />
        </Field>
      </div>
      <Field label=".github/workflows/ci.yml">
        <Output value={out} rows={16} filename="ci.yml" />
      </Field>
    </div>
  );
}

/* ============================ robots.txt Generator ========================= */
export function RobotsGenerator() {
  const [policy, setPolicy] = React.useState("allow-all");
  const [agent, setAgent] = React.useState("*");
  const [disallow, setDisallow] = React.useState("/admin/\n/private/");
  const [sitemap, setSitemap] = React.useState("https://example.com/sitemap.xml");
  const [delay, setDelay] = React.useState("");

  const { out, notes } = React.useMemo(() => {
    const rows = [`User-agent: ${agent || "*"}`];
    if (policy === "disallow-all") rows.push("Disallow: /");
    else if (policy === "allow-all") rows.push("Disallow:");
    else {
      const paths = disallow.split("\n").map((p) => p.trim()).filter(Boolean);
      if (paths.length) paths.forEach((p) => rows.push(`Disallow: ${p}`));
      else rows.push("Disallow:");
    }
    if (delay.trim()) rows.push(`Crawl-delay: ${delay.trim()}`);
    if (sitemap.trim()) {
      rows.push("");
      rows.push(`Sitemap: ${sitemap.trim()}`);
    }
    const warnings: string[] = [];
    if (policy === "disallow-all" && sitemap.trim())
      warnings.push("You're blocking all crawlers but still advertising a sitemap — crawlers won't fetch it.");
    if (sitemap.trim() && !/^https?:\/\//.test(sitemap.trim()))
      warnings.push("Sitemap should be an absolute URL (starting with http:// or https://).");
    if (delay.trim() && !/^\d+$/.test(delay.trim()))
      warnings.push("Crawl-delay should be a whole number of seconds.");
    return { out: rows.join("\n"), notes: warnings };
  }, [policy, agent, disallow, sitemap, delay]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Policy">
          <Select value={policy} onChange={(e) => setPolicy(e.target.value)}>
            <option value="allow-all">Allow all</option>
            <option value="disallow-all">Disallow all</option>
            <option value="custom">Custom rules</option>
          </Select>
        </Field>
        <Field label="User-agent">
          <Input value={agent} onChange={(e) => setAgent(e.target.value)} className="font-mono" />
        </Field>
      </div>
      {policy === "custom" && (
        <Field label="Disallow paths (one per line)">
          <Textarea value={disallow} onChange={(e) => setDisallow(e.target.value)} rows={4} />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sitemap URL">
          <Input value={sitemap} onChange={(e) => setSitemap(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Crawl-delay (seconds, optional)">
          <Input value={delay} onChange={(e) => setDelay(e.target.value)} className="font-mono" />
        </Field>
      </div>
      {notes.map((n, i) => (
        <Notice key={i} tone="error">
          {n}
        </Notice>
      ))}
      <Field label="robots.txt">
        <Output value={out} rows={9} filename="robots.txt" />
      </Field>
    </div>
  );
}

/* =============================== .env Validator ============================ */
type EnvFinding = { line: number; tone: "error" | "success"; msg: string };
const SECRET_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /sk-[A-Za-z0-9]{16,}/, label: "OpenAI-style secret key" },
  { re: /AKIA[0-9A-Z]{16}/, label: "AWS access key ID" },
  { re: /ghp_[A-Za-z0-9]{36}/, label: "GitHub personal access token" },
  { re: /AIza[0-9A-Za-z_\-]{35}/, label: "Google API key" },
  { re: /xox[baprs]-[A-Za-z0-9-]{10,}/, label: "Slack token" },
];

export function EnvValidator() {
  const [text, setText] = React.useState(
    'PORT=3000\nDATABASE_URL = postgres://localhost/db\nAPI_KEY=sk-abcdef0123456789abcdef\nDEBUG=true\nPORT=8080',
  );

  const { findings, valid, secrets } = React.useMemo(() => {
    const seen = new Map<string, number>();
    const out: EnvFinding[] = [];
    let ok = 0;
    let sec = 0;
    text.split("\n").forEach((raw, i) => {
      const ln = i + 1;
      const line = raw.trim();
      if (!line || line.startsWith("#")) return;
      if (!line.includes("=")) {
        out.push({ line: ln, tone: "error", msg: `Line ${ln}: missing "=" — not a valid assignment.` });
        return;
      }
      const key = line.slice(0, line.indexOf("=")).trim();
      const value = line.slice(line.indexOf("=") + 1).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        out.push({ line: ln, tone: "error", msg: `Line ${ln}: "${key}" is not a valid key name.` });
        return;
      }
      if (/\s=\s|\s=|=\s/.test(raw.slice(raw.indexOf(key)))) {
        out.push({ line: ln, tone: "error", msg: `Line ${ln}: spaces around "=" — most parsers keep them; remove for safety.` });
      }
      if (seen.has(key)) {
        out.push({ line: ln, tone: "error", msg: `Line ${ln}: duplicate key "${key}" (first set on line ${seen.get(key)}).` });
      } else {
        seen.set(key, ln);
      }
      // secret detection
      const clean = value.replace(/^['"]|['"]$/g, "");
      const hit = SECRET_PATTERNS.find((p) => p.re.test(clean));
      const nameLooksSecret = /(SECRET|PASSWORD|TOKEN|PRIVATE|API[_-]?KEY)/i.test(key);
      if (hit) {
        sec++;
        out.push({ line: ln, tone: "error", msg: `Line ${ln}: looks like a ${hit.label} — do not commit this.` });
      } else if (nameLooksSecret && clean.length >= 8) {
        sec++;
        out.push({ line: ln, tone: "error", msg: `Line ${ln}: "${key}" holds a possible secret — keep it out of version control.` });
      }
      ok++;
    });
    return { findings: out, valid: ok, secrets: sec };
  }, [text]);

  return (
    <div className="space-y-5">
      <Field label="Paste your .env file">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Valid keys" value={valid} />
        <Stat label="Issues" value={findings.length} />
        <Stat label="Possible secrets" value={secrets} />
      </div>
      {findings.length === 0 ? (
        <Notice tone="success">No issues found — syntax looks valid and no obvious secrets detected.</Notice>
      ) : (
        <div className="space-y-2">
          {findings.map((f, i) => (
            <Notice key={i} tone="error">
              {f.msg}
            </Notice>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== Crontab Builder =========================== */
function parseCronField(spec: string, min: number, max: number): Set<number> | null {
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const m = part.match(/^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/);
    if (!m) return null;
    let lo: number, hi: number;
    if (m[1] === "*") {
      lo = min;
      hi = max;
    } else {
      lo = Number(m[1]);
      hi = m[2] !== undefined ? Number(m[2]) : lo;
    }
    const step = m[3] !== undefined ? Number(m[3]) : 1;
    if (step < 1 || lo < min || hi > max || lo > hi) return null;
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out.size ? out : null;
}

export function CrontabBuilder() {
  const [expr, setExpr] = React.useState("30 9 * * 1-5");

  const { valid, error, runs, human } = React.useMemo(() => {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5)
      return { valid: false, error: "A cron expression has exactly 5 fields: minute hour day month weekday." };
    const mins = parseCronField(parts[0], 0, 59);
    const hours = parseCronField(parts[1], 0, 23);
    const doms = parseCronField(parts[2], 1, 31);
    const months = parseCronField(parts[3], 1, 12);
    const dowsRaw = parseCronField(parts[4], 0, 7);
    if (!mins || !hours || !doms || !months || !dowsRaw) {
      const names = ["minute", "hour", "day-of-month", "month", "day-of-week"];
      const bad = [mins, hours, doms, months, dowsRaw].findIndex((s) => !s);
      return { valid: false, error: `Invalid ${names[bad]} field: "${parts[bad]}".` };
    }
    const dows = new Set([...dowsRaw].map((d) => (d === 7 ? 0 : d)));
    const domRestricted = parts[2] !== "*";
    const dowRestricted = parts[4] !== "*";

    const matches = (d: Date) => {
      const domOk = doms.has(d.getDate());
      const dowOk = dows.has(d.getDay());
      const dayOk =
        domRestricted && dowRestricted ? domOk || dowOk : domOk && dowOk;
      return mins.has(d.getMinutes()) && hours.has(d.getHours()) && months.has(d.getMonth() + 1) && dayOk;
    };

    // Iterate minute-by-minute from the next minute (bounded to ~1 year).
    const found: string[] = [];
    const d = new Date();
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);
    const fmt = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    for (let i = 0; i < 366 * 24 * 60 && found.length < 5; i++) {
      if (matches(d)) found.push(fmt.format(d));
      d.setMinutes(d.getMinutes() + 1);
    }
    return { valid: true, error: "", runs: found, human: "" };
  }, [expr]);

  return (
    <div className="space-y-5">
      <Field label="Cron expression" hint="Format: minute hour day-of-month month day-of-week">
        <Input value={expr} onChange={(e) => setExpr(e.target.value)} className="font-mono" />
      </Field>
      <div className="flex flex-wrap gap-2">
        {[
          ["Every minute", "* * * * *"],
          ["Hourly", "0 * * * *"],
          ["Daily 9am", "0 9 * * *"],
          ["Weekdays 9:30am", "30 9 * * 1-5"],
          ["Every 15 min", "*/15 * * * *"],
          ["1st of month", "0 0 1 * *"],
        ].map(([label, val]) => (
          <button
            key={val}
            type="button"
            onClick={() => setExpr(val)}
            className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-muted transition hover:border-brand/40 hover:text-foreground"
          >
            {label}
          </button>
        ))}
      </div>
      {!valid ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <Field label="Next 5 run times (your local timezone)">
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            {runs && runs.length ? (
              <ul className="space-y-1.5 font-mono text-sm">
                {runs.map((r, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Icon name="ChevronRight" className="h-3.5 w-3.5 text-brand" />
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No upcoming runs within the next year.</p>
            )}
          </div>
        </Field>
      )}
    </div>
  );
}

/* ========================= Backup Script Generator ======================== */
export function BackupScriptGenerator() {
  const [db, setDb] = React.useState("postgres");
  const [name, setName] = React.useState("mydb");
  const [host, setHost] = React.useState("localhost");
  const [user, setUser] = React.useState("dbuser");
  const [dir, setDir] = React.useState("/var/backups");
  const [s3, setS3] = React.useState(false);
  const [bucket, setBucket] = React.useState("my-backups");

  const out = React.useMemo(() => {
    const dump =
      db === "mysql"
        ? `mysqldump -h ${host} -u ${user} -p ${name} > "$FILE"`
        : db === "mongodb"
        ? `mongodump --host ${host} --db ${name} --archive="$FILE" --gzip`
        : `pg_dump -h ${host} -U ${user} ${name} > "$FILE"`;
    const ext = db === "mongodb" ? "archive.gz" : "sql";
    return lines([
      "#!/usr/bin/env bash",
      "set -euo pipefail",
      "",
      `DIR="${dir}"`,
      'STAMP=$(date +%F_%H-%M-%S)',
      `FILE="$DIR/${name}_$STAMP.${ext}"`,
      'mkdir -p "$DIR"',
      "",
      dump,
      'echo "Backup written to $FILE"',
      s3 ? "" : false,
      s3 ? `aws s3 cp "$FILE" "s3://${bucket}/${name}/"` : false,
      s3 ? 'echo "Uploaded to S3"' : false,
      "",
      "# Delete local backups older than 7 days",
      'find "$DIR" -name "' + name + '_*" -mtime +7 -delete',
    ]);
  }, [db, name, host, user, dir, s3, bucket]);

  const cron = `0 2 * * *  /usr/local/bin/backup-${name}.sh  >> /var/log/backup-${name}.log 2>&1`;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Database">
          <Select value={db} onChange={(e) => setDb(e.target.value)}>
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="mongodb">MongoDB</option>
          </Select>
        </Field>
        <Field label="Database name">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Host">
          <Input value={host} onChange={(e) => setHost(e.target.value)} className="font-mono" />
        </Field>
        {db !== "mongodb" && (
          <Field label="User">
            <Input value={user} onChange={(e) => setUser(e.target.value)} className="font-mono" />
          </Field>
        )}
        <Field label="Backup directory">
          <Input value={dir} onChange={(e) => setDir(e.target.value)} className="font-mono" />
        </Field>
      </div>
      <Check label="Add upload to Amazon S3" checked={s3} onChange={setS3} />
      {s3 && (
        <Field label="S3 bucket">
          <Input value={bucket} onChange={(e) => setBucket(e.target.value)} className="font-mono" />
        </Field>
      )}
      <Field label={`backup-${name}.sh`}>
        <Output value={out} rows={16} filename={`backup-${name}.sh`} />
      </Field>
      <Field label="Cron entry (runs daily at 02:00)">
        <Output value={cron} rows={2} />
      </Field>
    </div>
  );
}

/* ====================== Health Check Config Generator ===================== */
export function HealthCheckGenerator() {
  const [url, setUrl] = React.useState("https://api.example.com/health");
  const [interval, setInterval] = React.useState("60");
  const [method, setMethod] = React.useState("GET");
  const [status, setStatus] = React.useState("200");

  const script = React.useMemo(
    () =>
      lines([
        "#!/usr/bin/env bash",
        "# Simple uptime check — exits non-zero when unhealthy.",
        `URL="${url}"`,
        `EXPECTED=${status}`,
        `CODE=$(curl -s -o /dev/null -w "%{http_code}" -X ${method} --max-time 10 "$URL")`,
        'if [ "$CODE" != "$EXPECTED" ]; then',
        '  echo "UNHEALTHY: got $CODE, expected $EXPECTED"',
        "  exit 1",
        "fi",
        'echo "OK ($CODE)"',
      ]),
    [url, method, status],
  );

  const json = React.useMemo(
    () =>
      JSON.stringify(
        {
          name: "endpoint-health",
          type: "http",
          url,
          method,
          interval_seconds: Number(interval) || 60,
          expected_status: Number(status) || 200,
          timeout_seconds: 10,
          retries: 3,
        },
        null,
        2,
      ),
    [url, method, interval, status],
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Endpoint URL">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Method">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            {["GET", "HEAD", "POST"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="Check interval (seconds)">
          <Input value={interval} onChange={(e) => setInterval(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Expected status code">
          <Input value={status} onChange={(e) => setStatus(e.target.value)} className="font-mono" />
        </Field>
      </div>
      <Field label="Health-check script (cron / systemd timer)">
        <Output value={script} rows={11} filename="healthcheck.sh" />
      </Field>
      <Field label="JSON config (uptime monitors)">
        <Output value={json} rows={11} filename="healthcheck.json" />
      </Field>
    </div>
  );
}

/* ======================= Subnet Overlap Visualizer ======================= */
type Range = { label: string; start: number; end: number };

function parseRangeLine(line: string): Range | null {
  const t = line.trim();
  if (!t) return null;
  const cidr = t.match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
  if (cidr) {
    const ip = ipToInt(cidr[1]);
    const bits = Number(cidr[2]);
    if (ip === null || bits > 32) return null;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    const start = (ip & mask) >>> 0;
    const end = (start + (~mask >>> 0)) >>> 0;
    return { label: t, start, end };
  }
  const range = t.match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*-\s*(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (range) {
    const a = ipToInt(range[1]);
    const b = ipToInt(range[2]);
    if (a === null || b === null) return null;
    return { label: t, start: Math.min(a, b), end: Math.max(a, b) };
  }
  const single = ipToInt(t);
  if (single !== null) return { label: t, start: single, end: single };
  return null;
}

export function SubnetOverlapVisualizer() {
  const [text, setText] = React.useState("10.0.0.0/24\n10.0.0.128/25\n10.0.2.0/24\n192.168.1.0/24");

  const { ranges, bad, overlaps, span, min } = React.useMemo(() => {
    const ranges: Range[] = [];
    const bad: string[] = [];
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      const r = parseRangeLine(line);
      if (r) ranges.push(r);
      else bad.push(line.trim());
    }
    const overlaps: [number, number][] = [];
    for (let i = 0; i < ranges.length; i++)
      for (let j = i + 1; j < ranges.length; j++)
        if (ranges[i].start <= ranges[j].end && ranges[j].start <= ranges[i].end) overlaps.push([i, j]);
    const min = ranges.length ? Math.min(...ranges.map((r) => r.start)) : 0;
    const max = ranges.length ? Math.max(...ranges.map((r) => r.end)) : 1;
    const span = Math.max(1, max - min + 1);
    return { ranges, bad, overlaps, span, min };
  }, [text]);

  const overlapping = new Set(overlaps.flat());

  return (
    <div className="space-y-5">
      <Field label="IP ranges" hint="One per line — CIDR (10.0.0.0/24), a range (10.0.0.1 - 10.0.0.50) or a single IP.">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} />
      </Field>
      {bad.length > 0 && <Notice tone="error">Couldn&apos;t parse: {bad.join(", ")}</Notice>}
      {ranges.length > 0 && (
        <>
          <Notice tone={overlaps.length ? "error" : "success"}>
            {overlaps.length
              ? `${overlaps.length} overlapping pair${overlaps.length === 1 ? "" : "s"} detected.`
              : "No overlaps — all ranges are disjoint."}
          </Notice>
          {/* coverage map */}
          <Field label="Coverage map">
            <div className="space-y-1.5">
              {ranges.map((r, i) => {
                const left = ((r.start - min) / span) * 100;
                const width = Math.max(0.5, ((r.end - r.start + 1) / span) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <code className="w-40 shrink-0 truncate font-mono text-xs text-muted">{r.label}</code>
                    <div className="relative h-5 flex-1 rounded bg-surface-2">
                      <span
                        className={cn(
                          "absolute top-0 h-full rounded",
                          overlapping.has(i) ? "bg-rose-500/70" : "bg-brand/70",
                        )}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Field>
          {overlaps.length > 0 && (
            <Field label="Overlapping pairs">
              <div className="space-y-1.5">
                {overlaps.map(([a, b], i) => (
                  <div key={i} className="rounded-lg bg-rose-500/10 px-3 py-2 font-mono text-sm text-rose-500">
                    {ranges[a].label} ↔ {ranges[b].label}
                  </div>
                ))}
              </div>
            </Field>
          )}
        </>
      )}
    </div>
  );
}

/* ======================= IP Address Info & Classifier ==================== */
function classifyIp(ip: number): { kind: string; tone: "success" | "error"; note: string } {
  const oct = [(ip >>> 24) & 255, (ip >>> 16) & 255, (ip >>> 8) & 255, ip & 255];
  const inR = (a: number, bits: number, base: number[]) => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    const b = ((base[0] << 24) | (base[1] << 16) | (base[2] << 8) | base[3]) >>> 0;
    return (a & mask) >>> 0 === (b & mask) >>> 0;
  };
  if (inR(ip, 8, [127, 0, 0, 0]))
    return { kind: "Loopback", tone: "success", note: "Refers to this device itself (localhost). Never routed on a network." };
  if (inR(ip, 8, [10, 0, 0, 0]) || inR(ip, 12, [172, 16, 0, 0]) || inR(ip, 16, [192, 168, 0, 0]))
    return { kind: "Private (RFC 1918)", tone: "success", note: "A private LAN address — normal for internal devices and logins from the same network. Not reachable from the internet." };
  if (inR(ip, 10, [100, 64, 0, 0]))
    return { kind: "Carrier-grade NAT", tone: "success", note: "Shared ISP address space (CGNAT). Common on mobile networks — many users share it, so it's a weak identifier." };
  if (inR(ip, 16, [169, 254, 0, 0]))
    return { kind: "Link-local (APIPA)", tone: "error", note: "Self-assigned because DHCP failed — usually indicates a network configuration problem." };
  if (inR(ip, 24, [192, 0, 2, 0]) || inR(ip, 24, [198, 51, 100, 0]) || inR(ip, 24, [203, 0, 113, 0]))
    return { kind: "Documentation", tone: "error", note: "Reserved for examples/docs (TEST-NET). Should never appear in real traffic — treat as suspicious or a placeholder." };
  if (oct[0] >= 224 && oct[0] <= 239)
    return { kind: "Multicast", tone: "success", note: "A multicast group address, not a single host." };
  if (oct[0] >= 240)
    return { kind: "Reserved", tone: "error", note: "Reserved/experimental range — shouldn't appear as a normal source address." };
  if (ip === 0xffffffff) return { kind: "Broadcast", tone: "success", note: "The limited broadcast address." };
  return { kind: "Public", tone: "success", note: "A routable internet address. To see who owns it (ASN) or where it's located, run it through an external IP/geo lookup — that data can't be derived offline." };
}

export function IpAddressInfo() {
  const [value, setValue] = React.useState("192.168.1.42");

  const info = React.useMemo(() => {
    const t = value.trim();
    if (t.includes(":")) {
      const ok = /^[0-9a-fA-F:]+$/.test(t) && (t.match(/:/g) || []).length >= 2;
      return { v6: true, ok };
    }
    const ip = ipToInt(t);
    if (ip === null) return { v6: false, ok: false };
    const oct = [(ip >>> 24) & 255, (ip >>> 16) & 255, (ip >>> 8) & 255, ip & 255];
    const cls = classifyIp(ip);
    const bin = oct.map((o) => o.toString(2).padStart(8, "0")).join(".");
    const ipClass = oct[0] < 128 ? "A" : oct[0] < 192 ? "B" : oct[0] < 224 ? "C" : oct[0] < 240 ? "D (multicast)" : "E (reserved)";
    return {
      v6: false,
      ok: true,
      cls,
      rows: {
        Classification: cls.kind,
        "Class (legacy)": ipClass,
        Integer: (ip >>> 0).toString(),
        Hexadecimal: "0x" + (ip >>> 0).toString(16).toUpperCase().padStart(8, "0"),
        Binary: bin,
        "Reverse DNS": `${oct[3]}.${oct[2]}.${oct[1]}.${oct[0]}.in-addr.arpa`,
      } as Record<string, string>,
    };
  }, [value]);

  return (
    <div className="space-y-5">
      <Field label="IP address" hint="IPv4 (full detail) or IPv6 (basic validation).">
        <Input value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" />
      </Field>
      {info.v6 ? (
        <Notice tone={info.ok ? "info" : "error"}>
          {info.ok ? "Looks like a valid IPv6 address. Detailed IPv6 classification is coming soon." : "That doesn't look like a valid IPv6 address."}
        </Notice>
      ) : !info.ok ? (
        <Notice tone="error">Enter a valid IPv4 address like 192.168.1.42.</Notice>
      ) : (
        <>
          <Notice tone={info.cls!.tone}>{info.cls!.note}</Notice>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(info.rows!).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5">
                <span className="text-sm text-muted">{k}</span>
                <span className="font-mono text-sm font-medium">{v}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ==================== Systemd Timer Explainer & Builder ================== */
const SYSTEMD_SHORTCUTS: Record<string, string> = {
  minutely: "*-*-* *:*:00",
  hourly: "*-*-* *:00:00",
  daily: "*-*-* 00:00:00",
  monthly: "*-*-01 00:00:00",
  weekly: "Mon *-*-* 00:00:00",
  yearly: "*-01-01 00:00:00",
  annually: "*-01-01 00:00:00",
  quarterly: "*-01,04,07,10-01 00:00:00",
};
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_MAP: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

function expandField(spec: string, min: number, max: number): Set<number> | null {
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const m = part.match(/^(\*|\d+)(?:\.\.(\d+))?(?:\/(\d+))?$/);
    if (!m) return null;
    const lo = m[1] === "*" ? min : Number(m[1]);
    const hi = m[2] !== undefined ? Number(m[2]) : m[1] === "*" ? max : lo;
    const step = m[3] !== undefined ? Number(m[3]) : 1;
    if (step < 1 || lo < min || hi > max || lo > hi) return null;
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out.size ? out : null;
}

function parseDow(spec: string): Set<number> | null {
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const range = part.split("..");
    const a = DOW_MAP[range[0].toLowerCase().slice(0, 3)];
    if (a === undefined) return null;
    if (range.length === 1) out.add(a);
    else {
      const b = DOW_MAP[range[1].toLowerCase().slice(0, 3)];
      if (b === undefined) return null;
      for (let d = a; ; d = (d + 1) % 7) {
        out.add(d);
        if (d === b) break;
      }
    }
  }
  return out.size ? out : null;
}

function parseSystemd(input: string) {
  let spec = input.trim();
  const lower = spec.toLowerCase();
  if (SYSTEMD_SHORTCUTS[lower]) spec = SYSTEMD_SHORTCUTS[lower];

  // optional leading weekday(s)
  let dow: Set<number> | null = null;
  const parts = spec.split(/\s+/);
  if (parts.length && /[A-Za-z]/.test(parts[0])) {
    dow = parseDow(parts.shift()!);
    if (!dow) return { error: "Invalid day-of-week." };
  }
  if (parts.length !== 2) return { error: "Expected the form: [DOW] YYYY-MM-DD HH:MM:SS" };
  const [datePart, timePart] = parts;
  const d = datePart.split("-");
  const tm = timePart.split(":");
  if (d.length !== 3 || tm.length < 2) return { error: "Expected date as Y-M-D and time as H:M[:S]." };

  const months = expandField(d[1], 1, 12);
  const days = expandField(d[2], 1, 31);
  const hours = expandField(tm[0], 0, 23);
  const minutes = expandField(tm[1], 0, 59);
  if (!months || !days || !hours || !minutes) return { error: "Invalid number in the date or time." };

  const desc: string[] = [];
  desc.push(dow ? `On ${[...dow].sort().map((n) => DOW[n]).join(", ")}` : "On any day of the week");
  desc.push(d[1] === "*" ? "in every month" : `in month ${d[1]}`);
  desc.push(d[2] === "*" ? "on every day of the month" : `on day ${d[2]}`);
  desc.push(`at ${tm[0] === "*" ? "every hour" : `hour ${tm[0]}`}, ${tm[1] === "*" ? "every minute" : `minute ${tm[1]}`}`);

  // next runs — iterate day by day, then times
  const runs: string[] = [];
  const now = new Date();
  const fmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const sortedH = [...hours].sort((a, b) => a - b);
  const sortedM = [...minutes].sort((a, b) => a - b);
  for (let dayOffset = 0; dayOffset < 1500 && runs.length < 5; dayOffset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + dayOffset);
    if (dow && !dow.has(day.getDay())) continue;
    if (!months.has(day.getMonth() + 1)) continue;
    if (!days.has(day.getDate())) continue;
    for (const h of sortedH) {
      for (const mn of sortedM) {
        const t = new Date(day);
        t.setHours(h, mn, 0, 0);
        if (t > now && runs.length < 5) runs.push(fmt.format(t));
      }
    }
  }
  return { canonical: (dow ? [...dow].sort().map((n) => DOW[n]).join(",") + " " : "") + `${datePart} ${timePart}`, desc: desc.join(", ") + ".", runs };
}

export function SystemdTimer() {
  const [value, setValue] = React.useState("Mon..Fri *-*-* 09:30:00");
  const res = React.useMemo(() => parseSystemd(value), [value]);

  return (
    <div className="space-y-5">
      <Field label="OnCalendar expression" hint="e.g. daily, hourly, or Mon..Fri *-*-* 09:30:00">
        <Input value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" />
      </Field>
      <div className="flex flex-wrap gap-2">
        {["minutely", "hourly", "daily", "weekly", "monthly", "Mon..Fri *-*-* 09:30:00", "*-*-01 00:00:00"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setValue(s)}
            className="rounded-full border border-border bg-surface-2 px-3 py-1 font-mono text-xs text-muted transition hover:border-brand/40 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
      {"error" in res ? (
        <Notice tone="error">{res.error}</Notice>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-sm">{res.desc}</p>
            <p className="mt-2 font-mono text-xs text-muted">Canonical: {res.canonical}</p>
          </div>
          <Field label="Next 5 runs (your local timezone)">
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              {res.runs && res.runs.length ? (
                <ul className="space-y-1.5 font-mono text-sm">
                  {res.runs.map((r, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Icon name="ChevronRight" className="h-3.5 w-3.5 text-brand" />
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No upcoming runs within ~4 years.</p>
              )}
            </div>
          </Field>
        </>
      )}
    </div>
  );
}
