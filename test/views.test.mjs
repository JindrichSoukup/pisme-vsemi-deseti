/**
 * Testy obrazovek, které se dají vykreslit bez prohlížeče.
 * Stránka pro rodiče jen skládá text do innerHTML, takže na ni stačí náhrada DOM.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDom } from './dom-stub.mjs';

installDom();
const parents = await import('../web/js/views/parents.js');
const { LESSONS } = await import('../web/js/curriculum.js');

/** Profil, který má za sebou tři lekce s různým počtem hvězdiček. */
function sampleProfile() {
  return {
    id: 'zkouska',
    name: 'Jana Nováková',
    createdAt: '2026-09-01T10:00:00.000Z',
    settings: { layout: 'cs-qwertz' },
    lessons: {
      L01: { stars: 3, bestCpm: 52, bestAccuracy: 0.99, lastAt: '2026-09-08T10:00:00.000Z', attempts: [{ at: '2026-09-08T10:00:00.000Z', netCpm: 52, accuracy: 0.99 }] },
      L02: { stars: 2, bestCpm: 44, bestAccuracy: 0.96, lastAt: '2026-09-09T10:00:00.000Z', attempts: [{ at: '2026-09-09T10:00:00.000Z', netCpm: 44, accuracy: 0.96 }] },
      L03: { stars: 0, bestCpm: 30, bestAccuracy: 0.84, lastAt: '2026-09-10T10:00:00.000Z', attempts: [{ at: '2026-09-10T10:00:00.000Z', netCpm: 30, accuracy: 0.84 }] },
    },
    keyStats: { f: { presses: 200, errors: 8, latencyEma: 420 } },
    stickers: [],
    days: { '2026-09-08': { seconds: 600, keystrokes: 900, errors: 20 } },
  };
}

async function renderParents(profile) {
  const root = document.createElement('div');
  const app = { profile, root, async refreshProfile() {} };
  await parents.render(app);
  return root.innerHTML;
}

test('rodičovská stránka ukáže, kolik hvězdiček dítě má', async () => {
  const html = await renderParents(sampleProfile());
  assert.match(html, /hvězdiček z \d+ možných/, 'chybí souhrn hvězdiček');
  assert.match(html, /<b>5<\/b>/, '3 + 2 + 0 = 5 hvězdiček');
  assert.match(html, new RegExp(String(LESSONS.length * 3)), 'chybí maximum');
});

test('rodičovská stránka vypíše hvězdičky u jednotlivých lekcí', async () => {
  const html = await renderParents(sampleProfile());
  assert.ok(html.includes('★★★'), 'lekce na tři hvězdičky');
  assert.ok(html.includes('★★<span class="off">☆</span>'), 'lekce na dvě hvězdičky');
  assert.ok(html.includes(LESSONS[0].title), 'chybí název lekce');
  assert.match(html, /52 ÚPM/, 'chybí nejlepší rychlost');
});

/* ---------------------------------------------------- nápověda nad klávesnicí */

const { hintText } = await import('../web/js/views/lesson.js');
const { keyForChar, allChars } = await import('../web/js/keyboard.js');
const { focusSoon } = await import('../web/js/ui.js');

/** Ženský přívlastek nesmí stát přímo před mužským názvem prstu. */
const SPATNA_SHODA = /(levá|pravá)\s+(malíček|prsteníček|prostředníček|ukazováček|palec)/;

test('nápověda nikde nesplete rod ruky a prstu', () => {
  const chars = allChars('cs-qwertz');
  assert.ok(chars.length > 40, 'kontrolují se všechny znaky klávesnice');
  for (const ch of chars) {
    for (const composing of [false, true]) {
      const text = hintText(ch, keyForChar(ch), composing);
      assert.ok(!SPATNA_SHODA.test(text), `špatná shoda u "${ch}": ${text}`);
      assert.ok(!/undefined|NaN/.test(text), `rozbitý text u "${ch}": ${text}`);
    }
  }
});

test('nápověda pojmenuje ruku i prst zvlášť', () => {
  assert.match(hintText('s', keyForChar('s')), /levá ruka<\/span>, prsteníček$/);
  assert.match(hintText('l', keyForChar('l')), /pravá ruka<\/span>, prsteníček$/);
  assert.match(hintText(' ', keyForChar(' ')), /mezerník/);
  assert.match(hintText('A', keyForChar('A')), /Shift pravým malíčkem$/);
  assert.match(hintText('ď', keyForChar('ď')), /nejdřív háček pravým malíčkem/);
  assert.match(hintText('ó', keyForChar('ó')), /nejdřív čárka pravým malíčkem/);
  assert.equal(hintText('x', null), '');
});

/* ------------------------------------------- návrat do rozdělaného cvičení */

const { stepChooser } = await import('../web/js/views/lesson.js');
const lesson = LESSONS[4];

test('poprvé je jen jedno tlačítko a žádný výběr cvičení', () => {
  const html = stepChooser(lesson, { lessons: {} });
  assert.match(html, /Jdeme na to/);
  assert.match(html, /data-step="0"/);
  assert.ok(!html.includes('data-jump'), 'napoprvé se nabídka částí neukazuje');
});

