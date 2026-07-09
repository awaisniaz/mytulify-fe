"use client";

import * as React from "react";
import { Button, Input, Select, Textarea } from "@/components/ui/primitives";
import { Field, FileDrop, Notice } from "@/components/tools/shared";
import { AiUsageBanner, notifyUsageUpdated } from "@/components/billing/AiUsageBanner";
import { proHeaders } from "@/lib/billing/client";
import { Icon } from "@/components/ui/Icon";
import { cn, readAsDataURL, download } from "@/lib/utils";
import {
  emptySchema,
  FIELD_TYPES,
  FORM_LANGUAGES,
  newField,
  type FormField,
  type FormFieldType,
  type FormSchema,
  type FormValues,
} from "@/lib/forms/schema";
import { exportElementToPdf } from "@/lib/forms/pdf-export";
import {
  CUSTOM_TEMPLATE_ID,
  FORM_CATEGORIES,
  FORM_COUNTRIES,
  approximateTemplateCount,
  getTemplate,
  templatesForCountry,
  templateToSchema,
} from "@/lib/forms/templates";
import { BrandingPanel } from "./BrandingPanel";
import { FormPreview } from "./FormPreview";
import { TemplatePicker } from "./TemplatePicker";

type Tab = "create" | "scan" | "brand" | "edit" | "fill";

