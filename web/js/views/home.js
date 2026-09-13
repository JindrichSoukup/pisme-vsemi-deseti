/**
 * Domovská obrazovka dítěte.
 *
 * Vede se tu jediný cíl, a to ten dnešní. Bandura a Schunk ukázali, že děti
 * postupují mnohem líp, když mají blízký dosažitelný cíl, zatímco vzdálený cíl
 * nepomohl skoro vůbec. Proto je nahoře dnešek, ne "sedm lekcí z devětadvaceti".
 *
 * Chválí se vydržená práce, ne dítě samo. Mueller a Dweck ukázali, že pochvala
 * za chytrost dětem po prvním neúspěchu ubere chuť i výkon, zatímco pochvala
 * za snahu je udrží u věci.
 */

import { LESSONS, isUnlocked, nextLessonIndex, lessonIndex } from '../curriculum.js';
import { currentStreak } from '../stats.js';
import { esc, starsHtml, plural } from '../ui.js';
import { kindChildLabel } from '../practice.js';
import { vocative } from '../vocative.js';

const DEFAULT_GOAL_MINUTES = 10;

export async function render(app) {
  await app.refreshProfile();
  const p = app.profile;
  const next = nextLessonIndex(p);
  const nextLesson = LESSONS[next];

  const today = new Date().toLocaleDateString('sv-SE');
  const todaySeconds = (p.days[today] || {}).seconds || 0;
  const goalMinutes = p.settings.dailyGoalMinutes || DEFAULT_GOAL_MINUTES;
  const goal = dailyGoal(todaySeconds, goalMinutes);

  const streak = currentStreak(p.days);
  const doneCount = Object.values(p.lessons).filter((l) => l.stars > 0).length;

  app.root.innerHTML = `
    <div class="stack">
      ${layoutWarning(app)}

      <div class="card goal ${goal.done ? 'goal--done' : ''}">
        <div class="spread">
          <div>
            <h1 style="margin-bottom:.15rem">Ahoj, ${esc(p.settings.vocative || vocative(p.name))}!</h1>
            <p style="margin:0">${esc(goal.headline)}</p>
            ${goal.note ? `<p class="muted small" style="margin:.3rem 0 0">${esc(goal.note)}</p>` : ''}
          </div>
          <button class="${goal.done ? '' : 'btn-primary'} btn-big" id="continue">
            ${esc(goal.done ? 'Ještě jednu lekci' : doneCount ? 'Pokračovat' : 'Začít první lekci')}
          </button>
        </div>
        ${goal.done ? '' : `<div class="goal__bar"><i style="width:${goal.percent}%"></i></div>`}
      </div>

      <div class="card">
        <div class="metrics">
          <div class="metric"><b>${doneCount}</b><span>${plural(doneCount, 'hotová lekce', 'hotové lekce', 'hotových lekcí')}</span></div>
          ${streak >= 2 ? `<div class="metric"><b>${streak}</b><span>${plural(streak, 'den v řadě', 'dny v řadě', 'dní v řadě')}</span></div>` : ''}
          <div class="metric"><b>${p.stickers.length}</b><span>${plural(p.stickers.length, 'obrázek v notýsku', 'obrázky v notýsku', 'obrázků v notýsku')}</span></div>
        </div>
      </div>

      ${extraCard(p)}
      ${lessonMap(p, next)}
    </div>`;

  const waiting = pendingAssignment(p);
  const cont = app.root.querySelector('#continue');
  if (cont) cont.addEventListener('click', () => {
    if (waiting) return app.go('lesson', { index: next, practice: waiting.kind, assignmentId: waiting.id });
    app.go('lesson', { index: next });
  });

  const extraBtn = app.root.querySelector('#extra');
  if (extraBtn) {
    extraBtn.addEventListener('click', () => {
      app.go('lesson', { index: next, practice: extraBtn.dataset.kind, assignmentId: extraBtn.dataset.id });
    });
  }

  app.root.querySelectorAll('[data-lesson]').forEach((el) => {
    el.addEventListener('click', () => {
      app.go('lesson', { index: lessonIndex(el.dataset.lesson) });
    });
  });
}

/** Nejstarší nehotové cvičení navíc, nebo nic. */
export function pendingAssignment(profile) {
  return (profile.assignments || []).find((a) => !a.doneAt) || null;
}

/**
 * Karta s opakováním navíc. Je nad mapou lekcí, takže ji dítě uvidí dřív
 * než další lekci.
 *
 * Nikde se nepíše, kdo cvičení zadal ani že je to za trest. Rámuje se jako
 * to, čím ve skutečnosti je: upevněním dřívější látky před tím, než přijde
 * nová. Formulace zůstává u práce, ne u dítěte.
 */
export function extraCard(profile) {
  const a = pendingAssignment(profile);
  if (!a) return '';
  return `
    <section class="block">
      <h3>Napřed si to zopakuj</h3>
      <div class="card spread">
        <div>
          <b>${esc(kindChildLabel(a.kind))}</b>
          <p class="muted small" style="margin:.2rem 0 0">Krátké zopakování toho, co už umíš, ať to v prstech drží,
            než se pustíš do nové látky.</p>
        </div>
        <button class="btn-primary btn-big" id="extra" data-kind="${esc(a.kind)}" data-id="${esc(a.id)}">
          Pustit se do toho
        </button>
      </div>
    </section>`;
}

