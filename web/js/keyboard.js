/**
 * Česká klávesnice QWERTZ: data o rozložení, přiřazení prstů a vykreslení.
 *
 * Prsty:  lp = levý malíček, lr = levý prsteníček, lm = levý prostředníček,
 *         li = levý ukazováček, ri = pravý ukazováček, rm = pravý prostředníček,
 *         rr = pravý prsteníček, rp = pravý malíček, th = palec.
 */

/**
 * Barvy prstů. Stejný prst má na obou rukou stejnou barvu, takže barev stačí
 * čtyři a jdou od sebe rozeznat na první pohled. Osm tlumených odstínů se
 * dítěti slévalo dohromady. Levou a pravou od sebe pozná podle nákresu rukou
 * a podle nápisu, ne podle barvy.
 */
const FINGER_COLORS = {
  pinky: '#2f6fdd',   // modrá
  ring: '#3aa657',    // zelená
  middle: '#e8ab12',  // žlutá
  index: '#e2483c',   // červená
  thumb: '#9a9a9a',
};

export const FINGERS = {
  lp: { name: 'levý malíček', hand: 'L', color: FINGER_COLORS.pinky },
  lr: { name: 'levý prsteníček', hand: 'L', color: FINGER_COLORS.ring },
  lm: { name: 'levý prostředníček', hand: 'L', color: FINGER_COLORS.middle },
  li: { name: 'levý ukazováček', hand: 'L', color: FINGER_COLORS.index },
  ri: { name: 'pravý ukazováček', hand: 'R', color: FINGER_COLORS.index },
  rm: { name: 'pravý prostředníček', hand: 'R', color: FINGER_COLORS.middle },
  rr: { name: 'pravý prsteníček', hand: 'R', color: FINGER_COLORS.ring },
  rp: { name: 'pravý malíček', hand: 'R', color: FINGER_COLORS.pinky },
  th: { name: 'palec', hand: 'B', color: FINGER_COLORS.thumb },
};

/** Klávesy v základní poloze, na kterých leží prsty. */
const HOME_KEYS = ['a', 's', 'd', 'f', 'j', 'k', 'l', 'ů'];

/**
 * Rozložení "Čeština (QWERTZ)".
 * Každá klávesa: [code, znak, znak se Shiftem, prst, šířka?]
 * Šířka je násobek základní klávesy, výchozí 1.
 */
const ROWS_QWERTZ = [
  [
    ['Backquote', ';', '°', 'lp'],
    ['Digit1', '+', '1', 'lp'],
    ['Digit2', 'ě', '2', 'lr'],
    ['Digit3', 'š', '3', 'lm'],
    ['Digit4', 'č', '4', 'li'],
    ['Digit5', 'ř', '5', 'li'],
    ['Digit6', 'ž', '6', 'ri'],
    ['Digit7', 'ý', '7', 'ri'],
    ['Digit8', 'á', '8', 'rm'],
    ['Digit9', 'í', '9', 'rr'],
    ['Digit0', 'é', '0', 'rp'],
    ['Minus', '=', '%', 'rp'],
    ['Equal', '´', 'ˇ', 'rp'],
    ['Backspace', '⌫', null, 'rp', 2],
  ],
  [
    ['Tab', '↹', null, 'lp', 1.5],
    ['KeyQ', 'q', 'Q', 'lp'],
    ['KeyW', 'w', 'W', 'lr'],
    ['KeyE', 'e', 'E', 'lm'],
    ['KeyR', 'r', 'R', 'li'],
    ['KeyT', 't', 'T', 'li'],
    ['KeyZ', 'z', 'Z', 'ri'],
    ['KeyU', 'u', 'U', 'ri'],
    ['KeyI', 'i', 'I', 'rm'],
    ['KeyO', 'o', 'O', 'rr'],
    ['KeyP', 'p', 'P', 'rp'],
    ['BracketLeft', 'ú', '/', 'rp'],
    ['BracketRight', ')', '(', 'rp'],
  ],
  [
    ['CapsLock', '⇪', null, 'lp', 1.75],
    ['KeyA', 'a', 'A', 'lp'],
    ['KeyS', 's', 'S', 'lr'],
    ['KeyD', 'd', 'D', 'lm'],
    ['KeyF', 'f', 'F', 'li'],
    ['KeyG', 'g', 'G', 'li'],
    ['KeyH', 'h', 'H', 'ri'],
    ['KeyJ', 'j', 'J', 'ri'],
    ['KeyK', 'k', 'K', 'rm'],
    ['KeyL', 'l', 'L', 'rr'],
    ['Semicolon', 'ů', '"', 'rp'],
    ['Quote', '§', '!', 'rp'],
    ['Enter', '⏎', null, 'rp', 1.75],
  ],
  [
    ['ShiftLeft', '⇧', null, 'lp', 1.25],
    ['IntlBackslash', '\\', '|', 'lp'],
    ['KeyY', 'y', 'Y', 'lp'],
    ['KeyX', 'x', 'X', 'lr'],
    ['KeyC', 'c', 'C', 'lm'],
    ['KeyV', 'v', 'V', 'li'],
    ['KeyB', 'b', 'B', 'li'],
    ['KeyN', 'n', 'N', 'ri'],
    ['KeyM', 'm', 'M', 'ri'],
    ['Comma', ',', '?', 'rm'],
    ['Period', '.', ':', 'rr'],
    ['Slash', '-', '_', 'rp'],
    ['ShiftRight', '⇧', null, 'rp', 2.75],
  ],
  [
    ['ControlLeft', 'Ctrl', null, 'lp', 1.4],
    ['AltLeft', 'Alt', null, 'th', 1.4],
    ['Space', 'mezerník', null, 'th', 7],
    ['AltRight', 'AltGr', null, 'th', 1.4],
    ['ControlRight', 'Ctrl', null, 'rp', 1.4],
  ],
];

