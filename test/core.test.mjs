/**
 * Testy výpočtů a obsahu. Spustí se: node --test test/
 * Nic z toho nepotřebuje prohlížeč.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  computeResult, starsFor, summarizeKeys, weakestKeys, keyWeights,
  humanDuration, currentStreak, pct,
} from '../web/js/stats.js';
import {
  LESSONS, allowedCharsUpTo, knowsUppercase, isUnlocked, nextLessonIndex, lessonById,
  backspaceAllowedAt,
} from '../web/js/curriculum.js';
import { setContent, buildStep, usableWordCount } from '../web/js/generator.js';
import { keyForChar, allChars } from '../web/js/keyboard.js';
import { handOf } from '../web/js/hands.js';
import { FINGERS } from '../web/js/keyboard.js';

/** Ošetří znaky, které mají v regulárním výrazu vlastní význam (tečka, čárka). */
function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
import { STICKERS, maybeAward, stickerSvg, outlineSvg } from '../web/js/stickers.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(here, '..', 'web', 'content');
const read = (f) => JSON.parse(fs.readFileSync(path.join(contentDir, f), 'utf8'));
const WORDS = read('words-cs.json');
const SENTENCES = read('sentences-cs.json');
const TEXTS = read('texts-cs.json');
const WORDS_EN = read('words-en.json');
const SENTENCES_EN = read('sentences-en.json');
const THEMES = { ...read('themes-cs.json'), ...read('themes-en.json') };
setContent({
  words: WORDS,
  sentences: SENTENCES,
  texts: TEXTS,
  wordsEn: WORDS_EN,
  sentencesEn: SENTENCES_EN,
  themes: THEMES,
});

/* ------------------------------------------------------------ výpočet výkonu */

test('rychlost se počítá v úhozech za minutu', () => {
  const r = computeResult({ typed: 200, errors: 0, durationMs: 60000 });
  assert.equal(r.cpm, 200);
  assert.equal(r.netCpm, 200);
  assert.equal(r.accuracy, 1);
});

test('chyby snižují čistou rychlost i přesnost', () => {
  const r = computeResult({ typed: 100, errors: 10, durationMs: 60000 });
  assert.equal(r.cpm, 100);
  assert.equal(r.accuracy, 0.9);
  assert.equal(r.netCpm, 90);
});

test('prázdné cvičení nespadne a nedá nesmysl', () => {
  const r = computeResult({ typed: 0, errors: 0, durationMs: 0 });
  assert.equal(r.accuracy, 0);
  assert.equal(r.stars, 0);
  assert.ok(Number.isFinite(r.cpm));
});

test('hvězdičky: přesnost rozhoduje, třetí chce i rychlost', () => {
  assert.equal(starsFor(0.89, 200, 100), 0);
  assert.equal(starsFor(0.9, 10, 100), 1);
  assert.equal(starsFor(0.96, 10, 100), 2);
  assert.equal(starsFor(0.99, 50, 100), 2, 'přesná, ale pomalá dostane dvě');
  assert.equal(starsFor(0.99, 120, 100), 3);
});

test('statistika kláves počítá chyby a reakční dobu jen ze správných úhozů', () => {
  const s = summarizeKeys([
    { char: 'f', ok: true, latency: 300 },
    { char: 'f', ok: false, latency: 2000 },
    { char: 'f', ok: true, latency: 500 },
    { char: 'j', ok: true, latency: 0 },
  ]);
  assert.equal(s.f.presses, 3);
  assert.equal(s.f.errors, 1);
  assert.equal(s.f.meanLatency, 400);
  assert.equal(s.j.meanLatency, 0);
});

test('nejslabší klávesy se řadí podle chybovosti a pomalosti', () => {
  const weak = weakestKeys({
    a: { presses: 100, errors: 30, latencyEma: 800 },
    b: { presses: 100, errors: 1, latencyEma: 200 },
    c: { presses: 5, errors: 5, latencyEma: 900 },
  });
  assert.equal(weak[0].char, 'a');
  assert.ok(!weak.some((w) => w.char === 'c'), 'málo procvičená klávesa se nepočítá');
});

test('slabé klávesy dostanou vyšší váhu při výběru slov', () => {
  const w = keyWeights({
    a: { presses: 100, errors: 40, latencyEma: 900 },
    b: { presses: 100, errors: 0, latencyEma: 150 },
  }, ['a', 'b']);
  assert.ok(w.get('a') > w.get('b'));
});

test('formátování času a procent', () => {
  assert.equal(humanDuration(45), '45 s');
  assert.equal(humanDuration(200), '3 min 20 s');
  assert.equal(humanDuration(120), '2 min');
  assert.equal(pct(0.945), '95 %');
});

test('série dní se počítá zpětně a dnešek ji nepřeruší', () => {
  const days = { '2026-09-08': { seconds: 10 }, '2026-09-09': { seconds: 10 } };
  assert.equal(currentStreak(days, '2026-09-10'), 2, 'dnes se ještě necvičilo');
  days['2026-09-10'] = { seconds: 5 };
  assert.equal(currentStreak(days, '2026-09-10'), 3);
  assert.equal(currentStreak({}, '2026-09-10'), 0);
});

/* ------------------------------------------------------------------- osnova */

