import { generateIndexNowKey } from "@/lib/seo/indexnow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Generate a random IndexNow API key for the user to host as {key}.txt */
export async function GET() {
  const key = generateIndexNowKey();
  return Response.json({
    key,
    fileName: `${key}.txt`,
    fileContents: key,
    tip: "Upload this file to your site root (https://yourdomain.com/{key}.txt) so Bing can verify ownership.",
  });
}
