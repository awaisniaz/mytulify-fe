import type { FormTemplate } from "./template-types";
import type { FormField } from "./schema";
import { FORM_COUNTRIES } from "./countries";
import { BLUEPRINT_FIELDS, BLUEPRINT_META, type BlueprintId } from "./template-blueprints";

const COUNTRY_CODES = FORM_COUNTRIES.filter((c) => c.code !== "all" && c.code !== "global");
const countryLabel = (code: string) => FORM_COUNTRIES.find((c) => c.code === code)?.label ?? code;

function cloneFields(fields: FormField[], prefix: string): FormField[] {
  return fields.map((field) => ({
    ...field,
    id: `${prefix}_${field.id}`,
    options: field.options ? [...field.options] : undefined,
  }));
}

function buildTemplate(country: string, cLabel: string, blueprint: BlueprintId): FormTemplate {
  const meta = BLUEPRINT_META[blueprint];
  const prefix = country === "global" ? "g" : country;
  const id = country === "global" ? `global-${blueprint}` : `${country}-${blueprint}`;
  return {
    id,
    name: meta.name,
    country,
    countryLabel: cLabel,
    category: meta.category,
    language: "en",
    schema: {
      title: country === "global" ? meta.title : `${meta.title} (${cLabel})`,
      description: meta.description,
      language: "en",
      fields: cloneFields(BLUEPRINT_FIELDS[blueprint], prefix),
    },
  };
}

let globalGenerated: FormTemplate[] | null = null;
let allGenerated: FormTemplate[] | null = null;
const perCountryCache = new Map<string, FormTemplate[]>();

export function getGlobalGeneratedTemplates(): FormTemplate[] {
  if (!globalGenerated) {
    globalGenerated = (Object.keys(BLUEPRINT_META) as BlueprintId[]).map((bp) =>
      buildTemplate("global", "Universal", bp),
    );
  }
  return globalGenerated;
}

export function getGeneratedForCountry(countryCode: string): FormTemplate[] {
  if (countryCode === "global") return getGlobalGeneratedTemplates();
  if (perCountryCache.has(countryCode)) return perCountryCache.get(countryCode)!;
  const list = (Object.keys(BLUEPRINT_META) as BlueprintId[]).map((bp) =>
    buildTemplate(countryCode, countryLabel(countryCode), bp),
  );
  perCountryCache.set(countryCode, list);
  return list;
}

export function getAllGeneratedTemplates(): FormTemplate[] {
  if (!allGenerated) {
    allGenerated = [
      ...getGlobalGeneratedTemplates(),
      ...COUNTRY_CODES.flatMap((c) => getGeneratedForCountry(c.code)),
    ];
  }
  return allGenerated;
}

export function generatedTemplateCount(): number {
  return getGlobalGeneratedTemplates().length * (1 + COUNTRY_CODES.length);
}
