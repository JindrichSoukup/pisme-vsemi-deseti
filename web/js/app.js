/** Řízení aplikace: který profil je přihlášený a která obrazovka se ukazuje. */

import { api, lastUser, flushPending } from './api.js';
import { loadContent } from './generator.js';
import { detectLayout } from './keyboard.js';
import { esc } from './ui.js';

import * as profilesView from './views/profiles.js';
import * as homeView from './views/home.js';
import * as lessonView from './views/lesson.js';
import * as notebookView from './views/notebook.js';

const VIEWS = {
  profiles: profilesView,
  home: homeView,
  lesson: lessonView,
  notebook: notebookView,
};

export const app = {
  profile: null,
  screen: 'profiles',
  detectedLayout: null,
  root: document.getElementById('app'),
  topbar: document.getElementById('topbar'),

  async go(screen, params = {}) {
    // předchozí obrazovka může chtít po sobě uklidit (třeba odpojit klávesnici)
    const prev = VIEWS[this.screen];
    // čeká se, až uloží rozdělanou práci, jinak by další obrazovka ukázala stará data
    if (prev && prev.leave) await prev.leave();

    this.screen = screen;
    this.root.className = 'screen-' + screen;
    this.root.scrollTop = 0;
    this.updateChrome();
    await VIEWS[screen].render(this, params);
    // až po vykreslení, jinak by zaostřené tlačítko stránku zase strhlo dolů
    window.scrollTo(0, 0);
  },

  updateChrome() {
    const signedIn = !!this.profile;
    this.topbar.hidden = !signedIn;
    if (!signedIn) return;
    document.getElementById('whoami').textContent = this.profile.name;
    this.topbar.querySelectorAll('nav button').forEach((b) => {
      if (b.dataset.go === this.screen) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  },

  /** Znovu načte profil ze serveru, aby se ukazovala aktuální data. */
  async refreshProfile() {
    if (!this.profile) return;
    this.profile = await api.getUser(this.profile.id);
  },

  async signIn(id) {
    this.profile = await api.getUser(id);
    lastUser.set(id);
    await this.go('home');
  },

  signOut() {
    this.profile = null;
    lastUser.clear();
    this.go('profiles');
  },

  error(message) {
    this.root.innerHTML = `<div class="card"><h1>Něco se pokazilo</h1>
      <p>${esc(message)}</p>
      <p class="muted small">Zkus zavřít okno a spustit program znovu přes start.bat.</p></div>`;
  },
};

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-go]');
  if (!btn) return;
  const target = btn.dataset.go;
  if (target === 'profiles' && app.profile) {
    app.signOut();
  } else {
    app.go(target);
  }
});

async function boot() {
  try {
    await loadContent();
    flushPending().catch(() => {});
    app.detectedLayout = await detectLayout();
    const remembered = lastUser.get();
    if (remembered) {
      try {
        app.profile = await api.getUser(remembered);
        return app.go('home');
      } catch {
        lastUser.clear();
      }
    }
    await app.go('profiles');
  } catch (err) {
    app.error(err.message);
  }
}

boot();
