/**
 * Notýsek: stránka linkovaného papíru, na kterou se lepí získané obrázky.
 *
 * Schválně tu nejsou prázdná políčka ani seznam toho, co ještě jde získat.
 * Odměna má zůstat překvapením, ne odškrtávacím seznamem.
 */

import { LESSONS } from '../curriculum.js';
import { stickerById, stickerSvg, printStickers } from '../stickers.js';
import { esc, czDate, plural } from '../ui.js';

export async function render(app) {
  await app.refreshProfile();
  const owned = (app.profile.stickers || []).slice().reverse();

  app.root.innerHTML = `
    <div class="stack">
      <div class="spread">
        <h1 style="margin:0">Notýsek</h1>
        ${owned.length ? '<button class="btn-quiet" id="print-all">Vytisknout k vybarvení</button>' : ''}
      </div>

      <div class="notebook">
        <div class="notebook__page">
          <p class="notebook__title">${esc(app.profile.name)}</p>
          ${owned.length
            ? `<div class="notebook__grid">${owned.map(taped).join('')}</div>
               <p class="notebook__note">${owned.length}
                 ${plural(owned.length, 'obrázek', 'obrázky', 'obrázků')} nalepených</p>`
            : `<p class="notebook__note">Zatím je prázdný.</p>`}
        </div>
      </div>
    </div>`;

  const btn = app.root.querySelector('#print-all');
  if (btn) {
    btn.addEventListener('click', () => printStickers(owned, app.profile.name));
  }
}

/** Obrázek nalepený lepicí páskou, každý trochu nakřivo. */
function taped(entry, i) {
  const s = stickerById(entry.id);
  if (!s) return '';
  const lesson = LESSONS.find((l) => l.id === entry.lessonId);
  const rot = ((i % 5) - 2) * 1.4;
  return `<figure class="taped" style="--rot:${rot}deg">
    <span class="taped__tape" aria-hidden="true"></span>
    ${stickerSvg(s.id, 116)}
    <figcaption>
      ${esc(s.name)}
      <small>${esc(czDate(entry.earnedAt))}${lesson ? ' · ' + esc(lesson.title) : ''}</small>
    </figcaption>
  </figure>`;
}
