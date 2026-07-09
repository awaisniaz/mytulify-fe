"use client";

import { makeReg } from "./_util";
import { AiTool } from "@/components/tools/impl/ai";
import { AiFormBuilder } from "@/components/tools/impl/ai-form-builder";
import { AI_TOOLS } from "@/lib/ai/tools";

const map = Object.fromEntries(
  Object.keys(AI_TOOLS).map((slug) => [slug, () => <AiTool slug={slug} />]),
);

map["ai-form-builder"] = () => <AiFormBuilder />;

export default makeReg(map);
