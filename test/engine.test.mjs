/**
 * Testy jádra psaní proti malé náhradě DOM.
 * Ověřují to, co se v prohlížeči těžko zkouší ručně: počítání chyb, čas,
 * přechody mezi řádky, Backspace a skládání znaků mrtvou klávesou.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDom, typeText, typeDead } from './dom-stub.mjs';

/** Najde prvek s danou třídou kdekoli ve stromu. */
function find(el, cls) {
  if (el.classList && el.classList.contains(cls)) return el;
  for (const c of el.children || []) {
    const hit = find(c, cls);
    if (hit) return hit;
  }
  return null;
}

const dom = installDom();
const { createEngine } = await import('../web/js/engine.js');

/** Připraví engine s daným cvičením a vrátí vše potřebné. */
function setup(lines, options = {}) {
  dom.clock.now = 0;
  const root = dom.root.constructor ? new (dom.root.constructor)('div') : null;
  const host = document.createElement('div');
  let result = null;
  const engine = createEngine(host, {
    sound: 'off',
    onFinish: (r) => { result = r; },
    ...options,
  });
  engine.load(lines);
  const input = dom.inputOf(host);
  input.focus();
  return { engine, input, host, getResult: () => result, clock: dom.clock };
}

test('bezchybné opsání dá stoprocentní přesnost', () => {
  const { engine, input, getResult, clock } = setup(['fff jjj']);
  typeText(input, 'fff jjj', clock, 200);
  const r = getResult();
  assert.ok(r, 'cvičení mělo skončit');
  assert.equal(r.typed, 7);
  assert.equal(r.errors, 0);
  assert.equal(engine.isFinished(), true);
});

test('překlep se započítá, ale psaní pokračuje dál', () => {
  const { input, getResult, clock } = setup(['fjf']);
  typeText(input, 'fkf', clock);
  const r = getResult();
  assert.equal(r.typed, 3);
  assert.equal(r.errors, 1);
});

test('Backspace chybu z výsledku nesmaže', () => {
  const { input, getResult, clock } = setup(['fjf'], { allowBackspace: true });
  typeText(input, 'fk', clock);           // druhý znak špatně
  input.dispatch('keydown', { key: 'Backspace' });
  typeText(input, 'jf', clock);           // oprava a dopsání
  const r = getResult();
  assert.equal(r.errors, 1, 'chyba zůstává započítaná');
  assert.equal(r.typed, 4, 'oprava je další úhoz');
});

test('řádky se přepínají samy a mezera navíc se spolkne', () => {
  const { input, getResult, clock } = setup(['abc', 'def']);
  typeText(input, 'abc def', clock);
  const r = getResult();
  assert.equal(r.typed, 6, 'mezera mezi řádky se nepočítá jako úhoz');
  assert.equal(r.errors, 0);
});

test('znak napsaný přes konec řádku patří dalšímu řádku', () => {
  const { input, getResult, clock } = setup(['ab', 'cd']);
  typeText(input, 'abcd', clock);
  const r = getResult();
  assert.equal(r.typed, 4);
  assert.equal(r.errors, 0);
});

test('čas se měří mezi úhozy a dlouhá pauza se nepočítá', () => {
  const { input, getResult, clock } = setup(['abcd']);
  typeText(input, 'ab', clock, 200);      // první úhoz startuje, druhý přidá 200 ms
  clock.now += 60000;                     // dítě odešlo od počítače
  input.value = 'c';
  input.dispatch('input');
  typeText(input, 'd', clock, 200);
  const r = getResult();
  assert.equal(r.durationMs, 400, 'započítá se jen 200 + 200 ms skutečného psaní');
});

test('reakční doba se ukládá ke správnému znaku', () => {
  const { input, getResult, clock } = setup(['abc']);
  typeText(input, 'abc', clock, 250);
  const r = getResult();
  assert.deepEqual(r.keyLog.map((k) => k.char), ['a', 'b', 'c']);
  assert.equal(r.keyLog[0].latency, 0, 'první úhoz nemá s čím se porovnat');
  assert.equal(r.keyLog[1].latency, 250);
  assert.equal(r.keyLog[2].latency, 250);
});

test('znak skládaný mrtvou klávesou projde jako jeden úhoz', async () => {
  const { input, getResult, clock } = setup(['loď']);
  typeText(input, 'lo', clock);
  await typeDead(input, 'ď', clock);
  const r = getResult();
  assert.ok(r, 'cvičení mělo skončit');
  assert.equal(r.typed, 3);
  assert.equal(r.errors, 0);
});

test('během skládání se nic nepředčasně nezapočítá', async () => {
  const { engine, input, clock } = setup(['ďas']);
  input.dispatch('compositionstart');
  input.value = 'ˇ';                       // sama čárka nebo háček se nepíše
  input.dispatch('input');
  assert.equal(engine.snapshot().typed, 0, 'mrtvá klávesa není úhoz');
  input.value = 'ď';
  input.dispatch('compositionend');
  await Promise.resolve();
  assert.equal(engine.snapshot().typed, 1);
});

