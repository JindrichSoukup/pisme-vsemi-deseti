/**
 * Výpočet výkonu. Čisté funkce bez DOM, aby se daly testovat v Node.
 *
 * V češtině se rychlost psaní tradičně měří v úhozech za minutu (ÚPM),
 * ne ve slovech za minutu. Jeden úhoz = jedno stisknutí klávesy včetně mezery.
 */

import { keyForChar, FINGERS } from './keyboard.js';

/** Práh přesnosti pro jednotlivé hvězdičky. */
const STAR_ACCURACY = [0.9, 0.95, 0.98];

/**
 * Souhrn jednoho cvičení.
 * @param {object} a
 * @param {number} a.typed      kolik znaků se celkem odepsalo (úhozy)
 * @param {number} a.errors     kolik z nich bylo napoprvé špatně
 * @param {number} a.durationMs jak dlouho psaní trvalo
 * @param {number} a.targetCpm  cílová rychlost lekce
 */
export function computeResult({ typed, errors, durationMs, targetCpm = 0 }) {
  const minutes = Math.max(durationMs, 1) / 60000;
  const cpm = Math.round(typed / minutes);
  const accuracy = typed > 0 ? Math.max(0, (typed - errors) / typed) : 0;
  const netCpm = Math.round(cpm * accuracy);
  return {
    typed,
    errors,
    durationMs,
    cpm,
    netCpm,
    accuracy,
    stars: starsFor(accuracy, netCpm, targetCpm),
  };
}

/**
 * Hvězdičky za lekci. Přesnost je vždy důležitější než rychlost, třetí hvězda
 * se dá získat teprve tehdy, když je zvládnutá i cílová rychlost lekce.
 */
export function starsFor(accuracy, netCpm, targetCpm = 0) {
  if (accuracy >= STAR_ACCURACY[2] && (targetCpm <= 0 || netCpm >= targetCpm)) return 3;
  if (accuracy >= STAR_ACCURACY[1]) return 2;
  if (accuracy >= STAR_ACCURACY[0]) return 1;
  return 0;
}

/**
 * Ze záznamu úhozů udělá statistiku po klávesách.
 * @param {Array<{char:string, ok:boolean, latency:number}>} log
 */
export function summarizeKeys(log) {
  const out = {};
  for (const ev of log) {
    const ch = ev.char;
    if (!ch) continue;
    const s = out[ch] || (out[ch] = { presses: 0, errors: 0, _lat: 0, _latN: 0 });
    s.presses += 1;
    if (!ev.ok) s.errors += 1;
    // do průměru reakční doby počítáme jen správné úhozy, chyby jsou jinak dlouhé
    if (ev.ok && ev.latency > 0 && ev.latency < 5000) {
      s._lat += ev.latency;
      s._latN += 1;
    }
  }
  for (const s of Object.values(out)) {
    s.meanLatency = s._latN ? Math.round(s._lat / s._latN) : 0;
    delete s._lat;
    delete s._latN;
  }
  return out;
}

/**
 * Nejslabší klávesy z dlouhodobých statistik profilu.
 * Skóre kombinuje chybovost a pomalost, počítají se jen dostatečně procvičené klávesy.
 */
export function weakestKeys(keyStats, limit = 10, minPresses = 20) {
  const rows = Object.entries(keyStats || {})
    .filter(([ch, s]) => s.presses >= minPresses && ch !== ' ')
    .map(([ch, s]) => {
      const errRate = s.errors / s.presses;
      const slowness = Math.min(1, (s.latencyEma || 0) / 900);
      return { char: ch, errRate, latency: s.latencyEma || 0, presses: s.presses, score: errRate * 3 + slowness };
    });
  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, limit);
}

/**
 * Rytmus psaní: kam padají pauzy.
 *
 * Výzkum opisu ukazuje, že rytmus zkušeného pisatele není rovnoměrný.
 * Dvojice psaná střídavě oběma rukama je rychlejší než dvojice jednou rukou
 * a nejpomalejší je dvojice na jeden prst. Měřit se proto musí po druzích
 * přechodu, ne jedním průměrem, jinak se rozdíly navzájem vyruší.
 *
 * Zvlášť se sleduje hranice slov. Tam podle Salthouse padá plánování dalšího
 * slova, takže se tam u začátečníka schová pauza, která se v průměru ztratí.
 */
const IDLE_STROKE = 5000;

/** Do které skupiny patří přechod z předchozího úhozu na tenhle. */
export function strokeClass(prev, cur, layout = 'cs-qwertz') {
  if (!cur) return 'jiné';
  if (!prev || prev.line !== cur.line) return 'začátek řádku';
  if (cur.char === ' ') return 'konec slova';
  if (prev.char === ' ') return 'začátek slova';

  const a = keyForChar(String(prev.char).toLowerCase(), layout);
  const b = keyForChar(String(cur.char).toLowerCase(), layout);
  if (!a || !b) return 'jiné';
  if (b.dead) return 'háček nebo čárka';
  if (cur.char !== cur.char.toLowerCase()) return 'velké písmeno';
  if (a.finger === b.finger) return 'stejný prst';

  const handA = (FINGERS[a.finger] || {}).hand;
  const handB = (FINGERS[b.finger] || {}).hand;
  if (!handA || !handB) return 'jiné';
  return handA === handB ? 'stejná ruka' : 'střídání rukou';
}

/**
 * Rozebere jedno cvičení. Za zaváhání se počítá úhoz pomalejší než dvojnásobek
 * mediánu toho samého cvičení. Práh je vlastní, ne absolutní: u pomalého
 * začátečníka by pevná hranice označila skoro všechno.
 */
