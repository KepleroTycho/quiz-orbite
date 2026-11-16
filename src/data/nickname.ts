const BAD = [
  "cazzo", "cazz", "merda", "merd", "stronz", "minchia", "troia", "puttan", "zoccol", "bastard",
  "coglion", "vaffa", "fanculo", "culo", "culi", "pompin", "sborr", "segaiol", "pirla", "rincoglion",
  "ricchion", "frocio", "finocchio", "negro", "negra", "mongol", "handicappat", "scemo", "idiota", "cretin",
  "imbecil", "deficient", "porco", "porca", "madonna", "gesu", "bestemm", "mignotta", "troie",
  "fuck", "fck", "shit", "bitch", "asshole", "bastard", "dick", "cock", "pussy", "cunt", "whore", "slut", "nigg",
  "fagg", "retard", "stupro", "nazi", "hitler", "fascis", "pedofil", "terron", "sesso", "porn",
  "admin", "moderator",
];

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/0/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1+/g, "$1");
}

export function nicknameKey(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isOffensive(nick: string) {
  const n = normalize(nick);
  if (!n) return false;
  return BAD.some((w) => n.includes(normalize(w)));
}
