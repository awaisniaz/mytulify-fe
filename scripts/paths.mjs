import { existsSync } from "fs";
import { join } from "path";

/** Resolve sibling backend repo (tools-hub-backend). */
export function backendRoot(fromDir) {
  const frontendRoot = join(fromDir, "..");
  const candidates = [
    process.env.TOOLS_HUB_BACKEND_DIR,
    join(frontendRoot, "..", "tools-hub-backend"),
    join(frontendRoot, "backend"), // legacy nested layout
  ].filter(Boolean);

  for (const dir of candidates) {
    if (existsSync(join(dir, "package.json"))) return dir;
  }

  return join(frontendRoot, "..", "tools-hub-backend");
}
