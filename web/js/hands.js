/**
 * Obrázek obou rukou se zvýrazněným prstem.
 *
 * Barva znamená prst, ne ruku. Stejný prst má na obou rukou stejnou barvu,
 * takže barvy stačí čtyři a jdou od sebe rozeznat i na první pohled. Levou
 * a pravou pozná dítě podle nákresu a podle velkého L a P na dlani, ne podle
 * odstínu. Devítileté dítě si pravou a levou ještě plete, a osm podobných
 * pastelových barev tomu nepomáhalo.
 */

import { FINGERS } from './keyboard.js';

const HAND_COLORS = {
  L: { plate: '#eeeae3', ink: '#5b5349', name: 'levá', letter: 'L' },
  R: { plate: '#eeeae3', ink: '#5b5349', name: 'pravá', letter: 'P' },
};

/** Prsty jedné ruky od malíčku k ukazováčku. */
const LEFT = ['lp', 'lr', 'lm', 'li'];
const RIGHT = ['rp', 'rr', 'rm', 'ri'];

/** Rozměry prstů: [x, výška]. Prostředníček je nejdelší, malíček nejkratší. */
const FINGER_GEOM = [
  [20, 34],  // malíček
  [40, 48],
  [60, 54],  // prostředníček
  [80, 44],
];

const FINGER_W = 16;
const PALM_TOP = 76;
const PALM_BOTTOM = 124;

/** Nakreslí jednu ruku. Pravá vznikne zrcadlením té levé. */
function hand(fingers) {
  const parts = [
    `<rect class="hand-palm" x="16" y="${PALM_TOP}" width="88" height="${PALM_BOTTOM - PALM_TOP}" rx="16"/>`,
  ];
  fingers.forEach((f, i) => {
    const [x, h] = FINGER_GEOM[i];
    const top = PALM_TOP - h;
    const color = FINGERS[f].color;
    parts.push(
      `<rect class="hand-finger" data-finger="${f}" style="--c:${color}"
             x="${x}" y="${top}" width="${FINGER_W}" height="${h + 24}" rx="8"/>`,
      `<circle class="hand-dot" cx="${x + FINGER_W / 2}" cy="${top + 11}" r="6" fill="${color}"/>`
    );
  });
  // palec směřuje dovnitř, ke středu klávesnice
  parts.push(
    `<rect class="hand-finger" data-finger="th" style="--c:${FINGERS.th.color}"
           x="96" y="82" width="15" height="40" rx="7" transform="rotate(-38 103 102)"/>`
  );
  return parts.join('');
}

/**
 * Vykreslí obě ruce do zadaného prvku.
 * Palce jsou dva, ale mezerník je jeden, proto se zvýrazňují oba naráz.
 */
export function renderHands(el) {
  el.innerHTML = `
    <svg class="hands" viewBox="0 0 240 168" role="img" aria-label="Obě ruce v základní poloze">
      <g class="hand" data-hand="L">${hand(LEFT)}</g>
      <g class="hand" data-hand="R" transform="translate(240,0) scale(-1,1)">${hand(RIGHT)}</g>
      <circle class="hand-badge" cx="60" cy="104" r="15"/>
      <circle class="hand-badge" cx="180" cy="104" r="15"/>
      <text class="hand-letter" x="60" y="110" text-anchor="middle">L</text>
      <text class="hand-letter" x="180" y="110" text-anchor="middle">P</text>
      <text class="hand-label" x="60" y="160" text-anchor="middle">levá ruka</text>
      <text class="hand-label" x="180" y="160" text-anchor="middle">pravá ruka</text>
    </svg>`;
  el._fingerMap = new Map();
  el.querySelectorAll('[data-finger]').forEach((f) => {
    const key = f.dataset.finger;
    if (!el._fingerMap.has(key)) el._fingerMap.set(key, []);
    el._fingerMap.get(key).push(f);
  });
  el._litFingers = [];
}

/** Zvýrazní prst, který je na řadě. Vrací písmeno ruky, nebo null. */
export function highlightFinger(el, finger) {
  if (!el || !el._fingerMap) return null;
  for (const f of el._litFingers) f.classList.remove('hand-finger--on');
  el._litFingers = [];
  if (!finger) return null;
  const targets = el._fingerMap.get(finger) || [];
  for (const f of targets) {
    f.classList.add('hand-finger--on');
    el._litFingers.push(f);
  }
  return FINGERS[finger] ? FINGERS[finger].hand : null;
}

/** Jak se ruka jmenuje. Palec patří oběma, proto vrací null. */
export function handOf(finger) {
  const hand = FINGERS[finger] && FINGERS[finger].hand;
  if (hand === 'L' || hand === 'R') return { key: hand, ...HAND_COLORS[hand] };
  return null;
}