test('lekce začínají u f a j a jdou po české metodice', () => {
  assert.deepEqual(LESSONS[0].newKeys, ['f', 'j']);
  assert.deepEqual(LESSONS[1].newKeys, ['d', 'k']);
  assert.deepEqual(LESSONS[2].newKeys, ['s', 'l']);
  assert.deepEqual(LESSONS[3].newKeys, ['a', 'ů']);
  assert.deepEqual(LESSONS[4].newKeys, ['g', 'h']);
});

test('každá lekce má český výklad a aspoň dva kroky', () => {
  for (const l of LESSONS) {
    assert.ok(l.intro.lead.length > 40, l.id + ': chybí výklad');
    assert.ok(l.intro.points.length >= 3, l.id + ': málo bodů');
    assert.ok(l.steps.length >= 2, l.id + ': málo kroků');
    assert.ok(l.targetCpm > 0, l.id + ': chybí cílová rychlost');
  }
});

test('žádná klávesa se neučí dvakrát', () => {
  const seen = new Set();
  for (const l of LESSONS) {
    for (const k of l.newKeys) {
      assert.ok(!seen.has(k), 'klávesa ' + k + ' se opakuje v ' + l.id);
      seen.add(k);
    }
  }
});

test('celá česká abeceda se během lekcí probere', () => {
  const allowed = allowedCharsUpTo(LESSONS.length - 1);
  for (const ch of 'abcdefghijklmnopqrstuvwxyzěščřžýáíéúůďťňó') {
    assert.ok(allowed.has(ch), 'chybí písmeno ' + ch);
  }
  for (const ch of '0123456789,.?!:-') {
    assert.ok(allowed.has(ch), 'chybí znak ' + ch);
  }
});

test('velká písmena se považují za známá až od lekce L19', () => {
  const first = LESSONS.findIndex((l) => l.id === 'L19');
  assert.equal(knowsUppercase(first - 1), false);
  assert.equal(knowsUppercase(first), true);
});

test('další lekce se odemkne hvězdičkou nebo po třech pokusech', () => {
  assert.equal(isUnlocked(0, { lessons: {} }), true);
  assert.equal(isUnlocked(1, { lessons: {} }), false);
  assert.equal(isUnlocked(1, { lessons: { L01: { stars: 1, attempts: [1] } } }), true);
  assert.equal(isUnlocked(1, { lessons: { L01: { stars: 0, attempts: [1, 2] } } }), false);
  assert.equal(isUnlocked(1, { lessons: { L01: { stars: 0, attempts: [1, 2, 3] } } }), true);
});

test('pokračuje se u první nezvládnuté lekce', () => {
  assert.equal(nextLessonIndex({ lessons: {} }), 0);
  assert.equal(nextLessonIndex({ lessons: { L01: { stars: 1 } } }), 1);
  assert.equal(nextLessonIndex({ lessons: { L01: { stars: 0 } } }), 0);
});

/* ------------------------------------------------------------------ generátor */

test('cvičení nikdy neobsahuje písmeno, které se ještě neučilo', () => {
  LESSONS.forEach((lesson, i) => {
    const allowed = allowedCharsUpTo(i);
    const uppercase = knowsUppercase(i);
    lesson.steps.forEach((stepDef, si) => {
      for (let round = 0; round < 12; round++) {
        const built = buildStep(lesson, stepDef, { allowed, keyStats: {}, uppercase }, si);
        assert.ok(built.lines.length > 0, lesson.id + '/' + si + ': prázdné cvičení');
        for (const line of built.lines) {
          assert.ok(line.trim().length > 0, lesson.id + ': prázdný řádek');
          for (const ch of line) {
            assert.ok(allowed.has(ch), `${lesson.id}, krok ${si}: neznámý znak "${ch}" v "${line}"`);
          }
        }
      }
    });
  });
});

test('od lekce se slovy jsou k dispozici opravdová slova', () => {
  const idx = LESSONS.findIndex((l) => l.id === 'L06');
  assert.ok(usableWordCount(allowedCharsUpTo(idx)) >= 10);
  const idx13 = LESSONS.findIndex((l) => l.id === 'L13');
  assert.ok(usableWordCount(allowedCharsUpTo(idx13)) >= 100);
});

test('všechna slova ve slovníku jdou na české klávesnici napsat', () => {
  const typeable = new Set(allChars('cs-qwertz'));
  for (const w of WORDS) {
    for (const ch of w) {
      assert.ok(typeable.has(ch), `slovo "${w}": znak "${ch}" na klávesnici není`);
    }
  }
});

test('všechny věty jdou na české klávesnici napsat', () => {
  const typeable = new Set(allChars('cs-qwertz'));
  for (const s of SENTENCES.concat(TEXTS.map((t) => t.text))) {
    for (const ch of s) {
      assert.ok(typeable.has(ch), `věta "${s}": znak "${ch}" na klávesnici není`);
    }
  }
});

/* ----------------------------------------------------------------- klávesnice */

test('základní poloha prstů odpovídá české metodice', () => {
  assert.equal(keyForChar('f').fingerName, 'levý ukazováček');
  assert.equal(keyForChar('j').fingerName, 'pravý ukazováček');
  assert.equal(keyForChar('a').fingerName, 'levý malíček');
  assert.equal(keyForChar('ů').fingerName, 'pravý malíček');
  assert.equal(keyForChar(' ').fingerName, 'palec');
});

test('česká QWERTZ má z nahoře a y dole', () => {
  assert.equal(keyForChar('z').code, 'KeyZ');
  assert.equal(keyForChar('z').fingerName, 'pravý ukazováček');
  assert.equal(keyForChar('y').fingerName, 'levý malíček');
  assert.equal(keyForChar('y', 'cs-qwerty').fingerName, 'pravý ukazováček');
});

