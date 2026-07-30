/** Compact event datetime helpers (mirrors tickean-ecommerce/lib/event-datetime). */

type Instant = string | Date | null | undefined;

type CalendarDay = {
  key: string;
  year: number;
  month: number;
  day: number;
};

const RFC3339 =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i;

function parseInstant(input: Instant): Date | null {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  const value = typeof input === "string" ? input.trim() : "";
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isValidTimeZone(tz?: string | null): boolean {
  if (!tz?.trim()) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format();
    return true;
  } catch {
    return false;
  }
}

export function resolveEventTimeZone(location?: {
  timeZone?: string | null;
  country?: string | null;
} | null): string {
  if (isValidTimeZone(location?.timeZone)) return location!.timeZone!.trim();
  const country = (location?.country || "").toLowerCase();
  if (country.includes("chile") || country === "cl") return "America/Santiago";
  if (country.includes("méxico") || country.includes("mexico") || country === "mx") {
    return "America/Mexico_City";
  }
  if (country.includes("united states") || country === "us") return "America/New_York";
  return "America/Argentina/Buenos_Aires";
}

function formatInZone(
  input: Instant,
  timeZone: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const instant = parseInstant(input);
  if (!instant) return "";
  const tz = isValidTimeZone(timeZone) ? timeZone : "America/Argentina/Buenos_Aires";
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: tz }).format(instant);
}

export function formatEventDate(
  input: Instant,
  timeZone: string,
  locale = "es-AR",
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  return formatInZone(input, timeZone, locale, options);
}

export function formatEventTime(
  input: Instant,
  timeZone: string,
  locale = "es-AR",
): string {
  return formatInZone(input, timeZone, locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getCalendarDateParts(
  input: Instant,
  timeZone: string,
): CalendarDay | null {
  const instant = parseInstant(input);
  if (!instant) return null;
  const tz = isValidTimeZone(timeZone) ? timeZone : "America/Argentina/Buenos_Aires";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  if (![year, month, day].every(Number.isInteger)) return null;
  const key = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { key, year, month, day };
}

function capitalize(label: string): string {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function andWord(locale: string): string {
  return locale.toLowerCase().startsWith("en") ? "and" : "y";
}

function joinWithAnd(items: string[], word: string): string {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} ${word} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} ${word} ${items[items.length - 1]}`;
}

function monthName(year: number, month: number, locale: string): string {
  const probe = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
  return capitalize(
    new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(probe),
  );
}

export function formatMultiDayShowDates(
  shows: readonly { date?: Instant }[] | null | undefined,
  timeZone: string,
  locale = "es-AR",
): string | null {
  const byKey = new Map<string, CalendarDay>();
  for (const show of shows ?? []) {
    const parts = getCalendarDateParts(show.date, timeZone);
    if (!parts || byKey.has(parts.key)) continue;
    byKey.set(parts.key, parts);
  }
  const days = [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
  if (days.length <= 1) return null;

  const word = andWord(locale);
  const isEs = word === "y";
  const sameMonthYear = days.every(
    (d) => d.month === days[0].month && d.year === days[0].year,
  );

  if (sameMonthYear) {
    const dayList = joinWithAnd(
      days.map((d) => String(d.day)),
      word,
    );
    const month = monthName(days[0].year, days[0].month, locale);
    return isEs
      ? `${dayList} de ${month} ${days[0].year}`
      : `${dayList} ${month} ${days[0].year}`;
  }

  // Fallback: list short labels
  return joinWithAnd(
    days.map((d) =>
      formatEventDate(
        `${d.key}T12:00:00Z`,
        "UTC",
        locale,
        { day: "numeric", month: "short" },
      ),
    ),
    word,
  );
}

export function formatShowTimeRange(
  show: { date?: Instant; endDate?: Instant } | null | undefined,
  timeZone: string,
  locale = "es-AR",
): string {
  const start = formatEventTime(show?.date, timeZone, locale);
  if (!start) return "";
  const end = formatEventTime(show?.endDate, timeZone, locale);
  if (end && end !== start) return `${start}–${end}`;
  return start;
}

export function formatShowDayScheduleLabel(
  show: { date?: Instant; endDate?: Instant; title?: string },
  timeZone: string,
  locale = "es-AR",
  options?: { includeTitle?: boolean },
): string {
  const datePart = formatEventDate(show.date, timeZone, locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timePart = formatShowTimeRange(show, timeZone, locale);
  const parts: string[] = [];
  if (options?.includeTitle && show.title?.trim()) parts.push(show.title.trim());
  if (datePart) parts.push(datePart);
  if (timePart) parts.push(timePart);
  return parts.join(" · ");
}

export type EventImage = {
  kind?: string;
  desktopUrl?: string;
  mobileUrl?: string;
  url?: string;
};

export function getEventFlyerUrl(images?: unknown[] | null): string | null {
  const list = (images || []) as EventImage[];
  if (!list.length) return null;
  const main = list.find((img) => img.kind === "main") || list[0];
  return (
    main?.mobileUrl ||
    main?.desktopUrl ||
    main?.url ||
    null
  );
}

export function buildEventScheduleSummary(
  shows: readonly { date?: Instant; endDate?: Instant; title?: string }[] | null | undefined,
  timeZone: string,
  locale = "es-AR",
): { dateLabel: string; showLines: string[] } {
  const list = [...(shows || [])].sort((a, b) => {
    const da = parseInstant(a.date)?.getTime() ?? 0;
    const db = parseInstant(b.date)?.getTime() ?? 0;
    return da - db;
  });

  const multi = formatMultiDayShowDates(list, timeZone, locale);
  const earliest = list[0];
  const dateLabel =
    multi ||
    formatEventDate(earliest?.date, timeZone, locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }) ||
    "";

  const showLines = list.map((show) =>
    formatShowDayScheduleLabel(show, timeZone, locale, {
      includeTitle: list.length > 1,
    }),
  );

  // Single-day: append time on date line if only one show and no multi label
  if (!multi && list.length === 1) {
    const time = formatShowTimeRange(list[0], timeZone, locale);
    return {
      dateLabel: time ? `${dateLabel} · ${time}` : dateLabel,
      showLines: [],
    };
  }

  return { dateLabel, showLines };
}
