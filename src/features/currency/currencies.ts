// Country (ISO 3166 alpha-2, from Vercel's x-vercel-ip-country header) → the
// currency we show an approximate price in. Ghana and unlisted countries show
// cedis only. Everything is still charged in GHS.
const EURO = ["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"];

const BY_COUNTRY: Record<string, string> = {
  US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD", NG: "NGN", ZA: "ZAR", KE: "KES", UG: "UGX", TZ: "TZS",
  RW: "RWF", CI: "XOF", SN: "XOF", TG: "XOF", BJ: "XOF", BF: "XOF", ML: "XOF", NE: "XOF", CM: "XAF", LR: "LRD",
  SL: "SLE", GM: "GMD", ZM: "ZMW", ZW: "USD", EG: "EGP", MA: "MAD", AE: "AED", SA: "SAR", QA: "QAR", IN: "INR",
  CN: "CNY", JP: "JPY", KR: "KRW", SG: "SGD", MY: "MYR", PH: "PHP", BR: "BRL", MX: "MXN", CH: "CHF", SE: "SEK",
  NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", TR: "TRY", IL: "ILS", JM: "JMD", TT: "TTD",
  ...Object.fromEntries(EURO.map((code) => [code, "EUR"])),
};

export function currencyForCountry(country: string | null) {
  if (!country) return null;
  return BY_COUNTRY[country.toUpperCase()] ?? null;
}

export const SELECTABLE = ["USD", "GBP", "EUR", "CAD", "NGN", "ZAR", "KES", "XOF", "AUD"];
