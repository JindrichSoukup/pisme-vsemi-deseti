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

  const attempts = allAttempts(p);

  const dayKeys = Object.keys(p.days).sort();
  const totalSeconds = dayKeys.reduce((n, d) => n + (p.days[d].seconds || 0), 0);
  const totalKeystrokes = dayKeys.reduce((n, d) => n + (p.days[d].keystrokes || 0), 0);
  const done = Object.values(p.lessons).filter((l) => l.stars > 0).length;
  const weak = weakestKeys(p.keyStats, 10, 20, keyOrder);
  const kinds = kindSummary(p);
  const accuracyPoints = attempts.map((a) => ({ value: (a.accuracy || 0) * 100, date: a.at, cls: barClass(a) }));

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
        <h2>Lekce a cvičení navíc</h2>
        ${attemptLog(attempts)}
      </div>

      <div class="card">
        <h2>Rychlost</h2>
        <p class="muted small">Každý sloupec je jedna lekce nebo cvičení navíc, v úhozech za minutu.
          Světlejší sloupec je jen část lekce, modrý cvičení navíc. Jakmile bude za sebou aspoň pět dní, proloží se tečkovaným trendem.</p>
        ${barChart(attempts.map((a) => ({ value: a.netCpm, date: a.at, cls: barClass(a) })),
          { unit: 'ÚPM', title: 'rychlost po pokusech' })}
      </div>

      <div class="card">
        <h2>Přesnost</h2>
        <p class="muted small">Čárkované čáry jsou prahy hvězdiček: zdola 90 %, 95 % a 98 %.
          Vejde se sem jen ten práh, který je zrovna na stupnici. Osa začíná tam, kde je
          nejhorší pokus, jinak by všechny sloupce splynuly v jeden pás těsně pod stem:
          jedna chyba v celé lekci je jen desetina procentního bodu.
          Přesnost je důležitější než rychlost, takže tenhle graf má smysl sledovat jako první.</p>
        ${barChart(accuracyPoints, {
          unit: '%',
          max: 100,
          baseline: accuracyBaseline(accuracyPoints.map((a) => a.value)),
          format: (v) => v.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
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
        ${weak.length ? `${keyOrderButtons()}<div id="weak">${weakTable(weak, p.settings.layout)}</div>`
          : '<p class="muted small">Na tohle je zatím málo dat.</p>'}
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

  app.root.querySelectorAll('[data-key-order]').forEach((el) => {
    el.addEventListener('click', () => {
      keyOrder = el.dataset.keyOrder;
      try { localStorage.setItem('psani.poradiKlaves', keyOrder); } catch { /* nevadí */ }
      app.root.querySelector('#weak').innerHTML = weakTable(weakestKeys(p.keyStats, 10, 20, keyOrder), p.settings.layout);
      app.root.querySelectorAll('[data-key-order]').forEach((b) => {
        if (b.dataset.keyOrder === keyOrder) b.setAttribute('aria-pressed', 'true');
        else b.removeAttribute('aria-pressed');
      });
    });
  });

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

/**
 * Lekce i cvičení navíc v jedné řadě podle času. Každé opakování lekce
 * je samostatný pokus, ať je vidět, jestli se to zlepšuje.
 */
function allAttempts(profile) {
  const lessons = Object.entries(profile.lessons || {})
    .flatMap(([id, rec]) => (rec.attempts || []).map((a) => ({ ...a, lessonId: id })));
  const practice = (profile.practice || []).map((a) => ({ ...a, practice: true }));
  return lessons.concat(practice).sort((a, b) => new Date(a.at) - new Date(b.at));
}

/**
 * Kde má začít osa přesnosti.
 *
 * Nejkratší cvičení navíc má kolem tří set úhozů, nejdelší lekce přes tisíc,
 * takže jedna jediná chyba stojí 0,1 až 0,3 procentního bodu. Kdo píše slušně,
 * drží se mezi 98 a 100 % a na stupnici od padesáti by všechny jeho pokusy
 * splynuly v jeden pás. Osa proto začíná pod nejhorším pokusem a jde nahoru
 * po celých bodech, aby prostřední čára vyšla na půl bodu.
 */
export function accuracyBaseline(values) {
  const steps = [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 85, 80, 70, 60, 50, 0];
  const worst = Math.min(100, ...values);
  // 0,2 bodu pod nejhorším pokusem: jinak by jeho sloupec neměl co nakreslit
  return steps.find((s) => s <= worst - 0.2) ?? 0;
}

function barClass(a) {
  if (a.practice) return 'bar--practice';
  return a.partial ? 'bar--partial' : '';
}

/** Kolik řádků je vidět hned, starší se schovají pod rozbalení. */
const LOG_VISIBLE = 10;

/**
 * Záznam jednotlivých pokusů od nejnovějšího. Hvězdičky jsou až na konci,
 * rodiči víc řekne přesnost a rychlost než odměna, kterou vidí dítě.
 */
function attemptLog(attempts) {
  if (!attempts.length) {
    return '<p class="muted small" style="margin:0">Zatím nic. Objeví se to po první lekci.</p>';
  }
  const order = new Map(LESSONS.map((l, i) => [l.id, { lesson: l, n: i + 1 }]));
  const head = `<tr><th>Kdy</th><th>Co</th><th>Přesnost</th><th>Rychlost</th><th>Chyb</th><th>Čas</th><th>Hvězdičky</th></tr>`;
  const row = (a) => {
    const info = order.get(a.lessonId);
    const what = a.practice
      ? `Cvičení navíc: ${esc(kindLabel(a.kind))}`
      : info ? `${info.n}. ${esc(info.lesson.title)}` : esc(a.lessonId);
    const note = a.practice ? '' : a.partial ? '<span class="muted">část lekce</span>' : starsHtml(a.stars || 0);
    return `<tr>
      <td class="muted">${esc(czDateTime(a.at))}</td>
      <td>${what}</td>
      <td>${pct(a.accuracy || 0)}</td>
      <td>${a.netCpm || 0} ÚPM</td>
      <td>${a.errors ?? ''}</td>
      <td>${a.durationMs ? esc(humanDuration(Math.round(a.durationMs / 1000))) : ''}</td>
      <td>${note}</td>
    </tr>`;
  };
  const rows = attempts.slice().reverse();
  const recent = rows.slice(0, LOG_VISIBLE);
  const older = rows.slice(LOG_VISIBLE);
  return `<table class="keys">${head}${recent.map(row).join('')}</table>
    ${older.length ? `<details class="log-older"><summary class="small muted">Starší (${older.length})</summary>
      <table class="keys">${head}${older.map(row).join('')}</table></details>` : ''}`;
}

function czDateTime(iso) {
  const d = new Date(iso);
  return `${czDate(iso)} ${d.toLocaleTimeString('cs-CZ', { hour: 'numeric', minute: '2-digit' })}`;
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

/** Naposledy zvolené řazení kláves, ať se nemusí přepínat při každém otevření. */
let keyOrder = (() => {
  try { return localStorage.getItem('psani.poradiKlaves') || 'score'; } catch { return 'score'; }
})();

function keyOrderButtons() {
  const options = [['score', 'celkově'], ['errors', 'podle chybovosti'], ['latency', 'podle reakce']];
  return `<p class="small muted" style="margin:0 0 .4rem">Seřadit:
    ${options.map(([id, label]) => `<button class="btn-quiet key-order" data-key-order="${id}"
      ${keyOrder === id ? 'aria-pressed="true"' : ''}>${label}</button>`).join('')}
  </p>`;
}

/**
 * Chybovost na desetinu procenta, když je malá. Při celých procentech by
 * u přesného pisatele vyšlo skoro všude 1 % a řazení by vypadalo nahodile.
 */
function errorRate(rate) {
  if (rate >= 0.1) return pct(rate);
  return `${(rate * 100).toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

function weakTable(rows, layout) {
  return `<table class="keys">
    <tr><th>Klávesa</th><th>Prst</th><th>Chybovost</th><th>Reakce</th><th>Úhozů</th></tr>
    ${rows.map((r) => {
      const info = keyForChar(r.char, layout);
      return `<tr>
        <td class="k">${esc(r.char)}</td>
        <td>${esc(info ? info.fingerName : '')}</td>
        <td>${errorRate(r.errRate)}</td>
        <td>${r.latency ? r.latency + ' ms' : '—'}</td>
        <td>${r.presses}</td>
      </tr>`;
    }).join('')}
  </table>`;
}
