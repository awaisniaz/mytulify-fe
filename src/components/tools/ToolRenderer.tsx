"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { ComingSoon } from "./reg/_util";
import { ToolLoadingSkeleton } from "@/components/ui/motion";

type RegProps = { slug: string };

/** Each category lazy-loads only its own tool bundle. */
const LOADERS: Record<string, ComponentType<RegProps>> = {
  "ai-tools": dynamic(() => import("./reg/ai"), { loading: ToolLoadingSkeleton }),
  "handwriting-ocr": dynamic(() => import("./reg/ai"), { loading: ToolLoadingSkeleton }),
  "devops-tools": dynamic(() => import("./reg/devops"), { loading: ToolLoadingSkeleton }),
  "health-tools": dynamic(() => import("./reg/health"), { loading: ToolLoadingSkeleton }),
  "text-tools": dynamic(() => import("./reg/text"), { loading: ToolLoadingSkeleton }),
  "color-tools": dynamic(() => import("./reg/color"), { loading: ToolLoadingSkeleton }),
  "unit-converters": dynamic(() => import("./reg/units"), { loading: ToolLoadingSkeleton }),
  "social-media-tools": dynamic(() => import("./reg/social"), { loading: ToolLoadingSkeleton }),
  "developer-tools": dynamic(() => import("./reg/dev"), { loading: ToolLoadingSkeleton }),
  "security-password-tools": dynamic(() => import("./reg/security"), { loading: ToolLoadingSkeleton }),
  "calculators": dynamic(() => import("./reg/calc"), { loading: ToolLoadingSkeleton }),
  "converters-generators": dynamic(() => import("./reg/generators"), { loading: ToolLoadingSkeleton }),
  "seo-web-tools": dynamic(() => import("./reg/seo"), { loading: ToolLoadingSkeleton }),
  "image-tools": dynamic(() => import("./reg/image"), { loading: ToolLoadingSkeleton }),
  "pdf-tools": dynamic(() => import("./reg/pdf"), { loading: ToolLoadingSkeleton }),
  "freelancer-tools": dynamic(() => import("./reg/freelancer"), { loading: ToolLoadingSkeleton }),
};

export function ToolRenderer({ category, slug }: { category: string; slug: string }) {
  const Cat = LOADERS[category];
  if (!Cat) return <ComingSoon />;
  return <Cat slug={slug} />;
}
