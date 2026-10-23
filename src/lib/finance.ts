export const CURRENCIES = ["USD", "AED", "EUR", "GBP", "INR", "SAR"] as const;

export const LICENSE_TYPES = [
  { value: "perpetual", label: "Perpetual" },
  { value: "annual", label: "Annual license" },
  { value: "multi_year", label: "Multi-year" },
  { value: "oem", label: "OEM / white-label" },
  { value: "other", label: "Other" },
] as const;

export const EXPENSE_CATEGORIES = [
  "Hosting & Infrastructure",
  "Software & Tools",
  "Salaries & Contractors",
  "Marketing & Ads",
  "Office & Operations",
  "Travel",
  "Legal & Accounting",
  "Other",
] as const;

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-US")}`;
  }
}

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function licenseLabel(value: string): string {
  return LICENSE_TYPES.find((t) => t.value === value)?.label ?? value;
}