async function scaleImage(file: File, maxDim = 1600): Promise<string> {
  const dataUrl = await readAsDataURL(file);
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function FieldEditor({
  field,
  onChange,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
}: {
  field: FormField;
  onChange: (f: FormField) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={field.type}
          onChange={(e) => onChange({ ...field, type: e.target.value as FormFieldType })}
          className="min-w-[140px] text-xs"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Input
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          className="min-w-[160px] flex-1 text-sm"
          placeholder="Field label"
        />
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={!!field.required}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
          />
          Required
        </label>
        <div className="ml-auto flex gap-1">
          <button type="button" disabled={!canMoveUp} onClick={() => onMove(-1)} className="rounded p-1 hover:bg-surface-2 disabled:opacity-30">
            <Icon name="ChevronDown" className="h-4 w-4 rotate-180" />
          </button>
          <button type="button" disabled={!canMoveDown} onClick={() => onMove(1)} className="rounded p-1 hover:bg-surface-2 disabled:opacity-30">
            <Icon name="ChevronDown" className="h-4 w-4" />
          </button>
          <button type="button" onClick={onRemove} className="rounded p-1 text-red-600 hover:bg-red-500/10">
            <Icon name="Trash2" className="h-4 w-4" />
          </button>
        </div>
      </div>
      {(field.type === "select" || field.type === "radio") && (
        <Textarea
          rows={2}
          value={(field.options ?? []).join("\n")}
          onChange={(e) =>
            onChange({
              ...field,
              options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="One option per line"
          className="text-sm"
        />
      )}
      {field.type !== "checkbox" && field.type !== "signature" && (
        <Input
          value={field.placeholder ?? ""}
          onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
          placeholder="Placeholder (optional)"
          className="text-sm"
        />
      )}
    </div>
  );
}

export function AiFormBuilder() {
  const [tab, setTab] = React.useState<Tab>("create");
  const [schema, setSchema] = React.useState<FormSchema>(emptySchema());
  const [values, setValues] = React.useState<FormValues>({});
  const [requirements, setRequirements] = React.useState("");
  const [context, setContext] = React.useState("");
  const [language, setLanguage] = React.useState("ur");
  const [country, setCountry] = React.useState("pk");
  const [templateId, setTemplateId] = React.useState(CUSTOM_TEMPLATE_ID);
  const [templateSearch, setTemplateSearch] = React.useState("");
  const [templateCategory, setTemplateCategory] = React.useState("All categories");
  const [scanImage, setScanImage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const previewRef = React.useRef<HTMLDivElement>(null);
  const fillPreviewRef = React.useRef<HTMLDivElement>(null);

  const hasFields = schema.fields.length > 0;
  const isCustom = templateId === CUSTOM_TEMPLATE_ID;
  const filteredTemplates = React.useMemo(
    () => templatesForCountry(country, templateSearch, templateCategory),
    [country, templateSearch, templateCategory],
  );
  const selectedTemplate = templateId !== CUSTOM_TEMPLATE_ID ? getTemplate(templateId) : null;

  const loadTemplate = () => {
    if (!selectedTemplate) return;
    setSchema(templateToSchema(selectedTemplate, language, schema.branding));
    setValues({});
    setTab("brand");
    setError("");
  };

  React.useEffect(() => {
    if (templateId === CUSTOM_TEMPLATE_ID) return;
    if (!filteredTemplates.some((t) => t.id === templateId)) {
      setTemplateId(CUSTOM_TEMPLATE_ID);
    }
  }, [country, filteredTemplates, templateId]);

  const generate = async (mode: "generate" | "scan") => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/form-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...proHeaders() },
        body: JSON.stringify(
          mode === "scan"
            ? { mode: "scan", image: scanImage, language }
            : { mode: "generate", requirements, context, language },
        ),
      });
      const data = await res.json().catch(() => ({} as { error?: string; schema?: FormSchema }));
      if (!res.ok) throw new Error(data.error ?? `Server error (${res.status})`);
      setSchema({ ...data.schema, branding: { ...schema.branding, ...data.schema.branding } });
      setValues({});
      setTab("brand");
      notifyUsageUpdated();
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "Failed to fetch" || /network/i.test(msg)) {
        setError("Server se connection nahi ho saka. Pehle `npm run dev` chalayein, phir page refresh karein.");
      } else {
        setError(msg || "Kuch galat ho gaya. Dobara try karein.");
      }
    } finally {
      setBusy(false);
    }
  };

  const updateField = (i: number, field: FormField) => {
    setSchema((s) => {
      const fields = [...s.fields];
      fields[i] = field;
      return { ...s, fields };
    });
  };

  const moveField = (i: number, dir: -1 | 1) => {
    setSchema((s) => {
      const fields = [...s.fields];
      const j = i + dir;
      if (j < 0 || j >= fields.length) return s;
      [fields[i], fields[j]] = [fields[j], fields[i]];
      return { ...s, fields };
    });
  };

  const exportPdf = async (filled: boolean) => {
    const el = filled ? fillPreviewRef.current : previewRef.current;
    if (!el) return;
    setBusy(true);
    try {
      const slug = schema.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 40) || "form";
      await exportElementToPdf(el, `${slug}${filled ? "-filled" : ""}.pdf`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const exportJson = () => {
    const blob = JSON.stringify({ schema, values }, null, 2);
    download(blob, "form.json", "application/json");
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "create", label: "Describe" },
    { id: "scan", label: "From image" },
    { id: "brand", label: "Branding" },
    { id: "edit", label: "Edit fields" },
    { id: "fill", label: "Fill & download" },
  ];

  return (
    <div className="space-y-6">
      <AiUsageBanner />
      <Notice tone="info">
        Pick a ready-made form from {approximateTemplateCount()} templates across {FORM_COUNTRIES.length - 1}{" "}
        countries — or describe a custom form in any language. Customize branding, layout, position, fill, sign, and
        download PDF.
      </Notice>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
              tab === t.id ? "bg-brand/15 text-brand" : "text-muted hover:bg-surface-2",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {tab === "create" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label="Country">
              <Select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setTemplateId(CUSTOM_TEMPLATE_ID);
                }}
              >
                {FORM_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Form template" hint={`${filteredTemplates.length} forms shown`}>
              <Input
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Search forms… (rent, job, invoice, visa, school…)"
                className="mb-2"
              />
              <Select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                className="mb-2"
              >
                {FORM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <TemplatePicker
                templates={filteredTemplates}
                selectedId={templateId}
                onSelect={setTemplateId}
                customId={CUSTOM_TEMPLATE_ID}
                hint={
                  country === "all" && templateSearch.trim().length < 2
                    ? "Tip: select Pakistan (or any country) for 100+ local forms, or type 2+ letters to search the full catalog."
                    : undefined
                }
              />
            </Field>

            <BrandingPanel
              compact
              branding={schema.branding}
              onChange={(branding) => setSchema({ ...schema, branding })}
            />

            <Field label="Form language">
              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {FORM_LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </Field>

            {selectedTemplate && (
              <div className="rounded-xl border border-brand/25 bg-brand/5 p-4 text-sm">
                <p className="font-semibold text-foreground">{selectedTemplate.schema.title}</p>
                <p className="mt-1 text-muted">{selectedTemplate.schema.description}</p>
                <p className="mt-2 text-xs text-muted">
                  {selectedTemplate.schema.fields.length} fields · Instant — no AI needed
                </p>
                <Button type="button" className="mt-3" onClick={loadTemplate}>
                  Use this template
                </Button>
              </div>
            )}

            {isCustom && (
              <>
                <Field label="Describe your custom form" hint="Country, purpose, and every section you need.">
                  <Textarea
                    rows={5}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Example: Italy tourist visa application support form in English — passport details, travel dates, hotel, sponsor, employment, declaration…"
                  />
                </Field>
                <Field label="Extra context (optional)">
                  <Input
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Company name, legal wording, specific IDs…"
                  />
                </Field>
                <Button onClick={() => generate("generate")} disabled={busy || !requirements.trim()}>
                  {busy ? "Generating…" : "Generate custom form with AI"}
                </Button>
              </>
            )}
          </div>

          <div className="rounded-xl border border-dashed border-border bg-surface-2 p-6 text-sm text-muted">
            <p className="font-semibold text-foreground">{approximateTemplateCount()} ready-made forms</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Housing: rent, lease, deposit, eviction notice</li>
              <li>Employment: job application, contract, leave, resignation</li>
              <li>Medical, school, invoice, NDA, affidavit, visa support</li>
              <li>Insurance, travel, government, business forms</li>
            </ul>
            <p className="mt-4 font-semibold text-foreground">Design & branding</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Logo position, header style, title & footer alignment</li>
              <li>Colors, fonts, two-column layout, field styles</li>
              <li>Contact & address placement on PDF</li>
            </ul>
            <p className="mt-4 font-semibold text-foreground">Custom examples (AI)</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>NGO grant application in Swahili</li>
              <li>Wedding hall booking form in Punjabi</li>
              <li>Custom clinic patient form for your practice</li>
            </ul>
          </div>
        </div>
      )}

      {tab === "scan" && (
        <div className="space-y-4 max-w-xl">
          <Field label="Form language for labels">
            <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {FORM_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>
          {scanImage ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scanImage} alt="Form scan" className="max-h-72 rounded-xl border border-border object-contain" />
              <button type="button" className="text-xs text-muted underline" onClick={() => setScanImage("")}>
                Remove image
              </button>
            </div>
          ) : (
            <FileDrop
              accept="image/*"
              label="Upload a photo or scan of an existing form"
              onFiles={async (files) => {
                if (files[0]) setScanImage(await scaleImage(files[0]));
              }}
            />
          )}
          <Button onClick={() => generate("scan")} disabled={busy || !scanImage}>
            {busy ? "Reading form…" : "Recreate form from image"}
          </Button>
        </div>
      )}

      {tab === "brand" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <BrandingPanel
              branding={schema.branding}
              onChange={(branding) => setSchema({ ...schema, branding })}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setTab("create")}>
                ← Back
              </Button>
              <Button onClick={() => setTab(hasFields ? "edit" : "create")}>
                {hasFields ? "Continue to fields →" : "Pick or create a form first"}
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <FormPreview
              ref={previewRef}
              schema={{
                ...schema,
                title: schema.title || "Sample Form Title",
                fields: hasFields
                  ? schema.fields
                  : [
                      { id: "sample1", type: "text", label: "Sample field", required: false },
                      { id: "sample2", type: "date", label: "Date", required: false },
                    ],
              }}
              editable={false}
            />
          </div>
        </div>
      )}

      {tab === "edit" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <Field label="Form title">
              <Input value={schema.title} onChange={(e) => setSchema({ ...schema, title: e.target.value })} />
            </Field>
            <Field label="Description">
              <Textarea
                rows={2}
                value={schema.description ?? ""}
                onChange={(e) => setSchema({ ...schema, description: e.target.value })}
              />
            </Field>

            <button
              type="button"
              className="text-xs font-semibold text-brand underline"
              onClick={() => setTab("brand")}
            >
              Edit branding & logo →
            </button>

            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Fields ({schema.fields.length})</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSchema({ ...schema, fields: [...schema.fields, newField()] })}
              >
                <Icon name="Plus" className="h-4 w-4" /> Add field
              </Button>
            </div>

            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {schema.fields.map((f, i) => (
                <FieldEditor
                  key={f.id}
                  field={f}
                  onChange={(nf) => updateField(i, nf)}
                  onRemove={() =>
                    setSchema({ ...schema, fields: schema.fields.filter((_, j) => j !== i) })
                  }
                  onMove={(d) => moveField(i, d)}
                  canMoveUp={i > 0}
                  canMoveDown={i < schema.fields.length - 1}
                />
              ))}
              {!hasFields && (
                <p className="text-sm text-muted">Generate a form first, or add fields manually.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={!hasFields || busy} onClick={() => exportPdf(false)}>
                Download blank PDF
              </Button>
              <Button variant="secondary" disabled={!hasFields} onClick={exportJson}>
                Save JSON
              </Button>
              <Button disabled={!hasFields} onClick={() => setTab("fill")}>
                Fill form →
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            {hasFields ? (
              <FormPreview ref={previewRef} schema={schema} editable={false} />
            ) : (
              <div className="grid h-64 place-items-center text-sm text-muted">Preview appears here</div>
            )}
          </div>
        </div>
      )}

      {tab === "fill" && (
        <div className="space-y-4">
          {!hasFields ? (
            <Notice tone="info">Create or generate a form first.</Notice>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-border">
                <FormPreview
                  ref={fillPreviewRef}
                  schema={schema}
                  values={values}
                  editable
                  onChange={(id, v) => setValues((prev) => ({ ...prev, [id]: v }))}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => exportPdf(true)} disabled={busy}>
                  {busy ? "Creating PDF…" : "Download filled PDF"}
                </Button>
                <Button variant="secondary" onClick={() => exportPdf(false)} disabled={busy}>
                  Download blank template
                </Button>
                <Button variant="secondary" onClick={exportJson}>
                  Save JSON
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
