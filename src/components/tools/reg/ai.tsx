"use client";

import { makeReg } from "./_util";
import { AiTool } from "@/components/tools/impl/ai";
import { AiFormBuilder } from "@/components/tools/impl/ai-form-builder";
import { AtsResumeChecker } from "@/components/tools/impl/ats-resume-checker";
import { AI_TOOLS } from "@/lib/ai/tools";

const map = Object.fromEntries(
  Object.keys(AI_TOOLS).map((slug) => [slug, () => <AiTool slug={slug} />]),
);

map["ai-form-builder"] = () => <AiFormBuilder />;
map["ats-resume-checker"] = () => <AtsResumeChecker />;

export default makeReg(map);