test('rozdělaná lekce nabídne návrat tam, kde dítě skončilo', () => {
  const html = stepChooser(lesson, { lessons: { [lesson.id]: { lastStep: 2, attempts: [] } } });
  assert.match(html, /Pokračovat: /);
  assert.ok(html.includes(lesson.steps[2].label), 'v tlačítku je jméno toho cvičení');
  assert.match(html, /data-step="2"/);
  assert.match(html, /Raději od začátku/);
});

test('po dokončení jde zopakovat jen jedno cvičení', () => {
  const html = stepChooser(lesson, { lessons: { [lesson.id]: { stars: 2, attempts: [{}] } } });
  assert.match(html, /Jdeme na to/);
  for (let i = 0; i < lesson.steps.length; i++) {
    assert.ok(html.includes(`data-jump="${i}"`), 'chybí tlačítko na krok ' + i);
    assert.ok(html.includes(lesson.steps[i].label), 'chybí název kroku ' + i);
  }
});

test('nesmyslný uložený krok se ignoruje', () => {
  const html = stepChooser(lesson, { lessons: { [lesson.id]: { lastStep: 99 } } });
  assert.match(html, /Jdeme na to/);
  assert.ok(!html.includes('Pokračovat: '));
});

/* --------------------------------------------------- mezera po dopsání cvičení */

test('mezera hned po dopsání cvičení tlačítko nezmáčkne', async () => {
  const btn = document.createElement('button');
  let prevented = 0;
  focusSoon(btn, 40);
  btn.dispatch('keydown', { key: ' ', preventDefault() { prevented += 1; } });
  assert.equal(prevented, 1, 'mezera hned po dopsání se spolkne');

  await new Promise((r) => setTimeout(r, 60));
  btn.dispatch('keydown', { key: ' ', preventDefault() { prevented += 1; } });
  assert.equal(prevented, 1, 'za chvilku už mezera tlačítko zmáčknout smí');
});

/* ------------------------------------------------------- dnešní cíl dítěte */

const { dailyGoal } = await import('../web/js/views/home.js');

test('než se začne, vidí dítě jen dnešní cíl', () => {
  const g = dailyGoal(0, 10);
  assert.equal(g.done, false);
  assert.equal(g.percent, 0);
  assert.match(g.headline, /10 minut/);
  assert.ok(!/lekc/.test(g.headline), 'nemluví se o celkovém počtu lekcí');
});

test('rozdělaný cíl ukazuje, co zbývá, ne kolik chybí do konce kurzu', () => {
  const g = dailyGoal(6 * 60, 10);
  assert.equal(g.done, false);
  assert.equal(g.percent, 60);
  assert.match(g.headline, /zbývají 4 minuty/);
  assert.match(g.note, /máš za sebou 6 minut/);
});

test('po splnění přijde pochvala za vydržený čas, ne za chytrost', () => {
  const g = dailyGoal(11 * 60, 10);
  assert.equal(g.done, true);
  assert.match(g.headline, /hotovo/);
  assert.match(g.headline, /11 minut/);
  assert.ok(!/šikovn|chytr|nejlep/i.test(g.headline + g.note), 'nechválí se dítě, ale odvedená práce');
  assert.match(g.note, /Můžeš skončit/, 'po splnění se nikam netlačí');
});

/* --------------------------------------------------- kolik ještě zbývá */

const { remainingText } = await import('../web/js/views/lesson.js');
const { recentSpeed, remainingWork } = await import('../web/js/stats.js');

test('rychlost se bere z posledních celých pokusů', () => {
  const profile = {
    lessons: {
      L01: { attempts: [
        { at: '2026-09-01T10:00:00.000Z', netCpm: 40 },
        { at: '2026-09-02T10:00:00.000Z', netCpm: 60 },
      ] },
      L02: { attempts: [
        { at: '2026-09-03T10:00:00.000Z', netCpm: 200, partial: true },
      ] },
    },
  };
  assert.equal(recentSpeed(profile), 50, 'částečné opakování se do rychlosti nepočítá');
  assert.equal(recentSpeed({ lessons: {} }), 0, 'bez pokusů se nic nepředstírá');
});

test('odhad zbytku lekce počítá s tím, jak dítě píše', () => {
  const lesson = { steps: [{ lines: 3 }, { lines: 3 }], targetCpm: 100 };
  const pomalu = remainingWork(lesson, 0, 30);
  const rychle = remainingWork(lesson, 0, 120);
  assert.equal(pomalu.steps, 2);
  assert.ok(pomalu.minutes > rychle.minutes, 'pomalejší dítě potřebuje víc času');
  assert.equal(remainingWork(lesson, 2, 60).steps, 0, 'na konci nezbývá nic');
});