test('diakritika je na číselné řadě, číslice pod Shiftem', () => {
  assert.equal(keyForChar('ě').code, 'Digit2');
  assert.equal(keyForChar('ě').shift, false);
  assert.equal(keyForChar('2').code, 'Digit2');
  assert.equal(keyForChar('2').shift, true);
});

test('Shift se drží opačnou rukou, než která píše písmeno', () => {
  assert.equal(keyForChar('A').shiftCode, 'ShiftRight', 'A je levou rukou');
  assert.equal(keyForChar('L').shiftCode, 'ShiftLeft', 'L je pravou rukou');
});

test('ď, ť, ň a ó se skládají mrtvou klávesou', () => {
  const d = keyForChar('ď');
  assert.equal(d.dead, true);
  assert.equal(d.steps[0].code, 'Equal');
  assert.equal(d.steps[0].shift, true, 'háček je Shift a klávesa vpravo nahoře');
  assert.equal(d.steps[1].code, 'KeyD');
  assert.equal(keyForChar('ó').steps[0].shift, false, 'čárka je bez Shiftu');
});

/* ------------------------------------------------------- spouštěcí soubory */

test('dávkové soubory jsou v ASCII a mají konce řádků CRLF', () => {
  // Cmd.exe si s českým znakem v .bat souboru neporadí, když je zapnutá
  // stránka 65001, a začne sekat řádky na kusy. Hlásí pak neznámý příkaz
  // jako 'd' nebo 'f'. Konce řádků musí být windowsové ze stejného důvodu.
  const root = path.join(here, '..');
  const bats = fs.readdirSync(root).filter((f) => f.endsWith('.bat'));
  assert.ok(bats.length >= 2, 'čekal jsem start.bat i pro-rodice.bat');

  for (const name of bats) {
    const buf = fs.readFileSync(path.join(root, name));
    const nonAscii = [...buf].filter((b) => b > 127);
    assert.equal(nonAscii.length, 0, `${name}: obsahuje ${nonAscii.length} ne-ASCII bajtů`);

    const text = buf.toString('latin1');
    assert.equal((text.match(/(?<!\r)\n/g) || []).length, 0, `${name}: má unixové konce řádků`);
    assert.ok(text.includes('\r\n'), `${name}: nemá ani jeden konec řádku`);
  }
});

/* ---------------------------------------------------------------- vzhled */

test('atribut hidden musí skutečně schovávat', () => {
  const css = fs.readFileSync(path.join(here, '..', 'web', 'css', 'app.css'), 'utf8');
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important/,
    'bez tohoto pravidla zůstane překryv "Klikni sem a piš" viset přes text');
});

test('píše se vždy jen jeden řádek', () => {
  const css = fs.readFileSync(path.join(here, '..', 'web', 'css', 'app.css'), 'utf8');
  assert.match(css, /\.line\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.line--active\s*\{[^}]*display:\s*block/);
});

/* ------------------------------------------------------------ nácvik kláves */

test('první lekce začíná opakováním jednoho písmene, pak střídá ruce', () => {
  const lesson = lessonById('L01');
  const ctx = { allowed: allowedCharsUpTo(0), keyStats: {}, uppercase: false };

  const first = buildStep(lesson, lesson.steps[0], ctx, 0).lines;
  // slábnoucí skupinky podle klasické učebnice: fff fff ff ff f f
  assert.match(first[0], /^fff fff ff ff f f\b/, 'první řádek je jen f a skupinky se zkracují');
  assert.ok(!/j/.test(first[0]), 'do prvního řádku se druhé písmeno neplete');
  assert.match(first[1], /^jjj jjj jj jj j j\b/, 'druhý řádek je jen j');
  assert.ok(!/f/.test(first[1]));
  assert.match(first[2], /^fff jjj ff jj f j\b/, 'třetí řádek střídá obě ruce');

  const second = buildStep(lesson, lesson.steps[1], ctx, 1).lines;
  for (const line of second) {
    assert.match(line, /^([fj]{2,3} )+[fj]{2,3}$/, 'druhý krok jsou dvojice a trojice');
    assert.ok(new Set(line.split(' ')).size >= 2, 'v řádku jsou aspoň dvě obměny: ' + line);
  }
  assert.notDeepEqual(second, first, 'kroky se nesmí opakovat');
});

test('lekce s natažením prstu cvičí návrat do základní polohy', () => {
  const cases = { L05: ['fgf', 'jhj'], L08: ['frf', 'juj'], L15: ['dcd', 'k,k'], L21: ['sěs', 'dšd'] };
  for (const [id, [a, b]] of Object.entries(cases)) {
    const lesson = lessonById(id);
    const i = LESSONS.indexOf(lesson);
    const step = lesson.steps.find((s) => s.kind === 'reach');
    assert.ok(step, id + ': chybí krok se sevřením mezi domovské klávesy');
    const lines = buildStep(lesson, step, { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: false }, 1).lines;
    assert.ok(lines[0].startsWith(a + ' '), id + ': ' + lines[0]);
    assert.ok(!lines[0].includes(b), id + ': první řádek cvičí jen jednu ruku');
    assert.ok(lines[1].startsWith(b + ' '), id + ': ' + lines[1]);
    assert.ok(lines[2].includes(a) && lines[2].includes(b), id + ': obě ruce v jednom řádku');
  }

  // lekce, jejíž písmena leží přímo v základní řadě, tenhle krok nepotřebuje
  assert.ok(!lessonById('L04').steps.some((s) => s.kind === 'reach'));
});