export function rhythmSummary(keyLog, layout = 'cs-qwertz') {
  const usable = (keyLog || []).filter((k) => k.latency > 0 && k.latency < IDLE_STROKE);
  if (!usable.length) return null;

  const sorted = usable.map((k) => k.latency).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const limit = median * 2;

  const classes = {};
  for (let i = 0; i < keyLog.length; i++) {
    const k = keyLog[i];
    if (!(k.latency > 0 && k.latency < IDLE_STROKE)) continue;
    const cls = strokeClass(keyLog[i - 1], k, layout);
    const s = classes[cls] || (classes[cls] = { strokes: 0, sumMs: 0, slow: 0, errors: 0 });
    s.strokes += 1;
    s.sumMs += Math.round(k.latency);
    if (k.latency > limit) s.slow += 1;
    if (!k.ok) s.errors += 1;
  }
  return { median: Math.round(median), strokes: usable.length, classes };
}

/**
 * Souhrn podle druhu cvičení, nejslabší napřed.
 *
 * Průměr za celou lekci míchá rozcvičku, nácvik kláves i věty dohromady,
 * takže se v něm ztratí, co dře. Tady je každý druh zvlášť.
 *
 * Řadí se podle přesnosti, protože ta je v celém programu nadřazená
 * rychlosti. Při shodě rozhoduje pomalejší druh.
 */
export function kindSummary(profile) {
  const rows = Object.entries(profile.kindStats || {}).map(([kind, s]) => {
    const minutes = s.durationMs / 60000;
    const netCpm = minutes > 0 ? Math.round(Math.max(0, s.keystrokes - s.errors) / minutes) : 0;
    const accuracy = s.keystrokes > 0 ? Math.max(0, (s.keystrokes - s.errors) / s.keystrokes) : 0;
    return {
      kind,
      runs: s.runs || 0,
      keystrokes: s.keystrokes || 0,
      errors: s.errors || 0,
      minutes,
      netCpm,
      accuracy,
      trend: trendOf(s.recent || []),
      lastAt: s.lastAt || null,
    };
  });

  return rows.sort((a, b) => a.accuracy - b.accuracy || a.netCpm - b.netCpm);
}

/**
 * Kam se druh cvičení ubírá: porovná se první a druhá polovina posledních
 * měření. Pod čtyři měření se trend neurčuje, to by byl jen šum.
 */
export function trendOf(recent) {
  if (!Array.isArray(recent) || recent.length < 4) return 0;
  const half = Math.floor(recent.length / 2);
  const avg = (list) => list.reduce((a, b) => a + b, 0) / list.length;
  const before = avg(recent.slice(0, half));
  const after = avg(recent.slice(-half));
  if (before <= 0) return 0;
  return Math.round(((after - before) / before) * 100);
}

/** Váhy pro adaptivní výběr: slabší klávesy dostanou vyšší číslo. */
export function keyWeights(keyStats, chars) {
  const w = new Map();
  for (const ch of chars) {
    const s = (keyStats || {})[ch];
    if (!s || s.presses < 10) {
      w.set(ch, 1.4); // málo procvičené si taky zaslouží pozornost
      continue;
    }
    const errRate = s.errors / s.presses;
    const slowness = Math.min(1, (s.latencyEma || 0) / 900);
    w.set(ch, 1 + errRate * 4 + slowness * 0.8);
  }
  return w;
}

/**
 * Jak rychle dítě v poslední době píše, v úhozech za minutu.
 * Bere se pár posledních celých pokusů, protože podle nich jde odhadnout,
 * jak dlouho mu bude trvat zbytek lekce. Vrací 0, když ještě není z čeho.
 */
export function recentSpeed(profile, howMany = 5) {
  const attempts = Object.values(profile.lessons || {})
    .flatMap((rec) => rec.attempts || [])
    .filter((a) => !a.partial && a.netCpm > 0)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, howMany);
  if (!attempts.length) return 0;
  return Math.round(attempts.reduce((n, a) => n + a.netCpm, 0) / attempts.length);
}

/**
 * Kolik cvičení a minut zbývá do konce lekce.
 * Délka řádku se počítá odhadem, přesné znění se losuje až při vykreslení.
 */
export function remainingWork(lesson, fromStep, speed) {
  const steps = Math.max(0, lesson.steps.length - fromStep);
  const chars = lesson.steps
    .slice(fromStep)
    .reduce((n, s) => n + (s.lines || 3) * CHARS_PER_LINE, 0);
  const perMinute = Math.max(20, speed || Math.round(lesson.targetCpm * 0.6));
  return { steps, chars, minutes: Math.max(1, Math.round(chars / perMinute)) };
}

/** Průměrná délka řádku ve cvičení. Používá se jen pro odhad času. */
const CHARS_PER_LINE = 52;

/* ------------------------------------------------------------ formátování */

export function pct(x) {
  return Math.round((x || 0) * 100) + ' %';
}

/** Sekundy na tvar "3 min 20 s" nebo "45 s". */
export function humanDuration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return s + ' s';
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return rest ? `${m} min ${rest} s` : `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}

/** Kolik dní po sobě se cvičilo, počítáno zpět od dneška. */
export function currentStreak(days, todayStr = new Date().toLocaleDateString('sv-SE')) {
  let streak = 0;
  const d = new Date(todayStr + 'T12:00:00');
  // dnešek se nepočítá jako přerušení, když se ještě necvičilo
  if (!days[todayStr]) d.setDate(d.getDate() - 1);
  for (;;) {
    const key = d.toLocaleDateString('sv-SE');
    if (!days[key] || !days[key].seconds) break;
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
