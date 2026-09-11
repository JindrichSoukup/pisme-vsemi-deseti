/** Výběr, kdo bude psát. */

import { api } from '../api.js';
import { esc, plural } from '../ui.js';
import { vocative } from '../vocative.js';

export async function render(app) {
  const users = await api.listUsers();

  app.root.innerHTML = `
    <div class="stack">
      <div class="center" style="margin-bottom:.6rem">
        <h1>Píšeme všemi deseti</h1>
        <p class="muted">Kdo dnes bude psát?</p>
      </div>

      ${users.length ? `<div class="profiles">${users.map(card).join('')}</div>` : ''}

      <div class="card">
        <h2>Nový profil</h2>
        <p class="muted small">Každý má vlastní pokrok a vlastní notýsek.</p>
        <form id="new-form" class="stack">
          <div class="row">
            <label style="flex:1;min-width:200px">
              <span class="muted small">Jméno</span><br>
              <input type="text" id="new-name" placeholder="Anna" maxlength="40" required
                     autocomplete="off" style="width:100%">
            </label>
            <label style="flex:1;min-width:200px">
              <span class="muted small">Oslovení (pátý pád)</span><br>
              <input type="text" id="new-vocative" placeholder="Anno" maxlength="40"
                     autocomplete="off" style="width:100%">
            </label>
          </div>
          <p class="muted small" style="margin:0">
            Program oslovení odvodí sám, ale u některých jmen se netrefí.
            Klidně ho přepiš, ať zní tak, jak jsi zvyklá.
          </p>
          <div><button class="btn-primary" type="submit">Vytvořit</button></div>
        </form>
        <p class="muted small" id="new-error" hidden></p>
      </div>
    </div>`;

  app.root.querySelectorAll('[data-user]').forEach((el) => {
    el.addEventListener('click', () => app.signIn(el.dataset.user));
  });

  const form = app.root.querySelector('#new-form');
  const errEl = app.root.querySelector('#new-error');
  const nameEl = app.root.querySelector('#new-name');
  const vocEl = app.root.querySelector('#new-vocative');

  // dokud do oslovení nikdo nesáhne, odvozuje se ze jména
  let touched = false;
  vocEl.addEventListener('input', () => { touched = true; });
  nameEl.addEventListener('input', () => {
    if (!touched) vocEl.value = vocative(nameEl.value);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameEl.value.trim();
    if (!name) return;
    errEl.hidden = true;
    try {
      const profile = await api.createUser(name, vocEl.value.trim() || vocative(name));
      await app.signIn(profile.id);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
    }
  });
}

function card(u) {
  const done = u.lessonsDone;
  const sub = done
    ? `${done} ${plural(done, 'hotová lekce', 'hotové lekce', 'hotových lekcí')}`
    : 'zatím žádná lekce';
  return `<button class="profile-card card" data-user="${esc(u.id)}">
    <b>${esc(u.name)}</b>
    <span class="muted small">${sub}</span>
  </button>`;
}
