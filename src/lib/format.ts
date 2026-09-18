export function formatNaira(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded).toLocaleString("en-US");
  return `${rounded < 0 ? "-" : ""}₦${formatted}`;
}

export function formatKwh(value: number, digits = 1): string {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} kWh`;
}

export function formatWatts(watts: number): string {
  if (watts >= 1000) {
    const kw = watts / 1000;
    return `${kw.toLocaleString("en-US", { maximumFractionDigits: 2 })} kW`;
  }
  return `${Math.round(watts).toLocaleString("en-US")} W`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
