export type FormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "date"
  | "phone"
  | "cnic"
  | "select"
  | "checkbox"
  | "radio"
  | "signature";

export type FormField = {
  id: string;
  type: FormFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

export type FormBranding = {
  organization?: string;
  tagline?: string;
  logoDataUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  bodyTextColor?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  footerText?: string;
  showFooterBrand?: boolean;
  headerStyle?: "bar" | "minimal" | "bordered" | "split";
  logoPosition?: "left" | "right" | "center" | "top";
  headerAlign?: "left" | "center" | "right";
  titleAlign?: "left" | "center" | "right";
  footerAlign?: "left" | "center" | "right";
  contactPlacement?: "header" | "below-title" | "footer";
  addressPlacement?: "header" | "below-title" | "footer" | "hidden";
  logoHeight?: number;
  pagePadding?: "compact" | "normal" | "wide";
  fieldsLayout?: "single" | "two-column";
  fontFamily?: "serif" | "sans" | "modern";
  titleSize?: "sm" | "md" | "lg";
  fieldStyle?: "boxed" | "underline" | "minimal";
  borderStyle?: "solid" | "none" | "rounded";
};

export type FormSchema = {
  title: string;
  description?: string;
  language: string;
  fields: FormField[];
  branding?: FormBranding;
};

export type FormValues = Record<string, string>;

export const FORM_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ur", label: "Urdu (اردو)" },
  { value: "ar", label: "Arabic (العربية)" },
  { value: "fa", label: "Persian (فارسی)" },
  { value: "hi", label: "Hindi (हिन्दी)" },
  { value: "bn", label: "Bengali (বাংলা)" },
  { value: "pa", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { value: "ps", label: "Pashto (پښتو)" },
  { value: "sd", label: "Sindhi (سنڌي)" },
  { value: "tr", label: "Turkish (Türkçe)" },
  { value: "de", label: "German (Deutsch)" },
  { value: "fr", label: "French (Français)" },
  { value: "es", label: "Spanish (Español)" },
  { value: "pt", label: "Portuguese (Português)" },
  { value: "it", label: "Italian (Italiano)" },
  { value: "nl", label: "Dutch (Nederlands)" },
  { value: "pl", label: "Polish (Polski)" },
  { value: "ru", label: "Russian (Русский)" },
  { value: "zh", label: "Chinese (中文)" },
  { value: "ja", label: "Japanese (日本語)" },
  { value: "ko", label: "Korean (한국어)" },
  { value: "vi", label: "Vietnamese (Tiếng Việt)" },
  { value: "id", label: "Indonesian (Bahasa Indonesia)" },
  { value: "ms", label: "Malay (Bahasa Melayu)" },
  { value: "tl", label: "Filipino" },
  { value: "th", label: "Thai (ไทย)" },
] as const;

export const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "cnic", label: "CNIC / ID number" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Multiple choice" },
  { value: "checkbox", label: "Checkbox" },
  { value: "signature", label: "Digital signature" },
];

export function emptySchema(language = "en"): FormSchema {
  return {
    title: "Untitled form",
    description: "",
    language,
    fields: [],
    branding: {
      primaryColor: "#ea580c",
      secondaryColor: "#1e293b",
      backgroundColor: "#ffffff",
      bodyTextColor: "#111827",
      showFooterBrand: true,
      headerStyle: "bar",
      logoPosition: "left",
      headerAlign: "left",
      titleAlign: "left",
      footerAlign: "left",
      contactPlacement: "header",
      addressPlacement: "below-title",
      logoHeight: 64,
      pagePadding: "normal",
      fieldsLayout: "single",
      fontFamily: "serif",
      titleSize: "lg",
      fieldStyle: "boxed",
      borderStyle: "solid",
    },
  };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40) || "field";
}

const TYPE_ALIASES: Record<string, FormFieldType> = {
  text: "text",
  string: "text",
  short_text: "text",
  textarea: "textarea",
  long_text: "textarea",
  paragraph: "textarea",
  email: "email",
  number: "number",
  integer: "number",
  date: "date",
  phone: "phone",
  tel: "phone",
  telephone: "phone",
  mobile: "phone",
  cnic: "cnic",
  id: "cnic",
  national_id: "cnic",
  select: "select",
  dropdown: "select",
  checkbox: "checkbox",
  check: "checkbox",
  boolean: "checkbox",
  radio: "radio",
  multiple_choice: "radio",
  signature: "signature",
  sign: "signature",
};

function normalizeFieldType(raw: unknown): FormFieldType {
  if (typeof raw !== "string") return "text";
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return TYPE_ALIASES[key] ?? "text";
}

export function parseFormSchema(raw: unknown): FormSchema {
  if (!raw || typeof raw !== "object") throw new Error("Invalid form data");
  const o = raw as Record<string, unknown>;
  // Some models nest under { form: {...} } or { schema: {...} }
  const nested =
    o.fields == null && typeof o.form === "object" && o.form
      ? (o.form as Record<string, unknown>)
      : o.fields == null && typeof o.schema === "object" && o.schema
        ? (o.schema as Record<string, unknown>)
        : o;
  const title =
    typeof nested.title === "string" && nested.title.trim() ? nested.title.trim() : "Untitled form";
  const language = typeof nested.language === "string" ? nested.language : "en";
  const description = typeof nested.description === "string" ? nested.description : "";
  const fieldsRaw = Array.isArray(nested.fields) ? nested.fields : [];
  const seen = new Set<string>();
  const fields: FormField[] = fieldsRaw.map((item, i) => {
    const f = item as Record<string, unknown>;
    const label = typeof f.label === "string" && f.label.trim() ? f.label.trim() : `Field ${i + 1}`;
    let id = typeof f.id === "string" && f.id.trim() ? f.id.trim() : slugify(label);
    id = slugify(id) || `field_${i + 1}`;
    if (seen.has(id)) id = `${id}_${i}`;
    seen.add(id);
    const fieldType = normalizeFieldType(f.type);
    const options = Array.isArray(f.options)
      ? f.options
          .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
          .map((x) => x.trim())
      : undefined;
    return {
      id,
      type: fieldType,
      label,
      required: !!f.required,
      placeholder: typeof f.placeholder === "string" ? f.placeholder : undefined,
      options:
        options?.length
          ? options
          : fieldType === "select" || fieldType === "radio"
            ? ["Option 1", "Option 2"]
            : undefined,
    };
  });
  if (!fields.length) throw new Error("No form fields were generated. Try a more detailed description.");
  return { title, description, language, fields };
}

export function newField(type: FormFieldType = "text"): FormField {
  const id = `field_${Date.now().toString(36)}`;
  return {
    id,
    type,
    label: "New field",
    required: false,
    options: type === "select" || type === "radio" ? ["Option 1", "Option 2"] : undefined,
  };
}