test('nápověda ukazuje další znak včetně přechodu na nový řádek', () => {
  const { engine, input, clock } = setup(['ab', 'cd']);
  assert.equal(engine.nextChar(), 'a');
  typeText(input, 'a', clock);
  assert.equal(engine.nextChar(), 'b');
  typeText(input, 'b', clock);
  assert.equal(engine.nextChar(), 'c', 'po dopsání řádku se ukáže první znak dalšího');
});

test('po dopsání se už další úhozy nepočítají', () => {
  const { input, getResult, clock } = setup(['ab']);
  typeText(input, 'abxxxx', clock);
  assert.equal(getResult().typed, 2);
});

test('výzva ke kliknutí se schová po zaostření a vrátí po opuštění', () => {
  const { input, host } = setup(['ab']);
  const blur = find(host, 'engine__blur');
  assert.equal(blur.hidden, true, 'po zaostření je text schovaný');
  input.blur();
  assert.equal(blur.hidden, false);
});

test('zapnutý zvuk cvičení nerozbije ani bez zvukové karty', () => {
  const { input, getResult, clock } = setup(['ab'], { sound: 'all' });
  typeText(input, 'ax', clock);
  assert.equal(getResult().errors, 1);
});

test('řádek s příliš mnoha chybami se píše znovu', () => {
  const { engine, input, getResult, clock } = setup(['abcd', 'efgh'], { maxLineErrors: 2 });
  typeText(input, 'xxxd', clock);            // tři chyby na prvním řádku
  assert.equal(getResult(), null, 'cvičení nesmí skončit ani pokročit');
  assert.equal(engine.nextChar(), 'a', 'kurzor je zpátky na začátku téhož řádku');

  typeText(input, 'abcd', clock);            // druhý pokus čistě
  assert.equal(engine.nextChar(), 'e', 'teprve teď se jde na další řádek');
});

test('dvě chyby na řádku ještě projdou', () => {
  const { engine, input, clock } = setup(['abcd', 'efgh'], { maxLineErrors: 2 });
  typeText(input, 'xxcd', clock);
  assert.equal(engine.nextChar(), 'e', 'limit je dvě chyby, ne jedna');
});

test('po třech pokusech se pokračuje dál, ať se dítě nezasekne', () => {
  const { engine, input, getResult, clock } = setup(['abcd'], { maxLineErrors: 2 });
  typeText(input, 'xxxx', clock);
  assert.equal(getResult(), null, 'po prvním pokusu se opakuje');
  typeText(input, 'xxxx', clock);
  assert.equal(getResult(), null, 'po druhém taky');
  typeText(input, 'xxxx', clock);
  const r = getResult();
  assert.ok(r, 'třetí pokus už cvičení ukončí');
  assert.equal(r.typed, 12, 'všechny tři pokusy se počítají do statistiky');
  assert.equal(r.errors, 12);
});

test('bez omezení se pokračuje i s hromadou chyb', () => {
  const { engine, input, clock } = setup(['abcd', 'efgh'], { maxLineErrors: 0 });
  typeText(input, 'xxxx', clock);
  assert.equal(engine.nextChar(), 'e');
});

test('Backspace v prvních lekcích nefunguje', () => {
  const { engine, input, clock } = setup(['abcd']);
  typeText(input, 'ax', clock);
  input.dispatch('keydown', { key: 'Backspace' });
  assert.equal(engine.nextChar(), 'c', 'kurzor se nesmí vrátit');
});

test('Backspace funguje, když ho lekce povolí', () => {
  const { engine, input, clock } = setup(['abcd'], { allowBackspace: true });
  typeText(input, 'ax', clock);
  input.dispatch('keydown', { key: 'Backspace' });
  assert.equal(engine.nextChar(), 'b', 'kurzor se vrátil na opravovaný znak');
});

test('cvičení nikdy nezačíná ani nekončí mezerou', () => {
  const { engine, input, getResult, clock } = setup(['  ahoj tady  ', '', '  konec ']);
  assert.equal(engine.nextChar(), 'a', 'mezery na začátku se ořízly');
  typeText(input, 'ahoj tady', clock);
  assert.equal(engine.nextChar(), 'k', 'prázdný řádek se zahodil');
  typeText(input, 'konec', clock);
  const r = getResult();
  assert.ok(r, 'cvičení skončilo posledním písmenem, ne mezerou');
  assert.equal(r.errors, 0);
  assert.equal(r.typed, 14);
});

test('dvě mezery uvnitř řádku se srazí na jednu', () => {
  const { input, getResult, clock } = setup(['ahoj   tady']);
  typeText(input, 'ahoj tady', clock);
  assert.equal(getResult().errors, 0);
});

test('ukazatel postupu roste od nuly do sta procent', () => {
  const { input, host, clock } = setup(['abcd']);
  const bar = find(host, 'engine__bar');
  assert.equal(bar.children[0].style.width, '0%');
  typeText(input, 'ab', clock);
  assert.equal(bar.children[0].style.width, '50%');
});