test('velká písmena mají cvičení na střídání obou Shiftů', () => {
  const lesson = LESSONS.find((l) => l.steps.some((s) => s.kind === 'shiftmix'));
  assert.ok(lesson, 'chybí lekce na smíšené Shifty');
  const i = LESSONS.indexOf(lesson);
  const step = lesson.steps.find((s) => s.kind === 'shiftmix');

  for (let round = 0; round < 10; round++) {
    const lines = buildStep(lesson, step, { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: true }, 0).lines;
    for (const group of lines.join(' ').split(' ')) {
      assert.equal(group.length, 2, 'dvojice velkých písmen: ' + group);
      const [x, y] = [...group].map((c) => keyForChar(c).shiftCode);
      assert.ok(x && y, 'obě písmena se píší se Shiftem: ' + group);
      assert.notEqual(x, y, 'každá dvojice mění ruku, která drží Shift: ' + group);
    }
  }
});

test('nácvik Shiftu sevře velké písmeno mezi domovské klávesy malíčku', () => {
  const lesson = lessonById('L19');
  const i = LESSONS.indexOf(lesson);
  const step = lesson.steps.find((s) => s.kind === 'shiftpairs');
  const text = buildStep(lesson, step, { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: true }, 0).lines.join(' ');
  // A se píše levou rukou, Shift drží pravý malíček, jehož domov je ů
  assert.ok(/ů[A-Z]ů/.test(text), 'chybí sevření typu ůAů: ' + text);
  assert.ok(/[a-z][A-Z]/.test(text), 'chybí dvojice malé a velké');
});

test('nácvikové řádky se v rámci lekce neopakují', () => {
  for (const id of ['L01', 'L02', 'L03']) {
    const lesson = lessonById(id);
    const i = LESSONS.indexOf(lesson);
    const ctx = { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: false };
    const seen = lesson.steps.map((s, si) => buildStep(lesson, s, ctx, si).lines.join('|'));
    assert.equal(new Set(seen).size, seen.length, id + ': dva kroky mají stejný text');
  }
});

test('řádky jsou dost dlouhé, ale vejdou se na obrazovku', () => {
  let longest = 0;
  LESSONS.forEach((lesson, i) => {
    const ctx = { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: knowsUppercase(i) };
    lesson.steps.forEach((stepDef, si) => {
      for (const line of buildStep(lesson, stepDef, ctx, si).lines) {
        assert.ok(line.length <= 72, `${lesson.id}: příliš dlouhý řádek (${line.length})`);
        longest = Math.max(longest, line.length);
      }
    });
  });
  assert.ok(longest >= 55, 'řádky jsou zbytečně krátké, nejdelší má ' + longest);
});

/** Najde krok daného druhu i s jeho pořadím v lekci. */
function stepOf(lesson, kind) {
  const index = lesson.steps.findIndex((s) => s.kind === kind);
  assert.ok(index >= 0, lesson.id + ': chybí krok ' + kind);
  return { step: lesson.steps[index], index };
}

test('nácvik jde od opakování přes střídání k zamíchání', () => {
  const kinds = lessonById('L02').steps.map((s) => s.kind);
  assert.deepEqual(kinds, ['warmup', 'letters', 'letters', 'mixedkeys']);
});

test('poslední cvičení přibírá i písmena z dřívějších lekcí', () => {
  const i = LESSONS.findIndex((l) => l.id === 'L02');
  const lesson = LESSONS[i];
  const ctx = { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: false };

  // nácvik nových kláves je jen z nich, stará písmena se do něj nepletou
  const letters = stepOf(lesson, 'letters');
  const first = buildStep(lesson, letters.step, ctx, letters.index).lines.join('');
  assert.ok(!/[fj]/.test(first), 'v prvním cvičení se stará písmena nepletou');

  // v zamíchaném kroku se f a j musí objevit, jinak se procvičuje jen půlka
  const mixed = stepOf(lesson, 'mixedkeys');
  for (let round = 0; round < 10; round++) {
    const text = buildStep(lesson, mixed.step, ctx, mixed.index).lines.join(' ');
    assert.ok(/[fj]/.test(text), 'zamíchané cvičení má přibrat i starší klávesy');
    for (const group of text.split(' ')) {
      assert.ok(/[dk]/.test(group), 'každá skupinka má obsahovat nové písmeno: ' + group);
    }
  }
});

test('každá lekce kromě první začíná rozcvičkou na to, co už dítě umí', () => {
  assert.equal(LESSONS[0].steps[0].kind, 'letters', 'první lekce nemá co opakovat');

  LESSONS.slice(1).forEach((lesson, offset) => {
    const i = offset + 1;
    assert.equal(lesson.steps[0].kind, 'warmup', lesson.id + ': rozcvička není první');
    const ctx = { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: knowsUppercase(i) };
    const lines = buildStep(lesson, lesson.steps[0], ctx, 0).lines;
    const text = lines.join(' ');

    for (const key of lesson.newKeys.filter((k) => k.length === 1)) {
      assert.ok(!text.includes(key), `${lesson.id}: v rozcvičce je nové písmeno "${key}"`);
    }
    assert.ok(lines.length >= 2, lesson.id + ': rozcvička má dva řádky');
    assert.notEqual(lines[0], lines[1], lesson.id + ': oba řádky rozcvičky jsou stejné');
    assert.match(lines[0], /^fff jjj/, lesson.id + ': rozcvička začíná základní řadou');
  });
});