/**
 * Co říct dítěti o dnešku.
 * Chválí se vydržený čas, ne dítě. A když je hotovo, nikam se netlačí.
 */
export function dailyGoal(seconds, goalMinutes = DEFAULT_GOAL_MINUTES) {
  const target = goalMinutes * 60;

  if (seconds >= target) {
    return {
      done: true,
      percent: 100,
      headline: `Dneska máš hotovo. U klávesnice to bylo ${minutesText(seconds)}.`,
      note: 'Kousek každý den je přesně to, co funguje. Můžeš skončit, nebo si ještě zacvičit, jak chceš.',
    };
  }

  if (seconds === 0) {
    return {
      done: false,
      percent: 0,
      headline: `Dneska tě ${minutesPhrase(goalMinutes, 'čeká', 'čekají')} cvičení.`,
      note: 'Nespěchej. Jde o to psát správným prstem, ne rychle.',
    };
  }

  const left = Math.max(1, Math.ceil((target - seconds) / 60));
  return {
    done: false,
    percent: Math.min(100, Math.round((seconds / target) * 100)),
    headline: `Dneska ti ${minutesPhrase(left, 'zbývá', 'zbývají')}.`,
    note: `Zatím máš za sebou ${minutesText(seconds)}.`,
  };
}

/**
 * Spojí sloveso s počtem minut tak, aby to znělo česky:
 * zbývá 1 minuta, zbývají 2 minuty, zbývá 5 minut.
 */
function minutesPhrase(n, verbSingular, verbPlural) {
  const verb = n >= 2 && n <= 4 ? verbPlural : verbSingular;
  return `${verb} ${n} ${minutesWord(n)}`;
}

function minutesWord(n) {
  return plural(n, 'minuta', 'minuty', 'minut');
}

/** Sekundy jako "6 minut". Míň než minuta se zaokrouhlí nahoru na jednu. */
function minutesText(seconds) {
  const n = Math.max(1, Math.round(seconds / 60));
  return `${n} ${minutesWord(n)}`;
}

/**
 * Mapa lekcí. Nahoře je ta, kterou dítě zrovna dělá, pod ní hotové lekce od
 * nejnovější k nejstarší. To poslední, co se naučilo, má tedy vždycky na očích
 * a nemusí se k tomu proklikávat. Co teprve přijde, je schované pod odkazem.
 */
export function lessonMap(profile, nextIndex) {
  const attempted = [];
  LESSONS.forEach((lesson, i) => {
    if (i === nextIndex) return;
    const rec = profile.lessons[lesson.id];
    if (rec && ((rec.attempts || []).length || rec.stars)) attempted.push(lesson);
  });
  attempted.reverse(); // nejnovější napřed

  const upcoming = LESSONS.filter((l, i) => i > nextIndex && !attempted.includes(l));

  const section = (title, list) => (list.length
    ? `<section class="block">
         <h3>${esc(title)}</h3>
         <div class="lessons">${list.map((l) => lessonCard(l, profile)).join('')}</div>
       </section>`
    : '');

  return `
    ${section('Teď', [LESSONS[nextIndex]])}
    ${section('Co už umíš', attempted)}
    ${upcoming.length ? `<details class="road">
      <summary>Co tě ještě čeká</summary>
      ${section('Další lekce', upcoming)}
    </details>` : ''}`;
}

function lessonCard(lesson, profile) {
  const i = LESSONS.indexOf(lesson);
  const rec = profile.lessons[lesson.id];
  const unlocked = isUnlocked(i, profile);
  const stars = rec ? rec.stars : 0;
  const keys = lesson.newKeys.filter((k) => k.length === 1 && k === k.toLowerCase());
  const keysLabel = keys.length ? keys.join(' ') : (lesson.newKeys.length ? 'velká písmena' : 'opakování');

  // blok se píše na kartu, protože pořadí už neodpovídá osnově
  return `<button class="lesson-card card ${unlocked ? '' : 'lesson-card--locked'} ${stars ? 'lesson-card--done' : ''}"
    data-lesson="${lesson.id}" ${unlocked ? '' : 'disabled'}>
    <span class="lesson-card__block">${esc(lesson.block)}</span>
    <b>${esc(lesson.title)}</b>
    <span class="lesson-card__keys">${esc(keysLabel)}</span>
    ${rec ? starsHtml(stars) : ''}
  </button>`;
}

function layoutWarning(app) {
  if (app.detectedLayout === null) return '';
  if (app.detectedLayout === 'jine') {
    return `<div class="notice">
      <b>Vypadá to, že nemáš zapnutou českou klávesnici.</b>
      Přepni ji vlevo dole u hodin nebo klávesami Windows a mezerník, jinak se místo
      háčků a čárek budou psát jiné znaky.
    </div>`;
  }
  if (app.profile.settings.layout !== app.detectedLayout) {
    const label = app.detectedLayout === 'cs-qwerty' ? 'Čeština (QWERTY)' : 'Čeština (QWERTZ)';
    return `<div class="notice">
      Ve Windows máš zapnuté rozložení <b>${esc(label)}</b>, ale v programu je nastavené jiné.
      Změň si to v Nastavení, ať sedí obrázek klávesnice.
    </div>`;
  }
  return '';
}
