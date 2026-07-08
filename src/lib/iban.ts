/** IBAN validation (ISO 13616 mod-97). */

const COUNTRY_LENGTHS: Record<string, number> = {
  AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29,
  BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, ES: 24,
  FI: 18, FO: 18, FR: 27, GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21,
  HU: 28, IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28, LC: 32,
  LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19, MR: 27, MT: 31,
  MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22,
  SA: 24, SE: 24, SI: 19, SK: 24, SM: 27, TN: 24, TR: 26, UA: 29, VA: 22, VG: 24,
  XK: 20,
};

export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function validateIban(raw: string): {
  valid: boolean;
  iban: string;
  country?: string;
  error?: string;
} {
  const iban = normalizeIban(raw);
  if (!iban) return { valid: false, iban, error: "Enter an IBAN." };
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) {
    return { valid: false, iban, error: "Invalid format — must start with country code + check digits." };
  }

  const country = iban.slice(0, 2);
  const expectedLen = COUNTRY_LENGTHS[country];
  if (expectedLen && iban.length !== expectedLen) {
    return { valid: false, iban, country, error: `Expected ${expectedLen} characters for ${country}, got ${iban.length}.` };
  }

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let numeric = "";
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) numeric += ch;
    else if (code >= 65 && code <= 90) numeric += String(code - 55);
    else return { valid: false, iban, country, error: "Invalid characters in IBAN." };
  }

  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    remainder = Number(String(remainder) + numeric.slice(i, i + 7)) % 97;
  }

  if (remainder !== 1) {
    return { valid: false, iban, country, error: "Check digits failed — this IBAN is not valid." };
  }

  return { valid: true, iban, country };
}

export function formatIban(iban: string): string {
  return normalizeIban(iban).replace(/(.{4})/g, "$1 ").trim();
}
