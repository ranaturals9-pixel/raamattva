const IST = "Asia/Kolkata";

export function inr(paise: number | null | undefined): string {
  if (paise == null) return "";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function rupeesToPaise(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[,₹\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function istDate(iso: string, lang: "en" | "hi" = "en"): string {
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function istTime(iso: string, lang: "en" | "hi" = "en"): string {
  return (
    new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
      timeZone: IST,
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso)) + " IST"
  );
}

export function istDay(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric" }).format(d),
    month: new Intl.DateTimeFormat("en-IN", { timeZone: IST, month: "short" }).format(d),
  };
}

/** Value for <input type="datetime-local"> shown in IST. */
export function toIstInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 330 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

/** Parse an IST datetime-local value into an ISO timestamp. */
export function fromIstInput(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(`${value}:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function duration(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} ${h === 1 ? "hour" : "hours"}`;
  return `${m} min`;
}

/** Indian mobile numbers to +91XXXXXXXXXX; other numbers kept with their + prefix. */
export function normalisePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits.length >= 8 ? digits : null;
  const d = digits.replace(/^0+/, "");
  if (d.length === 10) return `+91${d}`;
  if (d.length === 12 && d.startsWith("91")) return `+${d}`;
  return null;
}

export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${path}`;
}
