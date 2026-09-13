/**
 * Cvičení navíc, které dítěti zadá rodič.
 *
 * Měření běží po jednotlivých cvičeních, ne jen po lekcích, takže se
 * z přehledu pozná, který druh cvičení dělá potíže. Rodič pak zadá jeden
 * druh navíc a dítě ho uvidí na úvodní stránce před další lekcí.
 *
 * Sestavuje se z toho, co dítě už umí. Nová písmena se tu neučí, jde
 * o procvičení.
 */

import { LESSONS } from './curriculum.js';

/**
 * Druhy cvičení. `label` čte rodič v přehledu, `child` dítě na kartě.
 * `needsKeys` označuje druh, který se váže na konkrétní klávesy, takže se
 * mu musí dodat ty z posledních lekcí.
 */
export const KINDS = {
  warmup: { label: 'Rozcvička', child: 'Rozcvička', needsKeys: true },
  letters: { label: 'Nácvik jednotlivých kláves', child: 'Klávesy jedna po druhé', needsKeys: true },
  reach: { label: 'Návrat do základní polohy', child: 'Zpátky domů', needsKeys: true },
  mixedkeys: { label: 'Zamíchané skupinky', child: 'Zamíchané skupinky', needsKeys: true },
  syllables: { label: 'Slabiky', child: 'Slabiky' },
  words: { label: 'Slova', child: 'Slova' },
  sentences: { label: 'Věty', child: 'Věty' },
  mixed: { label: 'Slova a věty dohromady', child: 'Procvičení' },
  anchorwords: { label: 'Velká písmena ve slovech', child: 'Velká písmena ve slovech' },
  shiftpairs: { label: 'Shift opačnou rukou', child: 'Velká písmena' },
  shiftmix: { label: 'Střídání obou Shiftů', child: 'Velká písmena střídavě' },
  onehand: { label: 'Slova jednou rukou', child: 'Jednou rukou' },
  twisters: { label: 'Prstolamy', child: 'Prstolamy' },
  theme: { label: 'Tematická slova', child: 'Slova na téma' },
  english: { label: 'Anglická slovíčka', child: 'Angličtina' },
  numbers: { label: 'Číslice', child: 'Číslice' },
  text: { label: 'Souvislý text', child: 'Delší text' },
};

/** Jméno druhu pro rodiče. Neznámý druh se vypíše, jak přišel. */
export function kindLabel(kind) {
  return (KINDS[kind] || {}).label || kind;
}

/** Jméno druhu pro dítě. */
export function kindChildLabel(kind) {
  return (KINDS[kind] || {}).child || kindLabel(kind);
}

/**
 * Klávesy z posledních probraných lekcí. Nácvik kláves a návrat do základní
 * polohy se bez nich nedají postavit a nejčerstvější látka je zároveň ta,
 * která nejspíš dře.
 */
function recentKeys(index, howMany = 2) {
  const keys = [];
  for (let i = Math.min(index, LESSONS.length - 1); i >= 0 && keys.length < howMany * 2; i -= 1) {
    for (const k of LESSONS[i].newKeys || []) {
      // jen malá písmena: nácvik skupinek míchá písmena, číslice a znaménka
      // do nich nepatří a skupinka by z nich nešla složit
      if (k.length === 1 && /\p{Ll}/u.test(k) && !keys.includes(k)) keys.push(k);
    }
    if (keys.length >= howMany) break;
  }
  return keys.length ? keys : ['f', 'j'];
}

/**
 * Postaví lekci navíc z jednoho druhu cvičení.
 *
 * @param kind  druh cvičení
 * @param index pořadí lekce, kterou dítě zrovna má, kvůli povoleným znakům
 */
export function practiceLesson(kind, index) {
  const info = KINDS[kind] || KINDS.words;
  const near = LESSONS[Math.min(Math.max(index, 0), LESSONS.length - 1)];
  const label = kindChildLabel(kind);

  const steps = [
    { kind: 'warmup', label: 'Rozcvička', lines: 2 },
    { kind, label: `${label} 1`, lines: 3 },
    { kind, label: `${label} 2`, lines: 3 },
  ];
  // U rozcvičky by první krok zdvojil ten druhý, tak se vypustí.
  if (kind === 'warmup') steps.shift();

  return {
    id: `EXTRA-${kind}`,
    block: 'Cvičení navíc',
    title: label,
    newKeys: info.needsKeys ? recentKeys(index) : [],
    targetCpm: near.targetCpm,
    practice: true,
    kind,
    intro: {
      lead: 'Tohle není nová lekce, ale krátké zopakování toho, co už umíš.'
        + ' Když si to teď usadíš v prstech, půjde ti další látka líp.',
      points: [
        'Nová písmena tu nejsou, všechno už znáš z dřívějška.',
        'Piš klidně a dívej se na obrazovku, ne na ruce.',
        'Přesnost je pořád důležitější než rychlost.',
      ],
    },
    steps,
  };
}