/** Varianta "Čeština (QWERTY)" se liší jen prohozením y a z. */
function toQwerty(rows) {
  return rows.map((row) =>
    row.map((k) => {
      if (k[0] === 'KeyZ') return ['KeyZ', 'y', 'Y', k[3], k[4]];
      if (k[0] === 'KeyY') return ['KeyY', 'z', 'Z', k[3], k[4]];
      return k;
    })
  );
}

const LAYOUTS = {
  'cs-qwertz': ROWS_QWERTZ,
  'cs-qwerty': toQwerty(ROWS_QWERTZ),
};

/** Mrtvé klávesy: obě sedí na stejné klávese vpravo od nuly. */
const DEAD = {
  acute: { code: 'Equal', shift: false }, // čárka
  caron: { code: 'Equal', shift: true },  // háček
};

/**
 * Znaky, které se skládají mrtvou klávesou: nejdřív háček nebo čárka, pak písmeno.
 *
 * Malá písmena s háčkem a čárkou mají na české klávesnici vlastní klávesu
 * v číselné řadě, ale velká ne. Shift nad ř dá pětku, ne Ř. Velké Ř se proto
 * musí složit háčkem a velkým R. Ě a Ů tu chybí schválně, protože v češtině
 * nestojí na začátku slova a jinde velké písmeno nepotřebují.
 */
const DEAD_COMBOS = {
  'ď': ['caron', 'd'], 'ť': ['caron', 't'], 'ň': ['caron', 'n'], 'ó': ['acute', 'o'],
  'Ď': ['caron', 'D'], 'Ť': ['caron', 'T'], 'Ň': ['caron', 'N'], 'Ó': ['acute', 'O'],
  'Č': ['caron', 'C'], 'Ř': ['caron', 'R'], 'Š': ['caron', 'S'], 'Ž': ['caron', 'Z'],
  'Á': ['acute', 'A'], 'É': ['acute', 'E'], 'Í': ['acute', 'I'],
  'Ú': ['acute', 'U'], 'Ý': ['acute', 'Y'],
};

/** Sestaví mapu znak -> jak se píše, pro dané rozložení. */
function buildCharMap(layoutId) {
  const rows = LAYOUTS[layoutId] || LAYOUTS['cs-qwertz'];
  const map = new Map();
  const byCode = new Map();
  for (const row of rows) {
    for (const [code, ch, shiftCh, finger, width] of row) {
      byCode.set(code, { code, char: ch, shiftChar: shiftCh, finger, width: width || 1 });
      if (code === 'Space') {
        map.set(' ', { code, finger: 'th', shift: false });
        continue;
      }
      if (ch && ch.length === 1 && !map.has(ch)) map.set(ch, { code, finger, shift: false });
      if (shiftCh && shiftCh.length === 1 && !map.has(shiftCh)) {
        map.set(shiftCh, { code, finger, shift: true });
      }
    }
  }
  // skládané znaky se dopočítají, až je hotová mapa běžných kláves
  for (const [ch, [deadName, base]] of Object.entries(DEAD_COMBOS)) {
    if (map.has(ch)) continue;
    const baseHit = map.get(base);
    if (!baseHit) continue;
    const dead = DEAD[deadName];
    const steps = [
      { ...dead, finger: byCode.get(dead.code).finger },
      { code: baseHit.code, shift: baseHit.shift, finger: baseHit.finger },
    ];
    map.set(ch, { ...steps[0], dead: true, steps });
  }
  return { map, byCode, rows };
}

const cache = new Map();

