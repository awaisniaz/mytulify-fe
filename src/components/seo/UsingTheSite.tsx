import { headers } from "next/headers";
import { CATEGORIES, TOTAL_BROWSER_TOOLS, TOTAL_TOOLS } from "@/lib/catalog";

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Legal / trust pages — keep them on-topic for AdSense & user trust (no site-wide tool guide). */
const SUPPRESS_GUIDE_PATHS = new Set([
  "/privacy",
  "/terms",
  "/disclaimer",
  "/about",
  "/contact",
  "/press",
  "/link-to-us",
]);

function isToolPage(pathname: string): boolean {
  const parts = pathname.replace(/\/$/, "").split("/").filter(Boolean);
  if (parts.length !== 2) return false;
  const [categorySlug, toolSlug] = parts;
  const cat = CATEGORIES.find((c) => c.slug === categorySlug);
  return Boolean(cat?.tools.some((t) => t.slug === toolSlug));
}

function shouldSuppressGuide(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (SUPPRESS_GUIDE_PATHS.has(path)) return true;
  if (isToolPage(path)) return true;
  return false;
}

/** Plain-language guide on marketing pages. Omitted on tool URLs and legal/trust pages. */
export async function UsingTheSite() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (shouldSuppressGuide(pathname)) return null;

  const categories = CATEGORIES.map(
    (c) =>
      `<p><strong>${esc(c.name)}.</strong> ${esc(c.description)} ${esc(c.tagline)}. Open that category and read the line under each tool name before you click. The line is the job the tool actually does.</p>`,
  ).join("");

  const html = `
<h2>How to use ${esc(String(TOTAL_TOOLS))}+ tools on this site</h2>
<p>Each tool is a separate page. The title is the task, the sentence under the title is the scope, and the form is the product. Type the text, choose the file, or enter the numbers you already have. The result stays on that page. You can change one field and compare a second case without starting over.</p>
<p>${esc(String(TOTAL_BROWSER_TOOLS))} tools run in the browser. The file or the figures stay on your device, which is why those pages are marked private. They work without an account. AI writers and handwriting OCR send the input to a server so a model can run, and the page says so. The free plan includes a small daily limit for those server tools. Pro removes the limit. Do not paste passwords or account numbers into a server tool.</p>
<p>Search from the header when you know the tool name. Open a category when you only know the kind of job. Calculator pages are estimates: a payment, a yard of concrete, or a calorie figure is only as good as the rate, the unit, and the date you typed. PDF and image pages follow the file you upload. If the page never mentions a rule that applies to your bank, school, clinic, or city, treat the output as a draft and check the source that actually governs the decision.</p>
<p>Read the notes under the form before you rely on a number. They repeat the scope, the steps, and the questions people ask. Related tools sit at the bottom when the next step is a different calculation or a different file. The categories below are the whole library.</p>
${categories}
<p>Pick the tool whose description matches the input you have. If the description does not mention that input, it is the wrong page. Run the form, read the result next to the labels, and only then copy it into a document, a message, or a spreadsheet.</p>
<h2>How to read a result</h2>
<p>A calculator answers the question printed on the page. A mortgage page returns principal, interest, tax, and insurance when you enter those amounts. It does not know your lender’s fees, your credit score, or a rate that changes next month. Change the rate, the term, or the down payment and read the new payment next to the old one before you decide. The same habit works for a loan, a retirement contribution, a paint job, or a calorie target: one input at a time, then the line that moved.</p>
<p>Units are part of the answer. A length converter shows both sides of the pair you picked. A concrete page asks for feet or metres because a yard of concrete is a volume, not a length. If the label says per month, do not type a yearly figure in that box. Dates matter on age, pregnancy, countdown, and interest pages: the day you enter is the day the formula uses. Round only after you have the full figure, and keep the same rounding when you compare two cases.</p>
<p>File tools follow the file. A PDF merge keeps page order as you arranged the files. Split and extract keep the pages you selected. Compress makes the file smaller and can soften images inside it. Rotate, crop, watermark, and page numbers change the pages you see, not the words in a scanned image unless the page says it runs OCR. An image resizer changes pixels. A format converter changes the container. Download the result and open it before you send it. If the preview looks wrong, the source file is still on your device and you can run the tool again.</p>
<p>Text tools work on the text in the box. A counter reports words, characters, and sentences for that box only. Case, find-and-replace, and duplicate-line tools rewrite that box. They do not open a document on your computer until you paste. JSON, CSV, and code formatters expect valid input; an error line means the text is not in the shape the tool described. Fix the text or pick the converter that matches the format you actually have.</p>
<p>Search opens a list of every tool name and its one-line description. Type the job, not a slogan: mortgage, merge pdf, word counter, bmi. The match is the name and the description, so a short specific phrase finds the page faster than a long sentence. Category menus are the same library grouped by the kind of work. A tool that is not built yet is marked soon and does not pretend to calculate.</p>
<p>The guide under each tool is the place to check limits. It names the inputs, what the formula leaves out, and the questions people ask before they use the number. Related links are the next tool when the job continues, such as a payment after a loan amount, or a JPG after a PDF page. The blog explains one job in a longer article and links to the tool that does the work. Use the article when you want the reasoning, and the tool when you already have the figures.</p>
<p>Browser tools need a current browser and JavaScript. A very large PDF or image can be slow because it is processed on your machine. Server tools need a connection and count toward the free daily limit. Create an account only if you want that limit lifted. The result on a private page is not stored by the site. Copy what you need, then close the tab if the file was sensitive.</p>`;

  return (
    <section className="site-guide" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