test('jednoruční cvičení opravdu používá jen jednu ruku', () => {
  const lesson = lessonById('L29');
  const i = LESSONS.indexOf(lesson);
  const ctx = { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: true };

  for (const side of ['L', 'R']) {
    const { step, index } = stepOf(lesson, 'onehand');
    const def = lesson.steps.find((s) => s.kind === 'onehand' && s.side === side);
    assert.ok(def, 'chybí cvičení pro stranu ' + side);
    for (let round = 0; round < 8; round++) {
      const text = buildStep(lesson, def, ctx, index).lines.join(' ');
      for (const ch of text.replace(/ /g, '')) {
        const info = keyForChar(ch.toLowerCase());
        assert.ok(info, 'neznámý znak ' + ch);
        assert.equal(FINGERS[info.finger].hand, side, `${side}: znak "${ch}" patří druhé ruce`);
      }
    }
  }
});

test('prstolamy jsou opravdu na jeden prst', () => {
  const lesson = lessonById('L30');
  const i = LESSONS.indexOf(lesson);
  const ctx = { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: true };
  const def = lesson.steps.find((s) => s.mode === 'pairs');

  const lines = buildStep(lesson, def, ctx, 1).lines;
  for (const line of lines) {
    for (const group of line.split(' ')) {
      assert.equal(group.length, 2, 'dvojice: ' + group);
      const a = keyForChar(group[0]);
      const b = keyForChar(group[1]);
      assert.equal(a.finger, b.finger, 'obě písmena má psát stejný prst: ' + group);
      assert.notEqual(group[0], group[1], 'stejné písmeno dvakrát není prstolam');
    }
  }
  // nejtěžší česká dvojice na této klávesnici
  assert.ok(lines[0].startsWith('lo ol'), 'čekal jsem lo a ol jako nejčastější: ' + lines[0]);
});

test('tematická cvičení berou slova ze své sady', () => {
  const cases = { L31: 'zvirata', L32: 'mesta', L33: 'dny', L34: 'jmena', L36: 'minecraft' };
  for (const [id, theme] of Object.entries(cases)) {
    const lesson = lessonById(id);
    const i = LESSONS.indexOf(lesson);
    const ctx = { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: true };
    const def = lesson.steps.find((s) => s.kind === 'theme' && !s.mode);
    assert.ok(def, id + ': chybí tematický krok');
    assert.equal(def.theme, theme);

    const pool = new Set(THEMES[theme].words);
    const text = buildStep(lesson, def, ctx, 1).lines.join(' ');
    // datumy obsahují mezeru, proto se porovnává celý řádek proti sadě
    const unknown = [...pool].length ? text.split(' ').filter((w) => {
      if (pool.has(w)) return false;
      return ![...pool].some((p) => p.split(' ').includes(w));
    }) : [];
    assert.equal(unknown.length, 0, `${id}: slova mimo sadu: ${unknown.join(', ')}`);
  }
});

test('anglické lekce používají anglická slovíčka', () => {
  const lesson = lessonById('L35');
  const i = LESSONS.indexOf(lesson);
  const ctx = { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: true };
  const pool = new Set(WORDS_EN);

  const words = lesson.steps.find((s) => s.kind === 'english' && !s.mode);
  for (const w of buildStep(lesson, words, ctx, 2).lines.join(' ').split(' ')) {
    assert.ok(pool.has(w), 'slovo mimo anglický slovníček: ' + w);
  }

  const yz = lesson.steps.find((s) => s.mode === 'yz');
  for (const w of buildStep(lesson, yz, ctx, 1).lines.join(' ').split(' ')) {
    assert.match(w, /[yz]/, 'krok na Y a Z má obsahovat jen slova s Y nebo Z: ' + w);
  }
});

test('všechna anglická a tematická slova jdou na české klávesnici napsat', () => {
  const typeable = new Set(allChars('cs-qwertz'));
  const all = [
    ...WORDS_EN,
    ...SENTENCES_EN,
    ...Object.values(THEMES).flatMap((t) => [...t.words, ...t.sentences]),
  ];
  for (const s of all) {
    for (const ch of s) {
      assert.ok(typeable.has(ch), `"${s}": znak "${ch}" na klávesnici není`);
    }
  }
});

test('slova mezi kotvami mají před sebou domovskou klávesu správného malíčku', () => {
  const cases = { L19: 'ů', L20: 'a', L20C: null };
  for (const [id, expected] of Object.entries(cases)) {
    const lesson = lessonById(id);
    const i = LESSONS.indexOf(lesson);
    const { step, index } = stepOf(lesson, 'anchorwords');
    const ctx = { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: true };

    for (let round = 0; round < 8; round++) {
      const tokens = buildStep(lesson, step, ctx, index).lines.join(' ').split(' ');
      let words = 0;
      for (let k = 1; k < tokens.length; k++) {
        if (!/^\p{Lu}/u.test(tokens[k])) continue;
        words += 1;
        const anchor = tokens[k - 1];
        assert.match(anchor, /^(ůůů|aaa)$/, `${id}: před slovem chybí kotva: ${tokens[k]}`);
        const needed = keyForChar(tokens[k][0]).shiftCode === 'ShiftRight' ? 'ůůů' : 'aaa';
        assert.equal(anchor, needed, `${id}: špatná kotva u ${tokens[k]}`);
        if (expected) assert.equal(anchor, expected.repeat(3), id + ': jen jedna strana');
      }
      assert.ok(words >= 5, id + ': málo slov ve cvičení');
    }
  }
});

