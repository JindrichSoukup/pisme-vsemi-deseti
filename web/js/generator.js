/**
 * Skládá text jednotlivých cvičení.
 *
 * Pravidlo, které platí všude: v textu se smí objevit jen znak, který už byl
 * v některé předchozí lekci vysvětlený. Slova a věty se proto filtrují podle
 * množiny povolených znaků. Kromě toho se přednostně vybírá to, co obsahuje
 * nová písmena lekce a klávesy, které jdou uživateli nejhůř.
 */

import { keyWeights } from './stats.js';
import { keyForChar, FINGERS } from './keyboard.js';

const VOWELS = 'aeiouyáéíóúůýě';

/** Šířka řádku ve znacích. Slova a věty snesou víc, nácvik kláves míň. */
const LINE_WIDTH = 68;
const DRILL_WIDTH = 60;

let CONTENT = { words: [], sentences: [], texts: [], wordsEn: [], sentencesEn: [], themes: {} };

/** Načte slovník, věty a texty. Volá se jednou při startu aplikace. */
export async function loadContent() {
  const files = [
    'words-cs.json', 'sentences-cs.json', 'texts-cs.json',
    'words-en.json', 'sentences-en.json', 'themes-cs.json', 'themes-en.json',
  ];
  const [words, sentences, texts, wordsEn, sentencesEn, themesCs, themesEn] = await Promise.all(
    files.map((f) => fetch('content/' + f).then((r) => r.json()))
  );
  CONTENT = { words, sentences, texts, wordsEn, sentencesEn, themes: { ...themesCs, ...themesEn } };
  return CONTENT;
}

/** Pro testy v Node, kde fetch na relativní cestu nefunguje. */
export function setContent(content) {
  CONTENT = { words: [], sentences: [], texts: [], wordsEn: [], sentencesEn: [], themes: {}, ...content };
}

/* ---------------------------------------------------------- pomocné věci */