test('zbytek lekce se řekne povzbudivě a česky', () => {
  assert.match(remainingText({ steps: 2, minutes: 3 }), /^Zvládneš ještě dvě cvičení\? Je to tak na 3 minuty\.$/);
  assert.match(remainingText({ steps: 5, minutes: 8 }), /^Dáš ještě pět cvičení\? Je to tak na 8 minut\.$/);
  assert.match(remainingText({ steps: 1, minutes: 1 }), /^Zbývá poslední cvičení, tak na 1 minutu\.$/);
  assert.match(remainingText({ steps: 0, minutes: 0 }), /všechno/);
});

/* -------------------------------------------------------------- oslovení */

const { vocative } = await import('../web/js/vocative.js');

test('ženská jména se oslovují na -o', () => {
  const cases = {
    Anna: 'Anno', Eliška: 'Eliško', Tereza: 'Terezo', Klára: 'Kláro',
    Kristýna: 'Kristýno', Bára: 'Báro', Ema: 'Emo', Zuzana: 'Zuzano',
  };
  for (const [jmeno, tvar] of Object.entries(cases)) assert.equal(vocative(jmeno), tvar);
});

test('jména na -e a -í se nemění', () => {
  for (const jmeno of ['Marie', 'Lucie', 'Alice', 'Natálie', 'Jiří', 'Otto', 'Hugo']) {
    assert.equal(vocative(jmeno), jmeno);
  }
});

test('mužská jména dostanou správnou koncovku', () => {
  const cases = {
    Jakub: 'Jakube', Adam: 'Adame', Jan: 'Jane', Filip: 'Filipe', David: 'Davide',
    Michal: 'Michale', Štěpán: 'Štěpáne', Václav: 'Václave',
    Tomáš: 'Tomáši', Lukáš: 'Lukáši', Ondřej: 'Ondřeji', Matěj: 'Matěji',
    Marek: 'Marku', Radek: 'Radku', Patrik: 'Patriku', Vojtěch: 'Vojtěchu',
    Pavel: 'Pavle', Karel: 'Karle',
    Petr: 'Petře', Otakar: 'Otakare',
    Honza: 'Honzo', Jirka: 'Jirko',
  };
  for (const [jmeno, tvar] of Object.entries(cases)) assert.equal(vocative(jmeno), tvar);
});

test('bere se jen křestní jméno a prázdný vstup nespadne', () => {
  assert.equal(vocative('Anna Nováková'), 'Anno');
  assert.equal(vocative('  Petr  '), 'Petře');
  assert.equal(vocative(''), '');
  assert.equal(vocative(null), '');
  assert.equal(vocative('A'), 'A', 'jednopísmenné jméno se nechá být');
});

/* ------------------------------------------------------------ mapa lekcí */

const { lessonMap } = await import('../web/js/views/home.js');

/** Profil, který má za sebou prvních pět lekcí a šestou rozdělanou. */
function progressed() {
  const lessons = {};
  for (let i = 0; i < 5; i++) {
    lessons[LESSONS[i].id] = { stars: 2, attempts: [{ at: '2026-09-01T10:00:00.000Z' }] };
  }
  return { lessons };
}

test('nahoře je lekce, kterou dítě zrovna dělá', () => {
  const html = lessonMap(progressed(), 5);
  const teď = html.indexOf('Teď');
  const umis = html.indexOf('Co už umíš');
  assert.ok(teď >= 0 && umis > teď, 'aktuální lekce stojí nad hotovými');
  assert.ok(html.indexOf(LESSONS[5].title) < umis, 'v sekci Teď je šestá lekce');
});

test('hotové lekce jdou od nejnovější k nejstarší', () => {
  const html = lessonMap(progressed(), 5);
  const poradi = [0, 1, 2, 3, 4].map((i) => html.indexOf(LESSONS[i].title));
  for (const p of poradi) assert.ok(p >= 0, 'chybí některá hotová lekce');
  for (let i = 1; i < poradi.length; i++) {
    assert.ok(poradi[i] < poradi[i - 1], 'starší lekce má být níž než novější');
  }
});

test('co teprve přijde, je schované pod odkazem', () => {
  const html = lessonMap(progressed(), 5);
  const details = html.indexOf('<details');
  assert.ok(details > 0, 'chybí schovaná část');
  assert.ok(html.indexOf(LESSONS[20].title) > details, 'budoucí lekce jsou uvnitř');
  assert.ok(html.indexOf(LESSONS[4].title) < details, 'hotové lekce zůstávají venku');
});

test('na začátku je vidět jen první lekce a schovaný zbytek', () => {
  const html = lessonMap({ lessons: {} }, 0);
  assert.ok(html.includes(LESSONS[0].title));
  assert.ok(!html.includes('Co už umíš'), 'bez hotových lekcí se ta sekce neukazuje');
});

test('skloňování minut sedí', () => {
  assert.match(dailyGoal(9 * 60, 10).headline, /zbývá 1 minuta/);
  assert.match(dailyGoal(0, 5).headline, /čeká 5 minut/);
  assert.match(dailyGoal(0, 2).headline, /čekají 2 minuty/);
});

test('u prázdného profilu se nic nerozbije', async () => {
  const empty = { ...sampleProfile(), lessons: {}, days: {}, keyStats: {} };
  const html = await renderParents(empty);
  assert.match(html, /Zatím žádná dokončená lekce/);
});
