/**
 * Vyrobí dokument Word s výkladem všech lekcí a ukázkami cvičení.
 *
 *   node tools/make-docx.mjs
 *
 * Nácvik jednotlivých kláves je vždycky stejný, takže se vypíše přesně tak,
 * jak ho dítě uvidí. Slabiky, slova a věty se losují pokaždé znovu, u těch je
 * v dokumentu jen ukázka jednoho vylosování.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LESSONS, allowedCharsUpTo, knowsUppercase, backspaceAllowedAt } from '../web/js/curriculum.js';
import { setContent, buildStep } from '../web/js/generator.js';
import { keyForChar } from '../web/js/keyboard.js';
import { docx, p, bullet, mono, pageBreak } from './docx.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const readContent = (f) => JSON.parse(fs.readFileSync(path.join(root, 'web', 'content', f), 'utf8'));

setContent({
  words: readContent('words-cs.json'),
  sentences: readContent('sentences-cs.json'),
  texts: readContent('texts-cs.json'),
  wordsEn: readContent('words-en.json'),
  sentencesEn: readContent('sentences-en.json'),
  themes: { ...readContent('themes-cs.json'), ...readContent('themes-en.json') },
});

/** Která cvičení vypadají pokaždé stejně. */
const DETERMINISTIC = new Set(['letters']);

const body = [];

/* --------------------------------------------------------------- titulka */

body.push(p('Píšeme všemi deseti', 'Nadpis'));
body.push(p('Výklad lekcí a ukázky cvičení · česká klávesnice QWERTZ', 'Podnadpis'));

body.push(p('Jak je kurz postavený', 'Blok'));
body.push(p(
  'Pořadí kláves odpovídá české praxi výuky psaní všemi deseti. Začíná se u F a J, '
  + 'pokračuje zbytkem základní řady, pak horní řada, dolní řada, velká písmena, oprava '
  + 'chyb, háčky a čárky, znaménka a nakonec číslice.'
));
body.push(p('Nácvik nových kláves jde vždycky ve třech stupních:'));
body.push(bullet('Jedno po druhém: jedno písmeno pořád dokola, aby si prst zapamatoval cestu.'));
body.push(bullet('Střídáme ruce: pravidelné střídání obou rukou, aby naskočil rytmus.'));
body.push(bullet('Zamícháme to: náhodné skupinky, do kterých se přimíchají i písmena z dřívějších lekcí. Tady se pozná, jestli to prsty umí doopravdy.'));
body.push(p('Každá lekce kromě první navíc začíná rozcvičkou na to, co dítě umí z dřívějška: nejdřív základní řada, pak sevření dřív naučených kláves.'));
body.push(p(
  'To pořadí není náhodné. Předvídatelné opakování se zvládá snáz a je potřeba na začátku. '
  + 'Zamíchané pořadí se hůř nacvičuje, ale mnohem líp se pamatuje, proto přichází až potom.',
  'Poznamka'
));

body.push(p('Zásady, které platí v každé lekci', 'Blok'));
body.push(bullet('Přesnost je důležitější než rychlost. Rychlé psaní se špatným hmatem jen upevňuje chyby.'));
body.push(bullet('Deset minut denně je lepší než hodina jednou týdně.'));
body.push(bullet('Na ruce se nedívej. Na obrazovce je obrázek klávesnice i rukou.'));
body.push(bullet('Po každém úhozu mimo základní řadu se prst vrací zpátky na svůj hrbolek.'));
body.push(bullet('V prvních lekcích se chyby neopravují. Backspace se zapne až v lekci, která ho vysvětlí.'));
body.push(bullet('Když se na jednom řádku sejdou víc než dvě chyby, řádek se smaže a píše znovu.'));

body.push(p('Hvězdičky', 'Blok'));
body.push(bullet('Jedna hvězdička: přesnost aspoň 90 %. Tím se odemkne další lekce.'));
body.push(bullet('Dvě hvězdičky: přesnost aspoň 95 %.'));
body.push(bullet('Tři hvězdičky: přesnost aspoň 98 % a zároveň splněná cílová rychlost lekce.'));
body.push(p(
  'Rychlost se měří v úhozech za minutu, jak je u nás zvykem. Jeden úhoz je jedno '
  + 'stisknutí klávesy včetně mezery.',
  'Poznamka'
));

body.push(pageBreak());

/* ----------------------------------------------------------------- lekce */

let lastBlock = null;

LESSONS.forEach((lesson, i) => {
  if (lesson.block !== lastBlock) {
    body.push(p(lesson.block, 'Blok'));
    lastBlock = lesson.block;
  }

  body.push(p(`${i + 1}. ${lesson.title}`, 'Lekce'));

  const keys = lesson.newKeys.filter((k) => k.length === 1);
  const summary = [];
  if (keys.length) summary.push('nové klávesy: ' + keys.join(' '));
  else if (lesson.introducesBackspace) summary.push('nová klávesa: Backspace');
  else summary.push('opakování');
  summary.push('cíl: ' + lesson.targetCpm + ' úhozů za minutu');
  if (backspaceAllowedAt(i)) summary.push('Backspace už funguje');
  body.push(p(summary.join(' · '), 'Poznamka'));

  body.push(p(lesson.intro.lead));
  for (const point of lesson.intro.points) body.push(bullet(point));

  // který prst obsluhuje které nové písmeno
  const fingerLines = keys
    .map((k) => {
      const info = keyForChar(k);
      return info ? `${k} — ${info.fingerName}` : null;
    })
    .filter(Boolean);
  if (fingerLines.length) {
    body.push(p('Který prst', 'Krok'));
    for (const line of fingerLines) body.push(bullet(line));
  }

  // ukázky jednotlivých cvičení
  const ctx = {
    allowed: allowedCharsUpTo(i),
    keyStats: {},
    uppercase: knowsUppercase(i),
  };
  lesson.steps.forEach((stepDef, si) => {
    const built = buildStep(lesson, stepDef, ctx, si);
    const fixed = DETERMINISTIC.has(stepDef.kind);
    body.push(p(`${si + 1}. ${built.label}${built.title ? ' — ' + built.title : ''}`, 'Krok'));
    if (!fixed) body.push(p('Ukázka, pokaždé se vylosuje jinak.', 'Poznamka'));
    for (const line of built.lines) body.push(mono(line));
  });

  if (i < LESSONS.length - 1) body.push(pageBreak());
});

/* ---------------------------------------------------------------- zápis */

// volitelně jde zadat jinou cestu: node tools/make-docx.mjs jinam.docx
const out = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'Pisme-vsemi-deseti-lekce.docx');
try {
  fs.writeFileSync(out, docx(body));
} catch (err) {
  if (err.code === 'EBUSY' || err.code === 'EPERM') {
    console.error('Soubor je otevřený ve Wordu. Zavři ho a spusť to znovu.');
    process.exit(1);
  }
  throw err;
}
console.log('Hotovo: ' + out);
console.log('Lekcí: ' + LESSONS.length + ', odstavců: ' + body.length);
