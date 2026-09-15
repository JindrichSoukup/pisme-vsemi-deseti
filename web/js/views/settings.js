/** Nastavení profilu. */

import { api } from '../api.js';
import { renderKeyboard } from '../keyboard.js';
import { esc } from '../ui.js';
import { vocative } from '../vocative.js';
import { STICKERS } from '../stickers.js';

export async function render(app) {
  const s = app.profile.settings;
  // starší profily oslovení uložené nemají, odvodí se ze jména
  const oslov = s.vocative || vocative(app.profile.name);

  app.root.innerHTML = `
    <div class="stack">
      <h1>${app.isParentView ? 'Nastavení dětského profilu' : 'Nastavení'}</h1>

      <div class="card">
        <h2>Rozložení klávesnice</h2>
        <p class="muted small">Musí odpovídat tomu, co je zapnuté ve Windows. Poznáš to podle písmen
          Y a Z: na QWERTZ je Z v horní řadě.</p>
        <div class="row">
          <label><input type="radio" name="layout" value="cs-qwertz"
            ${s.layout === 'cs-qwertz' ? 'checked' : ''}> Čeština (QWERTZ)</label>
          <label><input type="radio" name="layout" value="cs-qwerty"
            ${s.layout === 'cs-qwerty' ? 'checked' : ''}> Čeština (QWERTY)</label>
        </div>
        <p class="small muted" id="detected"></p>
        <div id="kb" style="margin-top:1rem"></div>
      </div>

      <div class="card">
        <h2>Oslovení</h2>
        <p class="muted small">Čeština oslovuje pátým pádem: Anno, Petře, Tomáši.
          Program si ho odvodil ze jména, ale u některých jmen se netrefí.</p>
        <div class="row">
          <input type="text" id="vocative" maxlength="40" autocomplete="off"
                 value="${esc(oslov)}" style="min-width:200px">
          <span class="muted small">Ahoj, <b id="vocative-preview">${esc(oslov)}</b>!</span>
        </div>
      </div>

      <div class="card">
        <h2>Dnešní cvičení</h2>
        <p class="muted small">Kolik minut denně stačí. Dítě vidí na úvodní stránce jen tenhle
          jediný cíl, ne celkový počet lekcí. Blízký a splnitelný cíl drží u věci mnohem líp
          než vzdálený.</p>
        <div class="row">
          ${[5, 10, 15, 20].map((n) => `<label><input type="radio" name="dailyGoalMinutes" value="${n}"
            ${(s.dailyGoalMinutes ?? 10) === n ? 'checked' : ''}> ${n} minut</label>`).join('')}
        </div>
      </div>

      ${app.isParentView ? stickerCard(app.profile) : ''}

      <div class="card">
        <h2>Chyby na řádku</h2>
        <p class="muted small">Když se na jednom řádku nasbírá víc chyb, řádek se smaže
          a napíše znovu. Řádek plný chyb nemá smysl pouštět dál, jen by se upevňoval
          špatný hmat. Po třech pokusech se pokračuje tak jako tak.</p>
        <div class="row">
          ${[1, 2, 3, 0].map((n) => `<label><input type="radio" name="maxLineErrors" value="${n}"
            ${(s.maxLineErrors ?? 2) === n ? 'checked' : ''}>
            ${n === 0 ? 'bez omezení' : 'nejvýš ' + n}</label>`).join('')}
        </div>
      </div>

      <div class="card">
        <h2>Mazání chyb</h2>
        <p class="muted small" style="margin:0">
          Backspace je v prvních lekcích schválně vypnutý. Chyby se neopravují, jen se
          píše dál, aby se nácvik hmatu nepřerušoval. Zapne se v lekci
          <b>Backspace: mazání překlepů</b> a od té chvíle už funguje všude.
        </p>
      </div>

      <div class="card">
        <h2>Zvuk</h2>
        <div class="row">
          <label><input type="radio" name="sound" value="off" ${s.sound === 'off' ? 'checked' : ''}> Ticho</label>
          <label><input type="radio" name="sound" value="error" ${s.sound === 'error' ? 'checked' : ''}> Jen při chybě</label>
          <label><input type="radio" name="sound" value="all" ${s.sound === 'all' ? 'checked' : ''}> Každý úhoz</label>
        </div>
      </div>

      <div class="card">
        <h2>Klávesnice na obrazovce</h2>
        <label class="row">
          <input type="checkbox" id="showKeyboard" ${s.showKeyboard ? 'checked' : ''}>
          Ukazovat obrázek klávesnice při psaní
        </label>
        <p class="small muted" style="margin-top:.6rem">
          Až se hmat usadí, je lepší ji vypnout. Kdo se dívá na klávesnici, ten se psát všemi deseti nenaučí.
        </p>
      </div>

      ${app.isParentView ? '' : `<div class="card">
        <h2>Profil</h2>
        <p class="small muted">Přihlášen jako <b>${esc(app.profile.name)}</b>.</p>
        <div class="row">
          <button data-go="profiles">Přepnout profil</button>
        </div>
      </div>`}

      <p class="small muted" id="saved" hidden>Uloženo.</p>
    </div>`;

  const kb = app.root.querySelector('#kb');
  const draw = () => renderKeyboard(kb, app.profile.settings.layout);
  draw();

  const det = app.root.querySelector('#detected');
  if (app.detectedLayout === 'jine') {
    det.textContent = 'Ve Windows teď není zapnutá česká klávesnice.';
  } else if (app.detectedLayout) {
    det.textContent =
      'Ve Windows je právě zapnuté rozložení ' +
      (app.detectedLayout === 'cs-qwerty' ? 'Čeština (QWERTY).' : 'Čeština (QWERTZ).');
  }

  const savedNote = app.root.querySelector('#saved');
  async function save(patch) {
    Object.assign(app.profile.settings, patch);
    try {
      await api.saveSettings(app.profile.id, patch);
      savedNote.hidden = false;
      setTimeout(() => { savedNote.hidden = true; }, 1600);
    } catch { /* lokální server, tohle skoro nenastane */ }
  }

  app.root.querySelectorAll('input[name="layout"]').forEach((r) => {
    r.addEventListener('change', () => {
      save({ layout: r.value });
      draw();
    });
  });
  app.root.querySelectorAll('input[name="sound"]').forEach((r) => {
    r.addEventListener('change', () => save({ sound: r.value }));
  });
  const vocEl = app.root.querySelector('#vocative');
  const vocPreview = app.root.querySelector('#vocative-preview');
  vocEl.addEventListener('input', () => {
    vocPreview.textContent = vocEl.value || oslov;
  });
  vocEl.addEventListener('change', () => {
    save({ vocative: vocEl.value.trim() || oslov });
  });

  app.root.querySelectorAll('input[name="dailyGoalMinutes"]').forEach((r) => {
    r.addEventListener('change', () => save({ dailyGoalMinutes: Number(r.value) }));
  });
  app.root.querySelectorAll('input[name="maxLineErrors"]').forEach((r) => {
    r.addEventListener('change', () => save({ maxLineErrors: Number(r.value) }));
  });
  const guarantee = app.root.querySelector('#guaranteeSticker');
  if (guarantee) {
    guarantee.addEventListener('change', (e) => save({ guaranteeSticker: e.target.checked }));
  }

  app.root.querySelector('#showKeyboard').addEventListener('change', (e) => {
    save({ showKeyboard: e.target.checked });
  });
}

/**
 * Obrázek do notýsku jistě po příští lekci. Jen pro rodiče: dítě se to
 * dopředu nesmí dozvědět, jinak by překvapení přestalo být překvapením.
 */
function stickerCard(profile) {
  const all = STICKERS.length;
  const owned = (profile.stickers || []).length;
  const on = !!profile.settings.guaranteeSticker;
  return `<div class="card">
    <h2>Obrázek do notýsku</h2>
    <p class="muted small">Obrázek za lekci jinak přichází náhodně, aby zůstal
      překvapením. Když dítě mrzí, že dlouho nic nedostalo, jde tady zařídit, že ho
      po příští dokončené lekci dostane určitě, bez ohledu na hvězdičky. Po předání
      se nastavení samo vypne. Dítěti to dopředu neříkejte: slíbená odměna chuť
      k samotné činnosti snižuje, překvapení ne.</p>
    ${owned >= all
      ? '<p class="small">Dítě už má všechny obrázky, žádný další není.</p>'
      : `<label class="row">
          <input type="checkbox" id="guaranteeSticker" ${on ? 'checked' : ''}>
          Po příští dokončené lekci obrázek určitě přidat
        </label>`}
  </div>`;
}
