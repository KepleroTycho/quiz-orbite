export type PlanetData = { name: string; periodDays: number; a: number };

export const PLANETS: PlanetData[] = [
  { name: "Mercurio", periodDays: 87.969, a: 0.387 },
  { name: "Venere", periodDays: 224.701, a: 0.723 },
  { name: "Terra", periodDays: 365.25, a: 1.0 },
  { name: "Marte", periodDays: 686.98, a: 1.524 },
  { name: "Giove", periodDays: 4332.589, a: 5.203 },
  { name: "Saturno", periodDays: 10759.22, a: 9.537 },
  { name: "Urano", periodDays: 30685.4, a: 19.19 },
  { name: "Nettuno", periodDays: 60189, a: 30.07 },
];

export const EARTH_YEAR_DAYS = 365.25;
const DAY_MS = 86400000;

export type YMD = { y: number; m: number; d: number };

export function parseDateInput(value: string): YMD | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (y < 1800) return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return { y, m, d };
}

export function localToday(now: Date = new Date()): YMD {
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

export function toInputValue({ y, m, d }: YMD): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function daysBetween(from: YMD, to: YMD): number {
  return (Date.UTC(to.y, to.m - 1, to.d) - Date.UTC(from.y, from.m - 1, from.d)) / DAY_MS;
}

export function ageOn(days: number, periodDays: number): number {
  return days / periodDays;
}

export function nextBirthday(birth: YMD, age: number, periodDays: number): Date {
  const whole = Math.floor(age);
  return new Date(Date.UTC(birth.y, birth.m - 1, birth.d) + (whole + 1) * periodDays * DAY_MS);
}

export function formatDateIt(date: Date): string {
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatAge(age: number): string {
  const digits = age < 1 ? 2 : 1;
  return age.toLocaleString("it-IT", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function keplerRatio(periodDays: number, a: number): number {
  const years = periodDays / EARTH_YEAR_DAYS;
  return (years * years) / (a * a * a);
}

export function logBarPercent(periodDays: number): number {
  const lo = Math.log10(PLANETS[0].periodDays);
  const hi = Math.log10(PLANETS[PLANETS.length - 1].periodDays);
  const t = (Math.log10(periodDays) - lo) / (hi - lo);
  return 6 + t * 94;
}