test('ruce se dají pojmenovat, rozliší se písmenem, ne barvou', () => {
  assert.equal(handOf('li').name, 'levá');
  assert.equal(handOf('rp').name, 'pravá');
  assert.equal(handOf('li').letter, 'L');
  assert.equal(handOf('rp').letter, 'P');
  assert.equal(handOf('th'), null, 'palec nepatří jen jedné ruce');
});

test('stejný prst má na obou rukou stejnou barvu a barev jsou čtyři', () => {
  const pairs = [['lp', 'rp'], ['lr', 'rr'], ['lm', 'rm'], ['li', 'ri']];
  for (const [left, right] of pairs) {
    assert.equal(FINGERS[left].color, FINGERS[right].color, left + ' a ' + right);
  }
  const colors = new Set(pairs.map(([f]) => FINGERS[f].color));
  assert.equal(colors.size, 4, 'čtyři barvy, ne osm');
  assert.equal(colors.has(FINGERS.th.color), false, 'palec má vlastní odstín');
});

test('slovo se ve cvičení neopakuje hned za sebou', () => {
  const i = LESSONS.findIndex((l) => l.id === 'L04');
  const lesson = LESSONS[i];
  const ctx = { allowed: allowedCharsUpTo(i), keyStats: {}, uppercase: false };
  for (let round = 0; round < 20; round++) {
    const words = buildStep(lesson, lesson.steps[2], ctx, 2).lines.join(' ').split(' ');
    for (let k = 1; k < words.length; k++) {
      assert.notEqual(words[k], words[k - 1], 'dvě stejná slova hned vedle sebe');
    }
  }
});

test('Backspace se zapne až v lekci, která ho vysvětlí', () => {
  const at = LESSONS.findIndex((l) => l.introducesBackspace);
  assert.ok(at > 0, 'chybí lekce, která zavádí opravu chyb');
  assert.equal(backspaceAllowedAt(at - 1), false, 'před tou lekcí se nemaže');
  assert.equal(backspaceAllowedAt(at), true);
  assert.equal(backspaceAllowedAt(LESSONS.length - 1), true, 'dál už platí všude');
  assert.ok(LESSONS[at].intro.lead.includes('Backspace'));
});

/* -------------------------------------------------------------------- odměny */

test('obrázek k vytištění je jen obrys, bez barevných výplní', () => {
  for (const s of STICKERS) {
    const svg = outlineSvg(s.id);
    const colors = svg.match(/(fill|stroke)="#[0-9a-fA-F]{3,6}"/g) || [];
    for (const c of colors) {
      assert.ok(
        c === 'fill="#fff"' || c === 'stroke="#1c1c1c"',
        `${s.id}: v obrysu zbyla barva ${c}`
      );
    }
    assert.equal((svg.match(/</g) || []).length, (svg.match(/>/g) || []).length,
      s.id + ': rozbitý obrys');
    assert.ok(svg.includes('stroke="#1c1c1c"'), s.id + ': obrys nemá linku');

    // Tlustý tah je v barevné kresbě plocha, ale v obrysu by z něj byl černý
    // blok. Takhle se rozbíjela duha a chobot slona.
    for (const m of svg.matchAll(/stroke-width="([\d.]+)"/g)) {
      assert.ok(Number(m[1]) <= 3, `${s.id}: tah tloušťky ${m[1]} by se vytiskl jako blok`);
    }
  }
});

test('obrázky mají jedinečná id a platné SVG', () => {
  const ids = new Set();
  for (const s of STICKERS) {
    assert.ok(!ids.has(s.id), 'duplicitní id ' + s.id);
    ids.add(s.id);
    const svg = stickerSvg(s.id);
    assert.ok(svg.startsWith('<svg'), s.id + ': není SVG');
    assert.ok(svg.includes('</svg>'), s.id + ': neuzavřené SVG');
    const open = (svg.match(/</g) || []).length;
    const close = (svg.match(/>/g) || []).length;
    assert.equal(open, close, s.id + ': rozbitý zápis značek');
  }
  assert.ok(STICKERS.length >= 20);
});

test('bez hvězdičky není odměna, první hotová lekce ji dostane vždy', () => {
  const empty = { stickers: [], lessons: {} };
  assert.equal(maybeAward(empty, 'L01', 0), null);
  assert.ok(maybeAward(empty, 'L01', 1), 'první odměna má přijít jistě');
});

test('za jednu lekci se obrázek nedává dvakrát', () => {
  const p = { stickers: [{ id: 'jezek', lessonId: 'L01' }], lessons: { L01: { stars: 2 } } };
  assert.equal(maybeAward(p, 'L01', 3), null);
});

test('sbírka se nikdy nepřetáhne přes počet obrázků', () => {
  const p = {
    stickers: STICKERS.map((s) => ({ id: s.id, lessonId: 'x' })),
    lessons: {},
  };
  assert.equal(maybeAward(p, 'L28', 3), null);
});

/* ----------------------------------------- cvičení navíc vyrobí vždy text */

