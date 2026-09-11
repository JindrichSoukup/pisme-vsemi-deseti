/** Drobné pomůcky pro sestavování stránek. */

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Hvězdičky jako text: tři pozice, získané plné, zbytek prázdné. */
export function starsHtml(n, cls = 'stars') {
  const full = '★'.repeat(n);
  const empty = '☆'.repeat(3 - n);
  return `<span class="${cls}">${full}<span class="off">${empty}</span></span>`;
}

/**
 * Zaostří tlačítko, ale chvilku ignoruje mezeru a Enter.
 *
 * Dítě doťuká poslední písmeno a ze zvyku přidá mezeru. Cvičení už mezitím
 * skončilo a zaostřené tlačítko by tou mezerou hned přeskočilo na další
 * obrazovku. Myší jde tlačítko zmáčknout hned, klávesou až po chvilce.
 */
export function focusSoon(btn, ms = 700) {
  if (!btn) return;
  let armed = false;
  btn.addEventListener('keydown', (e) => {
    if (!armed && (e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar')) {
      e.preventDefault();
    }
  });
  setTimeout(() => { armed = true; }, ms);
  btn.focus({ preventScroll: true });
}

export function czDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

/** Skloňování podle počtu: den / dny / dní. */
export function plural(n, one, few, many) {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

/** Nejmenší počet dní, po kterém má smysl prokládat trendem. */
const TREND_AFTER_DAYS = 5;

/**
 * Sloupcový graf jednotlivých pokusů.
 *
 * Sloupce jsou čitelné i pro jediný pokus, kdežto spojnice nenakreslí nic,
 * dokud nejsou body aspoň dva. Trend se proloží teprve tehdy, když je aspoň
 * pár dní na co se dívat, jinak by jedna čára předstírala vývoj, který ještě
 * není z čeho vyčíst.
 *
 * @param {Array<{value:number, date:string}>} points
 */
export function barChart(points, opts = {}) {
  if (!points.length) {
    return '<p class="muted small">Zatím tu nic není. Objeví se to po prvním cvičení.</p>';
  }

  const w = 640;
  const h = opts.height || 180;
  const pad = { l: 36, r: 10, t: 14, b: 28 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;

  const maxValue = Math.max(...points.map((p) => p.value));
  const maxY = opts.max || Math.max(1, Math.ceil((maxValue * 1.15) / 10) * 10);
  // Osa nemusí začínat v nule. U přesnosti by se prahy hvězdiček slily
  // do jedné čáry, protože 90, 95 a 98 je na stupnici od nuly skoro totéž.
  const baseY = Math.min(opts.baseline || 0, maxValue);
  const yAt = (v) => pad.t + plotH - ((Math.min(v, maxY) - baseY) / (maxY - baseY)) * plotH;

  const slot = plotW / points.length;
  const barW = Math.max(3, Math.min(30, slot - 4));
  const xAt = (i) => pad.l + slot * i + (slot - barW) / 2;

  const grid = [0, 0.5, 1]
    .map((f) => {
      const value = baseY + (maxY - baseY) * f;
      const y = yAt(value);
      return `<line class="grid" x1="${pad.l}" y1="${y.toFixed(1)}" x2="${w - pad.r}" y2="${y.toFixed(1)}"/>
              <text x="0" y="${(y + 3.5).toFixed(1)}">${Math.round(value)}</text>`;
    })
    .join('');

  // vodorovné čáry pro prahy hvězdiček a podobně
  const guides = (opts.guides || [])
    .filter((g) => g.y <= maxY)
    .map((g) => {
      const y = yAt(g.y);
      const label = g.label
        ? `<text class="guide-label" x="${w - pad.r}" y="${(y - 4).toFixed(1)}" text-anchor="end">${esc(g.label)}</text>`
        : '';
      return `<line class="guide" x1="${pad.l}" y1="${y.toFixed(1)}" x2="${w - pad.r}" y2="${y.toFixed(1)}"/>${label}`;
    })
    .join('');

  const bars = points
    .map((p, i) => {
      const y = yAt(p.value);
      const title = `${esc(czDate(p.date))}: ${Math.round(p.value)}${opts.unit ? ' ' + opts.unit : ''}`;
      return `<rect class="bar ${p.cls || ''}" x="${xAt(i).toFixed(1)}" y="${y.toFixed(1)}"
                width="${barW.toFixed(1)}" height="${(pad.t + plotH - y).toFixed(1)}" rx="2">
                <title>${title}</title></rect>`;
    })
    .join('');

  // hodnoty nad sloupci, dokud jich je málo a vejdou se
  const values = points.length <= 14
    ? points.map((p, i) =>
      `<text class="bar-value" x="${(xAt(i) + barW / 2).toFixed(1)}" y="${(yAt(p.value) - 4).toFixed(1)}"
             text-anchor="middle">${Math.round(p.value)}</text>`).join('')
    : '';

  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opts.title || 'graf')}">
    ${grid}${guides}${bars}${values}${trendLine(points, xAt, yAt, barW)}${dateLabels(points, xAt, barW, h)}
  </svg>`;
}

/** Proloží sloupce přímkou, ale až když je na čem. */
function trendLine(points, xAt, yAt, barW) {
  const days = new Set(points.map((p) => String(p.date).slice(0, 10)));
  if (days.size < TREND_AFTER_DAYS) return '';

  const n = points.length;
  const sumX = points.reduce((s, p, i) => s + i, 0);
  const sumY = points.reduce((s, p) => s + p.value, 0);
  const sumXY = points.reduce((s, p, i) => s + i * p.value, 0);
  const sumXX = points.reduce((s, p, i) => s + i * i, 0);
  const denom = n * sumXX - sumX * sumX;
  if (!denom) return '';

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const x1 = xAt(0) + barW / 2;
  const x2 = xAt(n - 1) + barW / 2;
  return `<line class="trend" x1="${x1.toFixed(1)}" y1="${yAt(intercept).toFixed(1)}"
            x2="${x2.toFixed(1)}" y2="${yAt(intercept + slope * (n - 1)).toFixed(1)}"/>`;
}

/** Datum se píše pod první sloupec každého dne, ať se popisky nepřekrývají. */
function dateLabels(points, xAt, barW, h) {
  const firstOfDay = [];
  let last = null;
  points.forEach((p, i) => {
    const day = String(p.date).slice(0, 10);
    if (day !== last) {
      firstOfDay.push({ i, day });
      last = day;
    }
  });

  const step = Math.ceil(firstOfDay.length / 8);
  return firstOfDay
    .filter((_, k) => k % step === 0)
    .map(({ i, day }) =>
      `<text x="${(xAt(i) + barW / 2).toFixed(1)}" y="${h - 8}" text-anchor="middle">${esc(shortDate(day))}</text>`)
    .join('');
}

function shortDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? '' : `${d.getDate()}. ${d.getMonth() + 1}.`;
}
