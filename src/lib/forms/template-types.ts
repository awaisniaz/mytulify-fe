import type { FormSchema } from "./schema";

export type FormTemplate = {
  id: string;
  name: string;
  country: string;
  countryLabel: string;
  category: string;
  language: string;
  schema: Omit<FormSchema, "branding">;
};
