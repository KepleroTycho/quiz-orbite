export const AU_KM = 149597870.7;
export const SUN_RADIUS_KM = 695700;
export const LIGHT_SECONDS_PER_AU = 499.005;
export const MOON_DIAMETER_DEG = 0.518;
export const FIELD_DEG = 4;
export const D_MIN = 0.3;
export const D_MAX = 31;

export type SunPlanet = { name: string; a: number; e: number; color: string };

export const SUN_PLANETS: SunPlanet[] = [
  { name: "Mercurio", a: 0.38709927, e: 0.20563593, color: "#9a8f87" },
  { name: "Venere", a: 0.72333566, e: 0.00677672, color: "#e7c98f" },
  { name: "Terra", a: 1.00000261, e: 0.01671123, color: "#3f7fd0" },
  { name: "Marte", a: 1.52371034, e: 0.0933941, color: "#c1522a" },
  { name: "Giove", a: 5.202887, e: 0.04838624, color: "#d9b38c" },
  { name: "Saturno", a: 9.53667594, e: 0.05386179, color: "#e6d3a3" },
  { name: "Urano", a: 19.18916464, e: 0.04725744, color: "#9fdfe3" },
  { name: "Nettuno", a: 30.06992276, e: 0.00859048, color: "#4a66e0" },
];

export function angularDiameterDeg(dAU: number): number {
  return (2 * Math.atan(SUN_RADIUS_KM / (dAU * AU_KM)) * 180) / Math.PI;
}

export const EARTH_DIAMETER_DEG = angularDiameterDeg(1);

export function sliderToDistance(s: number): number {
  return D_MIN * Math.pow(D_MAX / D_MIN, s);
}

export function distanceToSlider(d: number): number {
  return Math.log(d / D_MIN) / Math.log(D_MAX / D_MIN);
}

export function lightSeconds(dAU: number): number {
  return dAU * LIGHT_SECONDS_PER_AU;
}

export function lightRatio(dAU: number): number {
  return 1 / (dAU * dAU);
}

export function lightBarPercent(dAU: number): number {
  const v = (Math.log10(lightRatio(dAU)) + 3.5) / 4.5;
  return Math.min(1, Math.max(0.02, v)) * 100;
}

export function perihelion(p: SunPlanet): number {
  return p.a * (1 - p.e);
}

export function aphelion(p: SunPlanet): number {
  return p.a * (1 + p.e);
}

export function annualVariationPercent(p: SunPlanet): number {
  return (aphelion(p) / perihelion(p) - 1) * 100;
}

export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s} s`;
  if (s < 3600) {
    const m = Math.floor(s / 60);
    return `${m} min ${s - m * 60} s`;
  }
  const h = Math.floor(s / 3600);
  const m = Math.round((s - h * 3600) / 60);
  return `${h} h ${m} min`;
}

export function fmt(n: number, digits: number): string {
  return n.toLocaleString("it-IT", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtLight(r: number): string {
  if (r >= 10) return fmt(r, 1);
  if (r >= 1) return fmt(r, 2);
  if (r >= 0.1) return fmt(r, 2);
  if (r >= 0.01) return fmt(r, 3);
  return fmt(r, 4);
}

export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
