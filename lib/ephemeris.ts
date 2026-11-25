/*
 * Posizioni dei pianeti: metodo NASA/JPL "Approximate Positions of the Planets" (E. M. Standish),
 * elementi validi per il periodo 1800-2050. Funzioni pure, nessuna dipendenza dall'interfaccia.
 *
 * Casi di verifica (tolleranza 0,002 UA), 1 gennaio 2000 ore 12 UT (JD 2451545,0):
 *   Mercurio x=-0.1301 y=-0.4473 r=0.4665    Venere  x=-0.7183 y=-0.0327 r=0.7202
 *   Terra    x=-0.1772 y= 0.9672 r=0.9833    Marte   x= 1.3907 y=-0.0134 r=1.3912
 *   Giove    x= 3.9983 y= 2.9457 r=4.9673    Saturno x= 6.4148 y= 6.5457 r=9.1723
 *   Urano    x=14.4255 y=-13.7376 r=19.9217  Nettuno x=16.8048 y=-24.9927 r=30.1173
 *   Terra: longitudine eliocentrica 100,38 gradi; velocita 30,29 km/s
 * 15 marzo 2010: Terra x=-0.9902 y=0.0927 (v=29,95 km/s); Marte x=-1.4315 y=0.8483
 * 27 agosto 2003: distanza 3D Terra-Marte circa 0,373 UA
 */

export const AU_KM = 149597870.7;
export const GM_KM3_S2 = 1.32712440018e11;
export const LIGHT_SECONDS_PER_AU = 499.005;

export type Elements = [number, number, number, number, number, number];

export type EphemPlanet = { name: string; color: string; base: Elements; rate: Elements };

export const EPHEM_PLANETS: EphemPlanet[] = [
  {
    name: "Mercurio",
    color: "#9a8f87",
    base: [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593],
    rate: [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
  },
  {
    name: "Venere",
    color: "#e7c98f",
    base: [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255],
    rate: [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418],
  },
  {
    name: "Terra",
    color: "#3f7fd0",
    base: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0],
    rate: [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0],
  },
  {
    name: "Marte",
    color: "#c1522a",
    base: [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
    rate: [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
  },
  {
    name: "Giove",
    color: "#d9b38c",
    base: [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
    rate: [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
  },
  {
    name: "Saturno",
    color: "#e6d3a3",
    base: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
    rate: [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
  },
  {
    name: "Urano",
    color: "#9fdfe3",
    base: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503],
    rate: [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589],
  },
  {
    name: "Nettuno",
    color: "#4a66e0",
    base: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574],
    rate: [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664],
  },
];

const RAD = Math.PI / 180;

export type Position = {
  T: number;
  a: number;
  e: number;
  I: number;
  L: number;
  W: number;
  N: number;
  omega: number;
  M: number;
  E: number;
  xp: number;
  yp: number;
  x: number;
  y: number;
  z: number;
  r: number;
  rxy: number;
  lon: number;
};

export function julianDay(year: number, month: number, day: number, hour = 0): number {
  return Date.UTC(year, month - 1, day, hour) / 86400000 + 2440587.5;
}

export function centuries(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

export function normalize360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

export function wrap180(deg: number): number {
  const r = normalize360(deg);
  return r > 180 ? r - 360 : r;
}

export function solveKepler(mDeg: number, e: number): number {
  const eStar = e * (180 / Math.PI);
  let E = mDeg + eStar * Math.sin(mDeg * RAD);
  for (let i = 0; i < 50; i++) {
    const dM = mDeg - (E - eStar * Math.sin(E * RAD));
    const dE = dM / (1 - e * Math.cos(E * RAD));
    E += dE;
    if (Math.abs(dE) < 1e-6) break;
  }
  return E;
}

function toEcliptic(omegaDeg: number, nDeg: number, iDeg: number, xp: number, yp: number) {
  const co = Math.cos(omegaDeg * RAD);
  const so = Math.sin(omegaDeg * RAD);
  const cn = Math.cos(nDeg * RAD);
  const sn = Math.sin(nDeg * RAD);
  const ci = Math.cos(iDeg * RAD);
  const si = Math.sin(iDeg * RAD);
  return {
    x: (co * cn - so * sn * ci) * xp + (-so * cn - co * sn * ci) * yp,
    y: (co * sn + so * cn * ci) * xp + (-so * sn + co * cn * ci) * yp,
    z: so * si * xp + co * si * yp,
  };
}

export function positionAt(index: number, jd: number): Position {
  const p = EPHEM_PLANETS[index];
  const T = centuries(jd);
  const [a, e, I, L, W, N] = p.base.map((v, k) => v + p.rate[k] * T);
  const omega = W - N;
  const M = wrap180(L - W);
  const E = solveKepler(M, e);
  const xp = a * (Math.cos(E * RAD) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E * RAD);
  const { x, y, z } = toEcliptic(omega, N, I, xp, yp);
  return {
    T,
    a,
    e,
    I,
    L,
    W,
    N,
    omega,
    M,
    E,
    xp,
    yp,
    x,
    y,
    z,
    r: Math.sqrt(x * x + y * y + z * z),
    rxy: Math.sqrt(x * x + y * y),
    lon: normalize360(Math.atan2(y, x) / RAD),
  };
}

export function orbitPoints(index: number, jd: number, count = 180): { x: number; y: number }[] {
  const p = EPHEM_PLANETS[index];
  const T = centuries(jd);
  const [a, e, I, , W, N] = p.base.map((v, k) => v + p.rate[k] * T);
  const omega = W - N;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i <= count; i++) {
    const E = (360 * i) / count;
    const xp = a * (Math.cos(E * RAD) - e);
    const yp = a * Math.sqrt(1 - e * e) * Math.sin(E * RAD);
    const { x, y } = toEcliptic(omega, N, I, xp, yp);
    out.push({ x, y });
  }
  return out;
}

export function speedKmS(rAU: number, aAU: number): number {
  return Math.sqrt(GM_KM3_S2 * (2 / (rAU * AU_KM) - 1 / (aAU * AU_KM)));
}

export type OrbitPhase = "perihelion" | "middle" | "aphelion";

export function orbitPhase(r: number, a: number, e: number): OrbitPhase {
  const q = a * (1 - e);
  const Q = a * (1 + e);
  const t = (r - q) / (Q - q);
  if (t < 0.25) return "perihelion";
  if (t > 0.75) return "aphelion";
  return "middle";
}

export function distance3D(p: Position, q: Position): number {
  return Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2);
}
