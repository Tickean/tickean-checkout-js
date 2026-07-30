/** Dial-code catalog for phone input (LATAM-first + common markets). */
export type PhoneCountry = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "AR", name: "Argentina", dial: "54", flag: "🇦🇷" },
  { iso: "CL", name: "Chile", dial: "56", flag: "🇨🇱" },
  { iso: "UY", name: "Uruguay", dial: "598", flag: "🇺🇾" },
  { iso: "PY", name: "Paraguay", dial: "595", flag: "🇵🇾" },
  { iso: "BO", name: "Bolivia", dial: "591", flag: "🇧🇴" },
  { iso: "BR", name: "Brasil", dial: "55", flag: "🇧🇷" },
  { iso: "PE", name: "Perú", dial: "51", flag: "🇵🇪" },
  { iso: "CO", name: "Colombia", dial: "57", flag: "🇨🇴" },
  { iso: "EC", name: "Ecuador", dial: "593", flag: "🇪🇨" },
  { iso: "MX", name: "México", dial: "52", flag: "🇲🇽" },
  { iso: "US", name: "United States", dial: "1", flag: "🇺🇸" },
  { iso: "ES", name: "España", dial: "34", flag: "🇪🇸" },
  { iso: "GB", name: "United Kingdom", dial: "44", flag: "🇬🇧" },
];

const byIso = new Map(PHONE_COUNTRIES.map((c) => [c.iso, c]));

export function countryFromIso(iso?: string | null): PhoneCountry {
  const key = (iso || "").toUpperCase();
  return byIso.get(key) || PHONE_COUNTRIES[0];
}

export function countryFromLocale(locale?: string | null): PhoneCountry {
  const l = (locale || "").toLowerCase();
  if (l.startsWith("es-cl")) return countryFromIso("CL");
  if (l.startsWith("es-mx")) return countryFromIso("MX");
  if (l.startsWith("pt") || l.startsWith("pt-br")) return countryFromIso("BR");
  if (l.startsWith("en-gb")) return countryFromIso("GB");
  if (l.startsWith("en")) return countryFromIso("US");
  if (l.startsWith("es")) return countryFromIso("AR");
  return PHONE_COUNTRIES[0];
}

export function toE164(dial: string, national: string): string {
  const digits = national.replace(/\D/g, "").replace(/^0+/, "");
  const d = dial.replace(/\D/g, "");
  return `+${d}${digits}`;
}

export function nationalPlaceholder(iso: string): string {
  switch (iso) {
    case "AR":
      return "11 2345 6789";
    case "CL":
      return "9 1234 5678";
    case "MX":
      return "55 1234 5678";
    case "US":
      return "(555) 123-4567";
    default:
      return "Phone number";
  }
}

export async function detectCountryIso(apiBaseUrl?: string): Promise<string | null> {
  const base = (apiBaseUrl || "https://api.tickean.com").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/bff/marketplace/location/ip`, {
      credentials: "omit",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      available?: boolean;
      countryCode?: string;
    };
    if (json?.available && json.countryCode) {
      return String(json.countryCode).toUpperCase();
    }
  } catch {
    /* fall through */
  }
  return null;
}
