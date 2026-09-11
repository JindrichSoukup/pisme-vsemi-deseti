/** Přehled pro rodiče: jak jde rychlost, přesnost, čas a které klávesy dřou. */

import { LESSONS } from '../curriculum.js';
import { weakestKeys, humanDuration, pct, currentStreak } from '../stats.js';
import { keyForChar } from '../keyboard.js';
import { esc, barChart, czDate, plural, starsHtml } from '../ui.js';

export async function render(app) {
  await app.refreshProfile();
  const p = app.profile;

  const attempts = Object.entries(p.lessons)
    .flatMap(([id, rec]) => (rec.attempts || []).map((a) => ({ ...a, lessonId: id })))
    .sort((a, b) => new Date(a.at) - new Date(b.at));

  const dayKeys = Object.keys(p.days).sort();
  const totalSeconds = dayKeys.reduce((n, d) => n + (p.days[d].seconds || 0), 0);
  const totalKeystrokes = dayKeys.reduce((n, d) => n + (p.days[d].keystrokes || 0), 0);
  const done = Object.values(p.lessons).filter((l) => l.stars > 0).length;
  const weak = weakestKeys(p.keyStats, 10);

  app.root.innerHTML = `
    <div class="stack">
      <h1>Pro rodiče</h1>
      <p class="muted">Profil ${esc(p.name)}, založený ${esc(czDate(p.createdAt))}.</p>

      <div class="card">
        <div class="metrics">
          <div class="metric"><b>${done}</b><span>${plural(done, 'hotová lekce', 'hotové lekce', 'hotových lekcí')} z ${LESSONS.length}</span></div>
          <div class="metric"><b>${humanDuration(totalSeconds)}</b><span>celkem u klávesnice</span></div>
          <div class="metric"><b>${totalKeystrokes.toLocaleString('cs-CZ')}</b><span>úhozů celkem</span></div>
          <div class="metric"><b>${currentStreak(p.days)}</b><span>dní v řadě</span></div>
        </div>
      </div>

      <div class="card">
        <h2>Hvězdičky</h2>
        ${starSummary(p)}
      </div>

      <div class="card">
        <h2>Rychlost</h2>
        <p class="muted small">Každý sloupec je jeden dokončený pokus o lekci, v úhozech za minutu.
          Jakmile bude za sebou aspoň pět dní, proloží se tečkovaným trendem.</p>
        ${barChart(attempts.map((a) => ({ value: a.netCpm, date: a.at, cls: a.partial ? 'bar--partial' : '' })),
          { unit: 'ÚPM', title: 'rychlost po pokusech' })}
      </div>

      <div class="card">
        <h2>Přesnost</h2>
        <p class="muted small">Čárkované čáry jsou prahy hvězdiček: zdola 90 %, 95 % a 98 %.
          Osa začíná na padesáti procentech, jinak by ty tři čáry splynuly v jednu.
          Přesnost je důležitější než rychlost, takže tenhle graf má smysl sledovat jako první.</p>
        ${barChart(attempts.map((a) => ({ value: a.accuracy * 100, date: a.at, cls: a.partial ? 'bar--partial' : '' })), {
          unit: '%',
          max: 100,
          baseline: 50,
          title: 'přesnost po pokusech',
          guides: [{ y: 90 }, { y: 95 }, { y: 98 }],
        })}
      </div>

      <div class="card">
        <h2>Čas po dnech</h2>
        ${dayTable(p.days)}
      </div>

      <div class="card">
        <h2>Klávesy, které zatím dřou</h2>
        ${weak.length ? weakTable(weak, p.settings.layout) : '<p class="muted small">Na tohle je zatím málo dat.</p>'}
      </div>

      <div class="card">
        <h2>Jak číst hvězdičky</h2>
        <ul class="small muted" style="margin:0">
          <li>Jedna hvězdička: přesnost aspoň 90 %. Tím se odemkne další lekce.</li>
          <li>Dvě hvězdičky: přesnost aspoň 95 %.</li>
          <li>Tři hvězdičky: přesnost aspoň 98 % a zároveň splněná cílová rychlost lekce.</li>
        </ul>
        <p class="small muted" style="margin-top:.8rem">
          Přesnost je vždy důležitější než rychlost. Dokud se plete hmat, rychlost jen upevňuje chyby.
          Kratší a častější cvičení fungují líp než jedno dlouhé. Deset minut denně stačí.
        </p>
      </div>

      <div class="card">
        <h2>Kde jsou data</h2>
        <p class="small muted" style="margin:0">
          Všechno se ukládá do složky <code>data</code> vedle programu, jeden soubor na profil.
          Zálohu uděláš tím, že tu složku zkopíruješ. Nic se nikam neodesílá.
        </p>
      </div>
    </div>`;
}

