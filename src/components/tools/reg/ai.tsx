"use client";

import { makeReg } from "./_util";
import { AiTool } from "@/components/tools/impl/ai";
import { AI_TOOLS } from "@/lib/ai/tools";

/** Every AI tool renders through the same shell, keyed by slug. */
const map = Object.fromEntries(
  Object.keys(AI_TOOLS).map((slug) => [slug, () => <AiTool slug={slug} />]),
);

export default makeReg(map);
