/** Přehled pro rodiče: jak jde rychlost, přesnost, čas a které klávesy dřou. */

import { LESSONS } from '../curriculum.js';
import { weakestKeys, humanDuration, pct, currentStreak, kindSummary } from '../stats.js';
import { keyForChar } from '../keyboard.js';
import { esc, barChart, czDate, plural, starsHtml } from '../ui.js';
import { kindLabel, KINDS } from '../practice.js';
import { api } from '../api.js';

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
  const kinds = kindSummary(p);

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
        <h2>Podle druhu cvičení</h2>
        <p class="muted small">Průměr za celou lekci míchá rozcvičku, nácvik kláves i věty dohromady.
          Tady je každý druh zvlášť, nejslabší nahoře. Podle toho se dá zadat cvičení navíc.</p>
        ${kinds.length ? kindTable(kinds) : '<p class="muted small">Na tohle je zatím málo dat. Stačí pár cvičení.</p>'}
      </div>

      <div class="card">
        <h2>Cvičení navíc</h2>
        ${assignForm(p, kinds)}
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

  const add = app.root.querySelector('#assign-add');
  if (add) {
    add.addEventListener('click', async () => {
      const kind = app.root.querySelector('#assign-kind').value;
      add.disabled = true;
      app.profile = await api.addAssignment(p.id, kind);
      render(app);
    });
  }
  app.root.querySelectorAll('[data-drop]').forEach((el) => {
    el.addEventListener('click', async () => {
      app.profile = await api.removeAssignment(p.id, el.dataset.drop);
      render(app);
    });
  });
}

/**
 * Druhy cvičení od nejslabšího. Řadí se podle přesnosti, protože ta je
 * v celém programu nadřazená rychlosti.
 */
function kindTable(rows) {
  return `<table class="keys">
    <thead><tr>
      <th>Druh cvičení</th><th>Přesnost</th><th>Rychlost</th><th>Trend</th><th>Kolikrát</th>
    </tr></thead>
    <tbody>${rows.map((r) => `<tr>
      <td>${esc(kindLabel(r.kind))}</td>
      <td>${pct(r.accuracy)}</td>
      <td>${r.netCpm} ÚPM</td>
      <td class="muted">${trendText(r.trend, r.runs)}</td>
      <td class="muted">${r.runs}×</td>
    </tr>`).join('')}</tbody>
  </table>`;
}

/** Slovní trend. Pod čtyři měření se nic netvrdí, byl by to jen šum. */
function trendText(trend, runs) {
  if (runs < 4) return 'zatím málo dat';
  if (trend > 8) return `zrychluje o ${trend} %`;
  if (trend < -8) return `zpomaluje o ${Math.abs(trend)} %`;
  return 'drží se';
}

/**
 * Zadání cvičení navíc. Nabízejí se jen druhy, které dítě už dělalo,
 * aby se přes cvičení navíc nedostalo k látce, kterou ještě nemělo.
 */
function assignForm(profile, kinds) {
  const pending = (profile.assignments || []).filter((a) => !a.doneAt);
  const doneLately = (profile.assignments || []).filter((a) => a.doneAt).slice(-5).reverse();
  const options = kinds.filter((r) => KINDS[r.kind]);

  if (!options.length) {
    return '<p class="muted small">Až dítě projde pár cvičení, půjde tu zadat jedno navíc.</p>';
  }

  return `
    <p class="muted small">Zadané cvičení se dítěti ukáže na úvodní stránce nad další lekcí.
      Nová písmena v něm nejsou, procvičuje se jen to, co už umí. Trvá kratší dobu než lekce.</p>
    <div class="row">
      <select id="assign-kind">
        ${options.map((r) => `<option value="${esc(r.kind)}">${esc(kindLabel(r.kind))} — přesnost ${pct(r.accuracy)}, ${r.netCpm} ÚPM</option>`).join('')}
      </select>
      <button class="btn-primary" id="assign-add">Zadat cvičení navíc</button>
    </div>
    ${pending.length ? `<h3>Čeká na dítě</h3>
      <ul class="small">${pending.map((a) => `<li>${esc(kindLabel(a.kind))}
        <button class="btn-quiet" data-drop="${esc(a.id)}">zrušit</button></li>`).join('')}</ul>` : ''}
    ${doneLately.length ? `<h3>Jak dopadla</h3>${doneTable(doneLately)}` : ''}`;
}

/**
 * Porovnání před a po. Vlevo je průměr druhu v okamžiku zadání, vpravo
 * samotné cvičení navíc. Z jednoho cvičení se nedá dělat závěr, proto se
 * píše jen rozdíl, ne hodnocení.
 */
function doneTable(rows) {
  return `<table class="keys">
    <thead><tr>
      <th>Druh cvičení</th><th>Před zadáním</th><th>Cvičení navíc</th><th>Rozdíl</th>
    </tr></thead>
    <tbody>${rows.map((a) => (a.before || a.after ? `<tr>
      <td>${esc(kindLabel(a.kind))}</td>
      <td class="muted">${a.before ? `${a.before.netCpm} ÚPM, ${pct(a.before.accuracy)}` : 'nic dřívějšího'}</td>
      <td>${a.after ? `${a.after.netCpm} ÚPM, ${pct(a.after.accuracy)}` : 'neměřeno'}</td>
      <td class="muted">${esc(compareText(a.before, a.after))}</td>
    </tr>` : `<tr>
      <td>${esc(kindLabel(a.kind))}</td>
      <td class="muted" colspan="3">zadáno dřív, než program porovnání uměl</td>
    </tr>`)).join('')}</tbody>
  </table>`;
}

/** Rozdíl slovy. Přesnost je napřed, protože je nadřazená rychlosti. */
export function compareText(before, after) {
  if (!before || !after) return '';
  const accPoints = Math.round((after.accuracy - before.accuracy) * 100);
  const speedPct = before.netCpm > 0
    ? Math.round(((after.netCpm - before.netCpm) / before.netCpm) * 100) : 0;

  const parts = [];
  if (accPoints >= 1) parts.push(`přesnost +${accPoints} b.`);
  else if (accPoints <= -1) parts.push(`přesnost ${accPoints} b.`);
  if (speedPct >= 5) parts.push(`rychlost +${speedPct} %`);
  else if (speedPct <= -5) parts.push(`rychlost ${speedPct} %`);

  return parts.length ? parts.join(', ') : 'beze změny';
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
