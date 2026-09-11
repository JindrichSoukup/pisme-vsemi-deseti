/**
 * Samostatná stránka pro rodiče.
 *
 * Je schválně mimo dětskou aplikaci a nevede na ni odsud žádné tlačítko.
 * Otevře se souborem pro-rodice.bat nebo adresou /rodice.html.
 */

import { api } from './api.js';
import * as parents from './views/parents.js';
import * as settings from './views/settings.js';
import { detectLayout } from './keyboard.js';
import { esc } from './ui.js';

const root = document.getElementById('app');
const report = document.getElementById('report');
const settingsBox = document.getElementById('settings');
const picker = document.getElementById('picker');

/**
 * Nastavení dětského profilu patří sem, ne do dětské aplikace.
 * Dítě si má vybrat jen to, co se ho při psaní opravdu týká, tedy jestli
 * chce vidět klávesnici. Zbytek je rozhodnutí rodiče.
 */
const app = {
  profile: null,
  root: report,
  detectedLayout: null,
  isParentView: true,
  async refreshProfile() {
    if (this.profile) this.profile = await api.getUser(this.profile.id);
  },
};

async function show(id) {
  app.profile = await api.getUser(id);
  picker.querySelectorAll('[data-id]').forEach((b) => {
    if (b.dataset.id === id) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  await parents.render(app);
  await settings.render({ ...app, root: settingsBox, profile: app.profile });
}

async function boot() {
  try {
    app.detectedLayout = await detectLayout();
    const users = await api.listUsers();
    if (!users.length) {
      root.innerHTML = `<div class="card"><h1>Zatím tu není žádný profil</h1>
        <p class="muted">Až dítě začne cvičit, objeví se tu přehled jeho pokroku.</p></div>`;
      return;
    }
    picker.innerHTML = users
      .map((u) => `<button data-id="${esc(u.id)}">${esc(u.name)}</button>`)
      .join('');
    picker.hidden = users.length < 2;
    picker.addEventListener('click', (e) => {
      const b = e.target.closest('[data-id]');
      if (b) show(b.dataset.id);
    });
    await show(users[0].id);
  } catch (err) {
    root.innerHTML = `<div class="card"><h1>Program neběží</h1>
      <p>${esc(err.message)}</p>
      <p class="muted small">Spusť nejdřív start.bat a pak tuhle stránku načti znovu.</p></div>`;
  }
}

boot();