test('každý druh cvičení navíc vyrobí text v každé fázi osnovy', async () => {
  const { practiceLesson, KINDS } = await import('../web/js/practice.js');
  const { allowedCharsUpTo, knowsUppercase, LESSONS } = await import('../web/js/curriculum.js');

  for (const index of [2, 5, 12, 20, 27, LESSONS.length - 1]) {
    for (const kind of Object.keys(KINDS)) {
      const lesson = practiceLesson(kind, index);
      for (const step of lesson.steps) {
        const built = buildStep(lesson, step, {
          allowed: allowedCharsUpTo(index),
          keyStats: {},
          uppercase: knowsUppercase(index),
          layout: 'cs-qwertz',
        }, 0);
        assert.ok(built.lines.length, `${kind} v lekci ${index} nevyrobil ani řádek`);
        for (const line of built.lines) {
          assert.ok(line.trim().length > 3, `${kind} v lekci ${index}: krátký řádek "${line}"`);
        }
      }
    }
  }
});

test('cvičení navíc nesmí použít znak, který se dítě ještě neučilo', async () => {
  const { practiceLesson } = await import('../web/js/practice.js');
  const { allowedCharsUpTo, knowsUppercase, LESSONS } = await import('../web/js/curriculum.js');
  const index = 6;
  const allowed = allowedCharsUpTo(index);

  // zadat jde jen druh, který dítě už dělalo, proto se bere z probraných lekcí
  const seen = new Set(LESSONS.slice(0, index + 1).flatMap((l) => l.steps.map((st) => st.kind)));

  for (const kind of seen) {
    const lesson = practiceLesson(kind, index);
    for (const step of lesson.steps) {
      const built = buildStep(lesson, step, {
        allowed, keyStats: {}, uppercase: knowsUppercase(index), layout: 'cs-qwertz',
      }, 0);
      for (const line of built.lines) {
        for (const ch of line) {
          if (ch === ' ') continue;
          assert.ok(allowed.has(ch) || allowed.has(ch.toLowerCase()),
            `${kind}: znak "${ch}" se ještě neučil`);
        }
      }
    }
  }
});

test('rozcvička připomíná i starší klávesy, nejen ty z poslední lekce', () => {
  const index = LESSONS.findIndex((l) => l.id === 'L17'); // dolní řada, za sebou má základní i horní
  const lesson = LESSONS[index];
  const step = lesson.steps.find((s) => s.kind === 'warmup');
  const allowed = allowedCharsUpTo(index);

  // sevření vypadá jako "fgf": uprostřed je klávesa, o kterou jde
  const seen = new Set();
  for (let run = 0; run < 30; run++) {
    const built = buildStep(lesson, step, { allowed, keyStats: {}, layout: 'cs-qwertz' }, 0);
    for (const grip of built.lines[1].split(' ')) seen.add(grip[1]);
  }

  const fromTopRow = [...seen].filter((c) => 'eiruoptzwq'.includes(c));
  assert.ok(fromTopRow.length >= 3,
    `rozcvička se drží jen poslední látky, z horní řady se objevilo ${fromTopRow.length} kláves`);
});

test('rozcvička vždycky připomene i dvě nejčerstvější klávesy', () => {
  const index = LESSONS.findIndex((l) => l.id === 'L17'); // lekce B a N, nejčerstvější probrané jsou X a tečka
  const lesson = LESSONS[index];
  const step = lesson.steps.find((s) => s.kind === 'warmup');
  const allowed = allowedCharsUpTo(index);

  for (let run = 0; run < 10; run++) {
    const row = buildStep(lesson, step, { allowed, keyStats: {}, layout: 'cs-qwertz' }, 0).lines[1];
    assert.match(row, /sxs/, 'chybí nejčerstvější klávesa X');
    assert.match(row, /l.l/, 'chybí nejčerstvější tečka');
  }
});

test('rozcvička nezapomene na písmena skládaná mrtvou klávesou', () => {
  const index = LESSONS.findIndex((l) => l.id === 'L28'); // hned po lekci s ď ť ň ó
  const lesson = LESSONS[index];
  const step = lesson.steps.find((s) => s.kind === 'warmup');
  const allowed = allowedCharsUpTo(index);

  const seen = new Set();
  for (let run = 0; run < 40; run++) {
    const text = buildStep(lesson, step, { allowed, keyStats: {}, layout: 'cs-qwertz' }, 0).lines.join(' ');
    for (const ch of 'ďťňó') if (text.includes(ch)) seen.add(ch);
  }
  assert.ok(seen.size >= 2, `skládaná písmena z rozcvičky vypadla, objevila se jen ${[...seen].join('')}`);
});

test('každá lekce si v rozcvičce připomene písmena té předchozí', () => {
  for (let i = 1; i < LESSONS.length; i++) {
    const step = LESSONS[i].steps.find((s) => s.kind === 'warmup');
    if (!step) continue;
    const prev = (LESSONS[i - 1].newKeys || []).filter((k) => k.length === 1 && /\p{Ll}/u.test(k));
    if (!prev.length) continue;

    const allowed = allowedCharsUpTo(i);
    for (let run = 0; run < 5; run++) {
      const text = buildStep(LESSONS[i], step, { allowed, keyStats: {}, layout: 'cs-qwertz' }, 0).lines.join(' ');
      assert.ok(prev.some((k) => text.includes(k)),
        `${LESSONS[i].id}: v rozcvičce chybí ${prev.join(' ')} z minulé lekce`);
    }
  }
});