/** Kolik hvězdiček dítě posbíralo a za co konkrétně. */
function starSummary(profile) {
  const rows = LESSONS
    .map((lesson, i) => ({ lesson, order: i + 1, rec: (profile.lessons || {})[lesson.id] }))
    .filter((r) => r.rec);

  if (!rows.length) {
    return '<p class="muted small" style="margin:0">Zatím žádná dokončená lekce.</p>';
  }

  const earned = rows.reduce((n, r) => n + (r.rec.stars || 0), 0);
  const possible = LESSONS.length * 3;
  const byStars = [0, 0, 0, 0];
  for (const r of rows) byStars[r.rec.stars || 0] += 1;

  const table = `<table class="keys">
    <tr><th>Lekce</th><th>Hvězdičky</th><th>Nejlepší rychlost</th><th>Cíl lekce</th><th>Nejlepší přesnost</th><th>Pokusů</th><th>Naposledy</th></tr>
    ${rows.map((r) => `<tr>
      <td>${r.order}. ${esc(r.lesson.title)}</td>
      <td>${starsHtml(r.rec.stars || 0)}</td>
      <td>${r.rec.bestCpm || 0} ÚPM</td>
      <td class="muted">${r.lesson.targetCpm} ÚPM${(r.rec.bestCpm || 0) >= r.lesson.targetCpm ? ' ✓' : ''}</td>
      <td>${pct(r.rec.bestAccuracy || 0)}</td>
      <td>${(r.rec.attempts || []).length}</td>
      <td>${esc(czDate(r.rec.lastAt))}</td>
    </tr>`).join('')}
  </table>`;

  return `
    <div class="metrics" style="margin-bottom:1rem">
      <div class="metric"><b>${earned}</b><span>hvězdiček z ${possible} možných</span></div>
      <div class="metric"><b>${byStars[3]}</b><span>${plural(byStars[3], 'lekce na tři', 'lekce na tři', 'lekcí na tři')}</span></div>
      <div class="metric"><b>${byStars[2]}</b><span>${plural(byStars[2], 'lekce na dvě', 'lekce na dvě', 'lekcí na dvě')}</span></div>
      <div class="metric"><b>${byStars[1]}</b><span>${plural(byStars[1], 'lekce na jednu', 'lekce na jednu', 'lekcí na jednu')}</span></div>
      ${byStars[0] ? `<div class="metric"><b>${byStars[0]}</b><span>${plural(byStars[0], 'lekce bez hvězdičky', 'lekce bez hvězdičky', 'lekcí bez hvězdičky')}</span></div>` : ''}
    </div>
    ${table}`;
}

function dayTable(days) {
  const keys = Object.keys(days).sort().slice(-14).reverse();
  if (!keys.length) return '<p class="muted small">Zatím žádný záznam.</p>';
  return `<table class="keys">
    <tr><th>Den</th><th>Čas</th><th>Úhozů</th><th>Chyb</th></tr>
    ${keys.map((d) => {
      const v = days[d];
      return `<tr><td>${esc(new Date(d + 'T12:00').toLocaleDateString('cs-CZ'))}</td>
        <td>${esc(humanDuration(v.seconds))}</td>
        <td>${v.keystrokes}</td>
        <td>${v.errors}</td></tr>`;
    }).join('')}
  </table>`;
}

function weakTable(rows, layout) {
  return `<table class="keys">
    <tr><th>Klávesa</th><th>Prst</th><th>Chybovost</th><th>Reakce</th><th>Úhozů</th></tr>
    ${rows.map((r) => {
      const info = keyForChar(r.char, layout);
      return `<tr>
        <td class="k">${esc(r.char)}</td>
        <td>${esc(info ? info.fingerName : '')}</td>
        <td>${pct(r.errRate)}</td>
        <td>${r.latency ? r.latency + ' ms' : '—'}</td>
        <td>${r.presses}</td>
      </tr>`;
    }).join('')}
  </table>`;
}