function layoutData(layoutId = 'cs-qwertz') {
  if (!cache.has(layoutId)) cache.set(layoutId, buildCharMap(layoutId));
  return cache.get(layoutId);
}

/**
 * Jak se napíše daný znak: která klávesa, který prst, jestli je potřeba Shift
 * a kterou rukou se Shift drží (vždy opačná ruka, než která píše písmeno).
 */
export function keyForChar(ch, layoutId = 'cs-qwertz') {
  const { map, byCode } = layoutData(layoutId);
  const hit = map.get(ch);
  if (!hit) return null;
  const shiftCode = FINGERS[hit.finger].hand === 'L' ? 'ShiftRight' : 'ShiftLeft';
  return {
    ...hit,
    shiftCode: hit.shift ? shiftCode : null,
    shiftFinger: hit.shift ? byCode.get(shiftCode).finger : null,
    fingerName: FINGERS[hit.finger].name,
  };
}

/** Všechny znaky, které jde na daném rozložení napsat. */
export function allChars(layoutId = 'cs-qwertz') {
  return [...layoutData(layoutId).map.keys()];
}

/* ------------------------------------------------------------ vykreslení */

const DECORATIVE = new Set([
  'Backspace', 'Tab', 'CapsLock', 'Enter', 'ShiftLeft', 'ShiftRight',
  'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight',
]);

/**
 * Vykreslí klávesnici do zadaného prvku.
 * options.taught  - množina znaků, které už uživatel zná (ostatní jsou tlumené)
 */
export function renderKeyboard(el, layoutId = 'cs-qwertz', options = {}) {
  const { rows } = layoutData(layoutId);
  const taught = options.taught || null;
  const html = rows
    .map((row) => {
      const keys = row
        .map(([code, ch, shiftCh, finger, width]) => {
          const w = width || 1;
          const isDeco = DECORATIVE.has(code);
          const known = !taught || isDeco || code === 'Space' || taught.has(ch);
          const cls = [
            'key',
            'f-' + finger,
            isDeco ? 'key--deco' : '',
            code === 'Space' ? 'key--space' : '',
            HOME_KEYS.includes(ch) ? 'key--home' : '',
            known ? '' : 'key--dim',
          ].filter(Boolean).join(' ');
          const top = shiftCh && shiftCh !== ch.toUpperCase()
            ? `<b class="key__shift">${esc(shiftCh)}</b>` : '';
          return `<div class="${cls}" data-code="${code}" style="--w:${w}">${top}<span class="key__main">${esc(ch)}</span></div>`;
        })
        .join('');
      return `<div class="kb__row">${keys}</div>`;
    })
    .join('');
  el.innerHTML = `<div class="kb">${html}</div>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Zvýrazní klávesu (a případně Shift), kterou se píše následující znak.
 * Volá se po každém úhozu, proto si prvky kláves pamatujeme v mapě
 * a nehledáme je pokaždé znovu.
 */
export function highlightChar(el, ch, layoutId = 'cs-qwertz', deadStep = 0) {
  if (!el._keyMap) {
    el._keyMap = new Map();
    el.querySelectorAll('[data-code]').forEach((k) => el._keyMap.set(k.dataset.code, k));
    el._lit = [];
  }
  for (const k of el._lit) k.classList.remove('key--next', 'key--next-shift');
  el._lit = [];

  const info = ch ? keyForChar(ch, layoutId) : null;
  if (!info) return null;

  // u skládaného znaku se ukazuje ten úhoz, který je zrovna na řadě
  const step = info.dead ? info.steps[Math.min(deadStep, info.steps.length - 1)] : info;
  const main = el._keyMap.get(step.code);
  if (main) {
    main.classList.add('key--next');
    el._lit.push(main);
  }

  const needsShift = info.dead ? step.shift : !!info.shiftCode;
  if (needsShift) {
    const code = FINGERS[step.finger].hand === 'L' ? 'ShiftRight' : 'ShiftLeft';
    const s = el._keyMap.get(code);
    if (s) {
      s.classList.add('key--next-shift');
      el._lit.push(s);
    }
  }
  return info;
}

/**
 * Zjistí přes Keyboard API, jaké rozložení je opravdu zapnuté ve Windows.
 * Vrací 'cs-qwertz', 'cs-qwerty', 'jine' nebo null, když to prohlížeč neumí.
 */
export async function detectLayout() {
  if (!navigator.keyboard || !navigator.keyboard.getLayoutMap) return null;
  try {
    const m = await navigator.keyboard.getLayoutMap();
    const z = m.get('KeyZ');
    const two = m.get('Digit2');
    if (two !== 'ě') return 'jine';
    return z === 'z' ? 'cs-qwertz' : 'cs-qwerty';
  } catch {
    return null;
  }
}
