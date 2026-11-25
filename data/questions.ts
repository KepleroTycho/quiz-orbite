export type Question = {
  q: string;
  options: string[];
  answer: number;
  note: string;
};

export const questions: Question[] = [
  { q: "Chi era Tycho Brahe?", options: ["Un filosofo italiano", "Un astronomo danese", "Un matematico francese", "Un fisico inglese"], answer: 1, note: "Tycho Brahe era un astronomo danese che si dedicò all'osservazione precisa del cielo." },
  { q: "Dove si trovava Uraniborg?", options: ["In Italia", "In Germania", "Sull'isola di Ven", "In Grecia"], answer: 2, note: "Uraniborg si trovava sull'isola di Ven, dove Brahe costruì un importante centro di ricerca astronomica." },
  { q: "Quale strumento utilizzava Brahe per osservare il cielo?", options: ["Il telescopio", "Il microscopio", "Grandi strumenti di misurazione angolare", "Il binocolo"], answer: 2, note: "Brahe non utilizzava telescopi, ma grandi strumenti astronomici che permettevano di misurare con precisione gli angoli delle stelle." },
  { q: "Quale astronomo sosteneva che la Terra girasse intorno al Sole?", options: ["Tycho Brahe", "Giovanni Keplero", "Aristotele", "Tolomeo"], answer: 1, note: "Giovanni Keplero era un convinto copernicano e sosteneva che la Terra, come gli altri pianeti, girasse intorno al Sole." },
  { q: "Cosa dimostrò Brahe osservando la supernova del 1572?", options: ["Che la Terra si muoveva", "Che il cielo poteva cambiare", "Che il Sole era immobile", "Che i pianeti erano stelle"], answer: 1, note: "La supernova del 1572 dimostrò che il cielo non era immutabile e perfetto, ma poteva subire cambiamenti." },
  { q: "Perché la cometa del 1577 fu importante?", options: ["Dimostrò che le comete erano pianeti", "Dimostrò che il Sole era una cometa", "Dimostrò che le sfere cristalline non esistevano", "Dimostrò che la Terra era al centro del Sole"], answer: 2, note: "La cometa del 1577 attraversò le regioni delle presunte sfere cristalline, dimostrando che queste non esistevano." },
  { q: "Quale sistema astronomico propose Brahe?", options: ["Il sistema eliocentrico", "Il sistema geocentrico tradizionale", "Il sistema ticonico", "Il sistema delle orbite ellittiche"], answer: 2, note: "Il sistema ticonico prevedeva una Terra immobile al centro, il Sole che le girava intorno e gli altri pianeti che orbitavano attorno al Sole." },
  { q: "Perché Keplero decise di abbandonare l'idea delle orbite circolari?", options: ["Perché i cerchi erano troppo difficili da calcolare", "Perché i dati di Brahe non coincidevano con le orbite circolari", "Perché Brahe gli aveva vietato di usarle", "Perché il Sole non era più al centro"], answer: 1, note: "Keplero abbandonò le orbite circolari perché non coincidevano con le osservazioni precise di Tycho Brahe." },
  { q: "Secondo la prima legge di Keplero, quale forma hanno le orbite dei pianeti?", options: ["Circolare", "Quadrata", "Ellittica", "Triangolare"], answer: 2, note: "La prima legge di Keplero stabilisce che i pianeti si muovono lungo orbite ellittiche, con il Sole in uno dei due fuochi." },
  { q: "In quale punto dell'orbita un pianeta si trova più vicino al Sole?", options: ["Afelio", "Perielio", "Equinozio", "Solstizio"], answer: 1, note: "Il perielio è il punto dell'orbita in cui un pianeta si trova più vicino al Sole, mentre l'afelio è quello più lontano." },
  { q: "Secondo la seconda legge di Keplero, quando un pianeta si muove più velocemente?", options: ["Quando è più lontano dal Sole", "Quando è più vicino al Sole", "Quando è fermo", "Quando si trova sempre nello stesso punto"], answer: 1, note: "Secondo la seconda legge di Keplero, un pianeta si muove più velocemente quando è vicino al Sole e più lentamente quando è lontano." },
  { q: "Cosa significa che un pianeta spazza aree uguali in tempi uguali?", options: ["Percorre sempre distanze uguali", "Mantiene sempre la stessa velocità", "La linea Sole-pianeta delimita superfici uguali in intervalli di tempo uguali", "Il pianeta percorre sempre un'orbita circolare"], answer: 2, note: "La seconda legge afferma che il segmento che unisce il Sole al pianeta spazza aree uguali in tempi uguali, anche se la velocità del pianeta cambia." },
  { q: "Secondo la terza legge di Keplero, quale pianeta impiega più tempo a compiere un'orbita completa?", options: ["Mercurio", "Venere", "Terra", "Saturno"], answer: 3, note: "Secondo la terza legge di Keplero, più un pianeta è lontano dal Sole, più tempo impiega a completare un'orbita. Per questo Saturno impiega più tempo di Mercurio." },
  { q: "Perché il lavoro di Brahe fu fondamentale per Keplero?", options: ["Gli insegnò a costruire telescopi", "Gli fornì osservazioni astronomiche molto precise", "Gli dimostrò che la Terra era immobile", "Gli inventò le tre leggi"], answer: 1, note: "Le osservazioni precise di Tycho Brahe furono fondamentali perché permisero a Keplero di formulare le sue leggi sul movimento dei pianeti." },
  { q: "Quale affermazione rappresenta meglio il cambiamento introdotto da Brahe e Keplero nella scienza?", options: ["Le idee filosofiche sono più importanti delle osservazioni", "Il cielo è perfetto e immutabile", "Le teorie devono essere verificate attraverso osservazioni e calcoli matematici", "I pianeti si muovono sempre a velocità costante"], answer: 2, note: "Brahe e Keplero contribuirono alla nascita della scienza moderna, dimostrando che le teorie devono basarsi su osservazioni precise e verifiche matematiche." },
];

export const BASE_POINTS = 100;
export const MAX_BONUS = 50;

export function pointsFor(correct: boolean, seconds: number) {
  if (!correct) return 0;
  const t = Math.min(Math.max(seconds, 0), 600);
  const bonus = Math.round(MAX_BONUS * Math.min(1, Math.max(0, 1 - (t - 5) / 15)));
  return BASE_POINTS + bonus;
}