function fits(str, allowed) {
  for (const ch of str) if (!allowed.has(ch)) return false;
  return true;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Náhodný výběr s vahami. weightFn vrací kladné číslo. */
function weightedPick(items, weightFn) {
  let total = 0;
  const w = items.map((it) => {
    const x = Math.max(0.0001, weightFn(it));
    total += x;
    return x;
  });
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= w[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Poskládá kousky do řádků o zhruba stejné šířce.
 * Seznam se nikdy neopakuje dokola, jinak by se na přelomu potkala dvě
 * stejná slova vedle sebe. Volající proto musí dodat dost kousků.
 */
function packLines(pieces, lines, width = LINE_WIDTH) {
  const out = [];
  let cur = '';
  let prev = null;
  for (const piece of pieces) {
    if (out.length >= lines) break;
    if (piece === prev) continue;
    prev = piece;
    if (!cur) cur = piece;
    else if (cur.length + 1 + piece.length <= width) cur += ' ' + piece;
    else {
      out.push(cur);
      cur = piece;
    }
  }
  if (cur && out.length < lines) out.push(cur);
  return out;
}

/* ------------------------------------------------------------ jednotlivé druhy */

/** Prostřídá dva seznamy: první, druhý, první, druhý. */
function interleave(a, b) {
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

/**
 * Zopakuje skupinku vedle sebe, dokud se vejde na řádek.
 * Počet opakování je omezený, protože patnáctkrát za sebou totéž je otrava.
 * Delší a pestřejší skupinka tím pádem zabere celý řádek, krátká jen kus.
 */
function fillRow(group, width = DRILL_WIDTH, maxParts = 9) {
  const parts = [];
  let len = -1;
  while (len + 1 + group.length <= width && parts.length < maxParts) {
    parts.push(group);
    len += 1 + group.length;
  }
  return parts.join(' ');
}

/**
 * Slábnoucí skupinky: fff fff ff ff f f
 *
 * Takhle to má klasická učebnice psaní a má to důvod. Skupinky se postupně
 * zkracují, takže mezerník přichází čím dál častěji a prst se musí čím dál
 * častěji vracet do základní polohy. Kdyby řádek byl jen "fff fff fff...",
 * cvičil by se jeden pohyb dokola, ale návrat domů skoro vůbec.
 */
function descend(key) {
  return [key.repeat(3), key.repeat(3), key.repeat(2), key.repeat(2), key, key].join(' ');
}

/** Totéž pro dvojici: fff jjj ff jj f j */
function descendPair(a, b) {
  return [a.repeat(3), b.repeat(3), a.repeat(2), b.repeat(2), a, b].join(' ');
}

/**
 * Nácvik nových kláves. Postupuje se jako v učebnici: nejdřív jedno písmeno
 * pořád dokola, aby si prst zapamatoval cestu, potom střídání obou rukou.
 * Není to náhodné, protože nácvik hmatu má být předvídatelný.
 *
 * @param phase 0 = opakování jednoho písmene, 1 = střídání
 */
function buildLetters(newKeys, lines, allowed, phase = 0, offset = 0) {
  const fresh = newKeys.filter((k) => k.length === 1);
  let keys = fresh.length ? fresh.slice() : ['f', 'j'];

  // u lekce s jediným novým písmenem se střídá se známými, jinak by řádek
  // byl jen jedno písmeno donekonečna
  if (keys.length === 1 && allowed) {
    const partners = ['j', 'f', 'a', 'k', 'd', 's', 'l']
      .filter((c) => allowed.has(c) && c !== keys[0]);
    keys = keys.concat(partners.slice(0, 2));
  }

  const drilled = fresh.length === 1 ? [keys[0]] : keys;
  const [a, b, c] = keys;

  // 1. každé nové písmeno samostatně, ve slábnoucích skupinkách
  const repetition = drilled.map((k) => fillRow(descend(k)));
  if (b) repetition.push(fillRow(descendPair(a, b)));

  // 2. střídání rukou. V každém řádku jsou dvě obměny, ne jedna dokola,
  //    jinak je z toho patnáctkrát totéž a dítě to odjede bez přemýšlení.
  const alternation = [];
  if (b) {
    alternation.push(
      fillRow(`${a + b} ${b + a}`),
      fillRow(`${a + b + a} ${b + a + b}`),
      fillRow(`${a + a + b} ${b + b + a}`)
    );
    if (c) alternation.push(fillRow(`${a + c} ${c + a}`), fillRow(`${a + b + c} ${c + b + a}`));
  }

  // Fáze říká, na čem cvičení stojí: opakování, střídání, nebo obojí zamíchané.
  // Nepočítá se z pořadí kroku, protože pak by dvě lekce se stejným počtem
  // kroků daly stejný text a rozcvička na začátku by všechno posunula.
  let pool;
  if (phase === 0) pool = repetition.concat(alternation);
  else if (phase === 1) pool = alternation.concat(repetition);
  else pool = interleave(alternation, repetition);
  if (!pool.length) return [fillRow(keys[0].repeat(3))];

  const out = [];
  for (let i = 0; i < lines; i++) out.push(pool[(offset + i) % pool.length]);
  return out;
}

/** Domovská klávesa každého prstu. Odsud vyráží a sem se vrací. */
const HOME_OF = { lp: 'a', lr: 's', lm: 'd', li: 'f', ri: 'j', rm: 'k', rr: 'l', rp: 'ů' };

/**
 * Natažení a návrat: frf juj, fgf jhj, dcd k,k
 *
 * Nejčastější chyba začátečníka není špatná klávesa, ale to, že se za prstem
 * posune celá ruka a nevrátí se zpátky. Pak je další písmeno o jedno vedle.
 * Sevření mezi domovskou klávesou nutí prst vrátit se hned, ještě než se ruka
 * stihne posunout. Ve starých učebnicích psaní je tenhle chvat u každé klávesy,
 * pro kterou se prst natahuje mimo základní řadu.
 */
function buildReach(newKeys, lines, layout = 'cs-qwertz') {
  const rows = [];
  const units = [];
  for (const key of newKeys.filter((k) => k.length === 1)) {
    const info = keyForChar(key, layout);
    if (!info || info.dead || info.shift) continue;
    const home = HOME_OF[info.finger];
    if (!home || home === key) continue;
    const unit = home + key + home;
    units.push(unit);
    // za sevřením ještě samotná domovská klávesa, ať se návrat opravdu dokončí
    rows.push(fillRow(`${unit} ${home}${home}`));
  }
  if (!rows.length) return null;
  // obě ruce hned za sebou, ať se návrat cvičí na obou najednou
  if (units.length >= 2) rows.push(fillRow(units[0] + ' ' + units[1]));
  const out = [];
  for (let i = 0; i < lines; i++) out.push(rows[i % rows.length]);
  return out;
}

/** Pořadí základní řady tak, jak se učí: od ukazováčků ven. */
const HOME_ORDER = ['f', 'j', 'd', 'k', 's', 'l', 'a', 'ů', 'g', 'h'];

/**
 * Rozcvička na začátek lekce, tedy krátké připomenutí toho, co už dítě umí,
 * ještě než přijde nová klávesa. Přesně takhle začíná lekce v klasické
 * učebnici: nejdřív celá základní řada, pak sevření dřív naučených kláves.
 */
function buildWarmup(newKeys, allowed, lines, layout = 'cs-qwertz') {
  const known = [...allowed].filter((c) => !newKeys.includes(c));
  const rows = [];

  // stačí dvě dřív naučené klávesy, jinak by rozcvička sklouzla k novým
  const homeRow = HOME_ORDER.filter((c) => known.includes(c)).map((c) => c.repeat(3));
  if (homeRow.length >= 2) rows.push(fillRow(homeRow.join(' ')));

  // klávesy mimo základní řadu se připomenou sevřením mezi domovské úhozy,
  // pořadí v allowed je chronologické, takže na konci jsou ty nejčerstvější
  const reaches = [];
  for (const c of known) {
    if (c === ' ' || c !== c.toLowerCase()) continue;
    const info = keyForChar(c, layout);
    if (!info || info.dead || info.shift) continue;
    const home = HOME_OF[info.finger];
    if (home && home !== c) reaches.push(home + c + home);
  }
  if (reaches.length) rows.push(fillRow(reaches.slice(-4).join(' ')));

  // v úplně prvních lekcích se ještě není co ptát na natažené klávesy,
  // druhý řádek proto udělají slábnoucí skupinky ze dvou známých kláves
  if (rows.length === 1 && homeRow.length >= 2) {
    const [x, y] = HOME_ORDER.filter((c) => known.includes(c));
    rows.push(fillRow(descendPair(x, y)));
  }

  if (!rows.length) return null;
  const out = [];
  for (let i = 0; i < lines; i++) out.push(rows[i % rows.length]);
  return out;
}

/**
 * Velké písmeno ve slově, sevřené mezi domovské klávesy malíčku, který drží
 * Shift: ůůů Slon ůůů Dopis ůůů. Mezistupeň mezi holým nácvikem Shiftu
 * a volným textem, převzatý ze starých učebnic.
 *
 * @param side 'ShiftRight', 'ShiftLeft', nebo 'any' pro střídání obou
 */
function buildAnchorWords(allowed, lines, layout = 'cs-qwertz', side = 'any') {
  const usable = [];
  for (const w of CONTENT.words) {
    if (!fits(w, allowed)) continue;
    const cap = w[0].toUpperCase();
    if (!allowed.has(cap)) continue;
    const info = keyForChar(cap, layout);
    if (!info || info.dead || !info.shiftCode) continue;
    if (side !== 'any' && info.shiftCode !== side) continue;
    usable.push({
      word: cap + w.slice(1),
      anchor: info.shiftCode === 'ShiftRight' ? 'ů' : 'a',
    });
  }
  if (usable.length < 4) return null;

  const pieces = [];
  for (const item of shuffle(usable).slice(0, lines * 8)) {
    // kotva stojí před slovem, takže malíček je na Shift připravený včas
    pieces.push(item.anchor.repeat(3), item.word);
  }
  return packLines(pieces, lines);
}

/**
 * Anglická slovíčka a věty na české klávesnici.
 *
 * Nejzrádnější je prohozené Y a Z. Kdo píše anglicky na české klávesnici,
 * plete si je pořád, proto má režim "yz" vlastní krok jen se slovy, která
 * některé z nich obsahují.
 */
function buildEnglish(allowed, lines, mode = 'words') {
  if (mode === 'sentences') {
    const pool = CONTENT.sentencesEn.filter((s) => fits(s, allowed));
    return pool.length >= 3 ? shuffle(pool).slice(0, lines) : null;
  }

  let pool = CONTENT.wordsEn.filter((w) => fits(w, allowed));
  if (mode === 'yz') pool = pool.filter((w) => /[yz]/.test(w));
  if (pool.length < 6) return null;
  return packLines(shuffle(pool).slice(0, lines * 10), lines);
}

/** Tematická sada: zvířata, česká města, dny a datumy, jména. */
function buildTheme(allowed, lines, name, mode = 'words') {
  const theme = CONTENT.themes[name];
  if (!theme) return null;
  const pool = (mode === 'sentences' ? theme.sentences : theme.words)
    .filter((s) => fits(s, allowed));
  if (pool.length < 4) return null;
  if (mode === 'sentences') return shuffle(pool).slice(0, lines);
  return packLines(shuffle(pool).slice(0, lines * 10), lines);
}

/** Kterou rukou se znak píše, nebo null u složených a neznámých. */
function handOfChar(ch, layout) {
  const info = keyForChar(ch.toLowerCase(), layout);
  if (!info || info.dead) return null;
  const hand = FINGERS[info.finger] && FINGERS[info.finger].hand;
  return hand === 'L' || hand === 'R' ? hand : null;
}

/** Který prst znak píše, nebo null. */
function fingerOfChar(ch, layout) {
  const info = keyForChar(ch.toLowerCase(), layout);
  return info && !info.dead ? info.finger : null;
}

/**
 * Slova, která se celá napíšou jednou rukou.
 *
 * Druhá ruka přitom nemá co dělat, takže jí nepomůže, a jedna ruka musí
 * zvládnout celý sled sama. Je to nezvykle namáhavé a hezky se na tom pozná,
 * jestli prsty pracují samostatně, nebo se za sebou táhnou.
 */
function buildOneHand(allowed, lines, layout = 'cs-qwertz', side = 'L') {
  const words = CONTENT.words.filter(
    (w) => w.length >= 3 && fits(w, allowed) && [...w].every((c) => handOfChar(c, layout) === side)
  );

  // Když slov není dost, doplní se slabikami z písmen té samé ruky.
  // Berou se jen písmena bez háčků a čárek, jinak by z toho byla nečitelná změť.
  const letters = [...allowed].filter(
    (c) => /^[a-z]$/.test(c) && handOfChar(c, layout) === side
  );
  const vowels = letters.filter((c) => VOWELS.includes(c));
  const consonants = letters.filter((c) => !VOWELS.includes(c));

  const pieces = shuffle(words);
  const wanted = lines * 8;
  while (pieces.length < wanted && vowels.length && consonants.length) {
    const g = Math.random() < 0.7
      ? pick(consonants) + pick(vowels)
      : pick(consonants) + pick(vowels) + pick(consonants);
    if (g !== pieces[pieces.length - 1]) pieces.push(g);
  }
  return pieces.length ? packLines(pieces, lines) : null;
}

/**
 * Prstolamy: dvojice, kde jeden prst musí hned po sobě na dvě různé klávesy.
 *
 * Nedá se to rozdělit mezi dva prsty ani mezi ruce, takže prst musí odskočit
 * a hned trefit vedlejší klávesu. V češtině na téhle klávesnici jsou nejhorší
 * lo a ol (pravý prsteníček), ce a ec (levý prostředníček), tr a rt (levý
 * ukazováček) a ed a de (levý prostředníček). Slovo čtvrtek jich má rovnou
 * čtyři a je to nejtěžší slovo v celém slovníku.
 */
function sameFingerPairs(word, layout) {
  let n = 0;
  for (let i = 0; i + 1 < word.length; i++) {
    const a = word[i];
    const b = word[i + 1];
    if (a === b) continue;
    const fa = fingerOfChar(a, layout);
    if (fa && fa === fingerOfChar(b, layout)) n += 1;
  }
  return n;
}

function buildTwisters(allowed, lines, layout = 'cs-qwertz', mode = 'words') {
  if (mode === 'pairs') {
    // nejčastější dvojice na jeden prst, spočítané ze slovníku
    const counts = new Map();
    for (const w of CONTENT.words) {
      if (!fits(w, allowed)) continue;
      for (let i = 0; i + 1 < w.length; i++) {
        const pair = w.slice(i, i + 2);
        if (pair[0] === pair[1]) continue;
        const f = fingerOfChar(pair[0], layout);
        if (f && f === fingerOfChar(pair[1], layout)) {
          counts.set(pair, (counts.get(pair) || 0) + 1);
        }
      }
    }
    // lo a ol je tentýž zádrhel z obou stran, patří na jeden řádek
    const seen = new Set();
    const rows = [];
    for (const [pair] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
      const key = [...pair].sort().join('');
      if (seen.has(key)) continue;
      seen.add(key);
      const back = pair[1] + pair[0];
      rows.push(fillRow(`${pair} ${back} ${pair} ${back}`));
      if (rows.length >= lines) break;
    }
    return rows.length ? rows : null;
  }

  const scored = CONTENT.words
    .filter((w) => fits(w, allowed))
    .map((w) => [w, sameFingerPairs(w, layout)])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  if (scored.length < 6) return null;
  return packLines(shuffle(scored.slice(0, lines * 10)).map(([w]) => w), lines);
}

/**
 * Zamíchané skupinky ze všech dosud probraných písmen, s důrazem na ta nová.
 *
 * Tohle je třetí a nejtěžší stupeň nácviku. Zatímco opakování jednoho písmene
 * a pravidelné střídání se dají odjet zpaměti, tady dopředu nevíš, co přijde,
 * a prst musí najít klávesu sám. Výzkum motorického učení ukazuje, že
 * zamíchané pořadí se hůř zvládá při nácviku, ale mnohem líp se pamatuje.
 * Proto přichází až po předvídatelných vzorcích, ne místo nich.
 */
function buildMixedKeys(newKeys, allowed, lines) {
  const fresh = newKeys.filter((k) => k.length === 1);
  const pool = [...allowed].filter((c) => c !== ' ' && /\p{L}/u.test(c) && c === c.toLowerCase());
  if (pool.length < 2) return buildLetters(newKeys, lines, allowed, 1);

  const weight = (c) => (fresh.includes(c) ? 3 : 1);
  const groups = [];
  for (let i = 0; i < 120; i++) {
    const len = 2 + Math.floor(Math.random() * 2);
    let g = '';
    for (let k = 0; k < len; k++) {
      let ch = weightedPick(pool, weight);
      // stejné písmeno třikrát po sobě už bylo v prvním cvičení
      let guard = 0;
      while (g.length >= 2 && ch === g[g.length - 1] && ch === g[g.length - 2] && guard++ < 5) {
        ch = weightedPick(pool, weight);
      }
      g += ch;
    }
    // skupinka má obsahovat aspoň jedno nové písmeno, jinak se nic nenacvičí
    if (fresh.length && ![...g].some((c) => fresh.includes(c))) continue;
    if (g !== groups[groups.length - 1]) groups.push(g);
  }
  return packLines(groups, lines, DRILL_WIDTH);
}

/**
 * Nácvik Shiftu. Kromě dvojice "malé a velké" se cvičí i sevření mezi
 * domovskou klávesou malíčku, který Shift drží: ůAů, ůSů. Tenhle chvat
 * pochází ze starých učebnic a nutí malíček vrátit se po Shiftu domů.
 */
function buildShiftPairs(newKeys, lines, layout = 'cs-qwertz') {
  const caps = newKeys.filter((k) => k.length === 1 && k !== k.toLowerCase());
  if (!caps.length) return buildLetters(newKeys, lines, null, 0);

  const groups = [];
  for (const cap of caps) {
    groups.push(cap.toLowerCase() + cap);
    const info = keyForChar(cap, layout);
    // Shift drží malíček opačné ruky, jeho domovská klávesa dělá sevření
    const anchor = info && info.shiftCode === 'ShiftRight' ? 'ů' : 'a';
    groups.push(anchor + cap + anchor);
  }
  const rows = shuffle(groups).concat(shuffle(groups), shuffle(groups));
  return packLines(rows, lines, DRILL_WIDTH);
}

/**
 * Velká písmena střídavě oběma rukama. Dvě velká za sebou z opačných stran
 * znamenají, že se musí prohodit i ruka, která drží Shift. To je nejtěžší
 * část práce se Shiftem a hotové kurzy na ni mají zvláštní cvičení.
 */
function buildShiftMix(allowed, lines, layout = 'cs-qwertz') {
  const caps = [...allowed].filter((c) => c.length === 1 && /\p{Lu}/u.test(c));
  const left = [];
  const right = [];
  for (const c of caps) {
    const info = keyForChar(c, layout);
    if (!info || info.dead) continue;
    (info.shiftCode === 'ShiftRight' ? left : right).push(c);
  }
  if (!left.length || !right.length) return null;

  const groups = [];
  for (let i = 0; i < 120; i++) {
    const l = pick(left);
    const r = pick(right);
    const g = Math.random() < 0.5 ? l + r : r + l;
    if (g !== groups[groups.length - 1]) groups.push(g);
  }
  return packLines(groups, lines, DRILL_WIDTH);
}

/** Slabiky složené z povolených souhlásek a samohlásek. */
function buildSyllables(newKeys, allowed, lines, offset = 0) {
  const chars = [...allowed].filter((c) => c !== ' ' && c === c.toLowerCase());
  const vowels = chars.filter((c) => VOWELS.includes(c));
  const consonants = chars.filter((c) => !VOWELS.includes(c) && /\p{L}/u.test(c));
  if (!vowels.length || !consonants.length) return buildLetters(newKeys, lines, allowed, 1, offset);

  const isNew = (c) => newKeys.includes(c);
  const groups = [];
  for (let i = 0; i < 120; i++) {
    const c = weightedPick(consonants, (x) => (isNew(x) ? 4 : 1));
    const v = weightedPick(vowels, (x) => (isNew(x) ? 4 : 1));
    const g = Math.random() < 0.75 ? c + v : v + c;
    if (g !== groups[groups.length - 1]) groups.push(g);
  }
  return packLines(groups, lines, DRILL_WIDTH);
}

/** Opravdová slova, která jde z probraných písmen složit. */
function buildWords(newKeys, allowed, lines, opts = {}) {
  let pool = CONTENT.words.filter((w) => fits(w, allowed));
  // slova s velkým písmenem jdou použít jen tam, kde se to velké písmeno
  // už umí napsat: v lekci s pravým Shiftem se píší jen slova od levé ruky
  if (opts.capitalize) {
    pool = pool.filter((w) => allowed.has(w[0].toUpperCase()));
  }
  if (opts.focusOnly && newKeys.length) {
    const focused = pool.filter((w) => [...w].some((ch) => newKeys.includes(ch)));
    if (focused.length >= 8) pool = focused;
  }
  if (pool.length < 6) return buildSyllables(newKeys, allowed, lines, opts.offset || 0);

  const weights = keyWeights(opts.keyStats, [...allowed]);
  const score = (w) => {
    let s = 1;
    let hasNew = false;
    for (const ch of w) {
      s += (weights.get(ch) || 1) - 1;
      if (newKeys.includes(ch)) hasNew = true;
    }
    if (hasNew) s += 3;
    if (w.length <= 2) s *= 0.4;
    return s;
  };

  // Slova se berou v náhodném pořadí, ale každé jednou za kolo. Když je
  // slovníček malý, kolo se prostě zopakuje, jen nikdy dvakrát po sobě totéž.
  const chosen = [];
  let used = new Set();
  let last = null;
  // na řádek se vejde zhruba devět slov, ať se seznam nemusí opakovat
  const target = lines * 12;
  for (let guard = 0; guard < target * 25 && chosen.length < target; guard++) {
    if (used.size >= pool.length) used = new Set();
    const w = weightedPick(pool, score);
    if (used.has(w) || w === last) continue;
    used.add(w);
    last = w;
    chosen.push(opts.capitalize ? w[0].toUpperCase() + w.slice(1) : w);
  }
  return packLines(chosen, lines);
}

/** Celé věty. Dokud se neučila velká písmena, píší se malými. */
function buildSentences(allowed, lines, opts = {}) {
  const lower = !opts.uppercase;
  let pool = CONTENT.sentences
    .map((s) => (lower ? s.toLowerCase() : s))
    .filter((s) => fits(s, allowed));
  if (opts.punctuate) {
    const marked = pool.filter((s) => /[?!]/.test(s));
    if (marked.length >= 4) pool = marked;
  }
  if (pool.length < 3) return null;

  const out = [];
  const used = new Set();
  for (let i = 0; i < pool.length * 4 && out.length < lines; i++) {
    const s = pick(pool);
    if (used.has(s) && pool.length > lines) continue;
    used.add(s);
    out.push(s);
  }
  return out;
}

/** Číslice samostatně a pak v celých číslech. */
function buildNumbers(lines, phase = 0) {
  const groups = [];
  if (phase === 0) {
    for (let i = 0; i < 90; i++) {
      const d = String(Math.floor(Math.random() * 10));
      groups.push(d.repeat(2));
    }
  } else {
    for (let i = 0; i < 90; i++) {
      const len = 2 + Math.floor(Math.random() * 3);
      let n = String(1 + Math.floor(Math.random() * 9));
      for (let k = 1; k < len; k++) n += String(Math.floor(Math.random() * 10));
      groups.push(n);
    }
  }
  return packLines(groups, lines, DRILL_WIDTH);
}

/** Souvislý text rozdělený na řádky, které nelámou slova. */
function buildText(allowed, maxLines = 6) {
  const usable = CONTENT.texts.filter((t) => fits(t.text, allowed));
  const t = usable.length ? pick(usable) : pick(CONTENT.texts);
  const words = t.text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= LINE_WIDTH) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return { title: t.title, lines: lines.slice(0, maxLines) };
}

/* --------------------------------------------------------------- veřejné */

/**
 * Vyrobí jeden krok cvičení.
 * @returns {{label:string, lines:string[], title?:string}}
 */
export function buildStep(lesson, step, ctx, stepIndex = 0) {
  const { allowed, keyStats, uppercase, layout = 'cs-qwertz' } = ctx;
  const newKeys = lesson.newKeys || [];
  const lines = step.lines || 3;

  switch (step.kind) {
    case 'letters':
      return { label: step.label, lines: buildLetters(newKeys, lines, allowed, step.phase ?? 0, 0) };

    case 'theme': {
      const themed = buildTheme(allowed, lines, step.theme, step.mode || 'words');
      return { label: step.label, lines: themed || buildWords(newKeys, allowed, lines, { keyStats }) };
    }

    case 'english': {
      const en = buildEnglish(allowed, lines, step.mode || 'words');
      return { label: step.label, lines: en || buildWords(newKeys, allowed, lines, { keyStats }) };
    }

    case 'onehand': {
      const one = buildOneHand(allowed, lines, layout, step.side || 'L');
      return { label: step.label, lines: one || buildWords(newKeys, allowed, lines, { keyStats }) };
    }

    case 'twisters': {
      const hard = buildTwisters(allowed, lines, layout, step.mode || 'words');
      return { label: step.label, lines: hard || buildWords(newKeys, allowed, lines, { keyStats }) };
    }

    case 'warmup': {
      const warm = buildWarmup(newKeys, allowed, lines, layout);
      return { label: step.label, lines: warm || buildLetters(newKeys, lines, allowed, 0) };
    }

    case 'anchorwords': {
      const anchored = buildAnchorWords(allowed, lines, layout, step.side || 'any');
      return {
        label: step.label,
        lines: anchored || buildWords(newKeys, allowed, lines, { keyStats, capitalize: true }),
      };
    }

    case 'reach': {
      const reach = buildReach(newKeys, lines, layout);
      return { label: step.label, lines: reach || buildLetters(newKeys, lines, allowed, 1, stepIndex) };
    }

    case 'mixedkeys':
      return { label: step.label, lines: buildMixedKeys(newKeys, allowed, lines) };

    case 'shiftpairs':
      return { label: step.label, lines: buildShiftPairs(newKeys, lines, layout) };

    case 'shiftmix': {
      const mixed = buildShiftMix(allowed, lines, layout);
      return { label: step.label, lines: mixed || buildShiftPairs(newKeys, lines, layout) };
    }

    case 'syllables':
      return { label: step.label, lines: buildSyllables(newKeys, allowed, lines, stepIndex) };

    case 'words':
      return {
        label: step.label,
        lines: buildWords(newKeys, allowed, lines, {
          keyStats,
          capitalize: step.capitalize,
          focusOnly: step.focusOnly,
          offset: stepIndex,
        }),
      };

    case 'sentences': {
      const s = buildSentences(allowed, lines, { uppercase, punctuate: step.punctuate });
      return { label: step.label, lines: s || buildWords(newKeys, allowed, lines, { keyStats, offset: stepIndex }) };
    }

    case 'numbers':
      return { label: step.label, lines: buildNumbers(lines, stepIndex) };

    case 'text': {
      const t = buildText(allowed);
      return { label: step.label, title: t.title, lines: t.lines };
    }

    case 'mixed':
    default: {
      const sent = buildSentences(allowed, 1, { uppercase });
      const wordLines = buildWords(newKeys, allowed, Math.max(1, lines - (sent ? 1 : 0)), { keyStats, offset: stepIndex });
      return { label: step.label, lines: sent ? wordLines.concat(sent) : wordLines };
    }
  }
}

/** Kolik opravdových slov jde z dané množiny znaků složit. Používá se v testech. */
export function usableWordCount(allowed) {
  return CONTENT.words.filter((w) => fits(w, allowed)).length;
}

export function usableSentenceCount(allowed, lower = true) {
  return CONTENT.sentences
    .map((s) => (lower ? s.toLowerCase() : s))
    .filter((s) => fits(s, allowed)).length;
}