test('první řádek rozcvičky je základní řada a za ní poslední naučená písmena', () => {
  const index = LESSONS.findIndex((l) => l.id === 'L18'); // po lekcích s X a s B, N
  const lesson = LESSONS[index];
  const step = lesson.steps.find((s) => s.kind === 'warmup');
  const row = buildStep(lesson, step, {
    allowed: allowedCharsUpTo(index), keyStats: {}, layout: 'cs-qwertz',
  }, 0).lines[0];

  const groups = row.split(' ');
  assert.equal(groups[0], 'fff', 'začíná se doma');
  assert.ok(row.includes('ůůů') && row.includes('hhh'), 'chybí celá základní řada');
  assert.ok(row.includes('bbb') && row.includes('nnn'), 'chybí písmena z minulé lekce');
  assert.ok(!/[^\p{L}\s]/u.test(row), `do prvního řádku se dostala interpunkce: ${row}`);

  // v jednom průchodu se žádná skupinka neopakuje, fillRow ho pak celý zopakuje
  const first = groups.slice(0, 13);
  assert.equal(new Set(first).size, first.length, `zdvojená skupinka: ${first.join(' ')}`);
});

test('dvojice písmen v lekci patří stejnému prstu na obou rukou', async () => {
  const { keyForChar } = await import('../web/js/keyboard.js');
  // Číselná řada s diakritikou tomu uniká: ěščřžýáíé leží vedle sebe a páruje
  // se po sousedech, symetrii tam rozložení klávesnice neumožňuje.
  const numberRow = new Set(['L21', 'L22', 'L23', 'L24', 'L25']);

  for (const lesson of LESSONS) {
    if (numberRow.has(lesson.id)) continue;
    const keys = (lesson.newKeys || []).filter((k) => k.length === 1);
    if (keys.length !== 2) continue;

    const fingers = keys.map((c) => (keyForChar(c, 'cs-qwertz') || {}).finger);
    if (fingers.some((f) => !f)) continue;
    assert.equal(fingers[0].slice(1), fingers[1].slice(1),
      `${lesson.id} (${keys.join(' ')}): každá klávesa patří jinému prstu`);
    assert.notEqual(fingers[0][0], fingers[1][0],
      `${lesson.id} (${keys.join(' ')}): obě klávesy jsou na jedné ruce, nejde je střídat`);
  }
});

test('v prvních lekcích se slova míchají se slabikami, ať se neopakují', () => {
  const index = LESSONS.findIndex((l) => l.id === 'L04');
  const lesson = LESSONS[index];
  const step = lesson.steps.find((s) => s.kind === 'words');
  const lines = buildStep(lesson, step, {
    allowed: allowedCharsUpTo(index), keyStats: {}, layout: 'cs-qwertz',
  }, 0).lines;

  const pieces = lines.join(' ').split(' ');
  const counts = new Map();
  for (const p of pieces) counts.set(p, (counts.get(p) || 0) + 1);
  // Slov je v téhle fázi šestnáct, takže se bez opakování cvičení složit
  // nedá. Jde o to, aby jich bylo v oběhu výrazně víc než jen ta slova.
  const worst = Math.max(...counts.values());
  assert.ok(worst <= 7, `jeden kousek je v cvičení ${worst}krát, to je moc dokola`);
  assert.ok(counts.size >= 25, `v cvičení je jen ${counts.size} různých kousků, slovník sám jich dá 16`);
});

test('slovník nemá duplicity ani znaky mimo českou klávesnici', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const words = JSON.parse(fs.readFileSync(path.join(here, '../web/content/words-cs.json'), 'utf8'));
  assert.equal(words.length, new Set(words).size, 've slovníku je slovo dvakrát');

  const allowed = new Set('abcdefghijklmnopqrstuvwxyzáéíóúůýčďěňřšťž');
  for (const w of words) {
    for (const ch of w) {
      assert.ok(allowed.has(ch), `slovo "${w}" má znak "${ch}", který se na české klávesnici nenapíše`);
    }
  }
});

test('lekce na W a Q staví jen na anglických slovech s těmi písmeny', () => {
  const index = LESSONS.findIndex((l) => l.id === 'L13B');
  assert.ok(index > 0, 'lekce na W a Q v osnově chybí');

  const lesson = LESSONS[index];
  const allowed = allowedCharsUpTo(index);
  assert.deepEqual(lesson.newKeys, [], 'nová písmena se tu neučí');

  for (const step of lesson.steps.filter((s) => s.kind === 'english')) {
    const lines = buildStep(lesson, step, { allowed, keyStats: {}, layout: 'cs-qwertz' }, 0).lines;
    assert.equal(lines.length, step.lines, `${step.label}: chybí řádek`);
    for (const word of lines.join(' ').split(' ')) {
      assert.match(word, step.mode === 'q' ? /q/ : /[wq]/,
        `${step.label}: slovo "${word}" necvičí ani W ani Q`);
      for (const ch of word) {
        assert.ok(allowed.has(ch), `slovo "${word}" má znak "${ch}", který se dítě ještě neučilo`);
      }
    }
  }
});

test('lekce na W a Q leží hned za horní řadou', () => {
  const index = LESSONS.findIndex((l) => l.id === 'L13B');
  assert.equal(LESSONS[index - 1].id, 'L13', 'má přijít po dokončené horní řadě');
  assert.equal(LESSONS[index + 1].block, 'Dolní řada', 'a hned před dolní řadou');
});
