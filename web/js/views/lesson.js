/** Průběh jedné lekce: výklad, jednotlivá cvičení, výsledek. */

import { LESSONS, allowedCharsUpTo, knowsUppercase, backspaceAllowedAt } from '../curriculum.js';
import { practiceLesson } from '../practice.js';
import { buildStep } from '../generator.js';
import { createEngine } from '../engine.js';
import { renderKeyboard, highlightChar, keyForChar, FINGERS } from '../keyboard.js';
import { renderHands, highlightFinger, handOf } from '../hands.js';
import {
  computeResult, summarizeKeys, humanDuration, pct, recentSpeed, remainingWork, rhythmSummary,
} from '../stats.js';
import { api, saveResultSafe, saveStickerSafe } from '../api.js';
import { maybeAward, stickerSvg, printStickers } from '../stickers.js';
import { esc, starsHtml, focusSoon, plural } from '../ui.js';
import { dailyGoal } from './home.js';

let session = null;

export async function leave() {
  const current = session;
  session = null;
  if (!current) return;
  if (current.engine) current.engine.destroy();
  if (current.finished) return;

  // Hotová cvičení se uloží, i když lekce doběhnout nestihla. Jinak by se
  // dítěti nezapočítal čas do dnešního cíle ani statistika kláves, a právě
  // po splnění cíle mu program radí skončit uprostřed lekce.
  if (current.collected.length && !current.lesson.practice) {
    const { body } = resultPayload(current, true);
    body.resumeStep = current.betweenSteps ? current.stepIdx + 1 : current.stepIdx;
    try {
      const saved = await saveResultSafe(current.app.profile.id, body);
      current.app.profile = saved.profile;
    } catch {
      /* uloží se samo, až se program zase ozve */
    }
    return;
  }
  if (current.engine && !current.lesson.practice) {
    rememberProgress(current.app, current.lesson.id, current.stepIdx);
  }
}

/** Uloží nebo smaže poznámku o rozdělané lekci. Výpadek spojení nevadí. */
function rememberProgress(app, lessonId, step) {
  if (String(lessonId).startsWith('EXTRA-')) return;
  const rec = app.profile.lessons[lessonId] || {};
  if (step === null) delete rec.lastStep;
  else rec.lastStep = step;
  app.profile.lessons[lessonId] = rec;
  api.saveProgress(app.profile.id, lessonId, step).catch(() => {});
}

export async function render(app, params) {
  // Cvičení navíc od rodiče. Písmena bere z toho, co dítě zatím probralo,
  // takže se řídí lekcí, u které je, ne vlastním pořadím v osnově.
  const practice = params.practice ? practiceLesson(params.practice, params.index ?? 0) : null;

  const index = Number.isInteger(params.index) ? params.index : 0;
  const lesson = practice || LESSONS[index];
  if (!lesson) return app.go('home');

  session = {
    app,
    index,
    lesson,
    assignmentId: params.assignmentId || null,
    allowed: allowedCharsUpTo(index),
    uppercase: knowsUppercase(index),
    stepIdx: 0,
    collected: [],   // výsledky jednotlivých kroků
    engine: null,
  };
  renderIntro();
}

/* ------------------------------------------------------------------ výklad */

function renderIntro() {
  const { app, lesson, index } = session;
  const layout = app.profile.settings.layout;

  // U cvičení navíc se klávesy berou z dřívějších lekcí jen proto, aby
  // z nich šel poskládat text. Nová nejsou, takže se ve výkladu nevypisují.
  const fingerNotes = lesson.practice ? '' : lesson.newKeys
    .filter((k) => k.length === 1)
    .map((k) => {
      const info = keyForChar(k, layout);
      return info ? `<li><b>${esc(k === ' ' ? 'mezerník' : k)}</b> — ${esc(info.fingerName)}</li>` : '';
    })
    .filter(Boolean)
    .join('');

  app.root.innerHTML = `
    <div class="stack">
      <div class="spread">
        <div>
          <p class="muted small" style="margin:0">${lesson.practice ? esc(lesson.block) : esc(lesson.block) + ` · lekce ${index + 1} z ${LESSONS.length}`}</p>
          <h1 style="margin:0">${esc(lesson.title)}</h1>
        </div>
        <button class="btn-quiet" data-go="home">Zpět na lekce</button>
      </div>

      <div class="card">
        <p style="font-size:1.08rem">${esc(lesson.intro.lead)}</p>
        <ul>${lesson.intro.points.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        ${fingerNotes ? `<h3>Který prst</h3><ul>${fingerNotes}</ul>` : ''}
      </div>

      <div class="card">
        <div class="kb-row">
          <div id="kb"></div>
          <div id="hands"></div>
        </div>
        <p class="finger-legend" style="margin-top:.9rem">${legend()}</p>
      </div>

      ${stepChooser(lesson, app.profile)}
    </div>`;

  const kb = app.root.querySelector('#kb');
  renderKeyboard(kb, layout, { taught: session.allowed });

  // ve výkladu svítí ruka a prst, kterým se nová klávesa píše
  const introHands = app.root.querySelector('#hands');
  renderHands(introHands);
  const firstNew = lesson.practice ? null : lesson.newKeys.find((k) => k.length === 1);
  if (firstNew) {
    const info = keyForChar(firstNew, layout);
    if (info) highlightFinger(introHands, info.finger);
  }

  for (const code of lesson.highlightCodes || []) {
    const el = kb.querySelector(`[data-code="${code}"]`);
    if (el) el.classList.add('key--next');
  }
  // nová písmena lekce svítí už při výkladu
  if (!lesson.practice && lesson.newKeys.length) {
    lesson.newKeys.forEach((k) => {
      const info = keyForChar(k, layout);
      if (!info) return;
      const el = kb.querySelector(`[data-code="${info.dead ? info.steps[0].code : info.code}"]`);
      if (el) el.classList.add('key--next');
    });
  }

  const startBtn = app.root.querySelector('#start');
  focusSoon(startBtn);
  startBtn.addEventListener('click', () => {
    session.stepIdx = Number(startBtn.dataset.step || 0);
    session.startedAt = session.stepIdx;
    // Pokračování tam, kde se minule přestalo, dokončuje celou lekci.
    // Opakování jednoho cvičení přes seznam níž je naopak jen kousek.
    session.resumed = session.stepIdx > 0;
    startStep();
  });

  app.root.querySelectorAll('[data-jump]').forEach((el) => {
    el.addEventListener('click', () => {
      session.stepIdx = Number(el.dataset.jump);
      session.startedAt = session.stepIdx;
      startStep();
    });
  });
}

/**
 * Tlačítko na start a případně i výběr jednotlivých cvičení.
 *
 * Když dítě lekci nedokončilo, nabídne se návrat tam, kde skončilo.
 * Když ji už jednou dělalo, může si zopakovat jen jednu část, protože projíždět
 * celou lekci znovu kvůli jednomu cvičení nikoho nebaví.
 */
export function stepChooser(lesson, profile) {
  const rec = profile.lessons[lesson.id] || {};
  const resume = Number.isInteger(rec.lastStep) && rec.lastStep > 0
    && rec.lastStep < lesson.steps.length ? rec.lastStep : null;
  const seenBefore = (rec.attempts || []).length > 0 || resume !== null;

  const main = resume !== null
    ? `<button class="btn-primary btn-big" id="start" data-step="${resume}">
         Pokračovat: ${esc(lesson.steps[resume].label)}
       </button>
       <button class="btn-quiet" data-jump="0">Raději od začátku</button>`
    : `<button class="btn-primary btn-big" id="start" data-step="0">Jdeme na to</button>`;

  const list = seenBefore
    ? `<div class="card">
         <h3>Nebo si zopakuj jen jedno cvičení</h3>
         <div class="row">
           ${lesson.steps.map((s, i) =>
             `<button data-jump="${i}">${i + 1}. ${esc(s.label)}</button>`).join('')}
         </div>
       </div>`
    : '';

  return `<div class="center row" style="justify-content:center">${main}</div>${list}`;
}

function legend() {
  return ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp']
    .map((f) => `<span><i style="background:${FINGERS[f].color}"></i>${esc(FINGERS[f].name)}</span>`)
    .join('');
}

/* ------------------------------------------------------------------ cvičení */

function startStep() {
  session.betweenSteps = false;
  const { app, lesson, stepIdx } = session;
  const stepDef = lesson.steps[stepIdx];
  const built = buildStep(
    lesson,
    stepDef,
    {
      allowed: session.allowed,
      keyStats: app.profile.keyStats,
      uppercase: session.uppercase,
      layout: app.profile.settings.layout,
    },
    stepIdx
  );
  session.built = built;

  const showKb = app.profile.settings.showKeyboard;

  app.root.innerHTML = `
    <div class="stack">
      <div class="spread">
        <div>
          <p class="muted small" style="margin:0">${esc(lesson.title)}</p>
          <h2 style="margin:0">${esc(built.label)}${built.title ? ' · ' + esc(built.title) : ''}</h2>
        </div>
        <div class="row">
          <span class="muted small">Cvičení ${stepIdx + 1} ze ${lesson.steps.length}</span>
          <div class="steps-dots" aria-label="postup lekcí">
            ${lesson.steps.map((_, i) => `<i class="${i < stepIdx ? 'on' : ''} ${i === stepIdx ? 'now' : ''}"></i>`).join('')}
          </div>
          <button class="btn-quiet" id="toggle-kb">
            ${showKb ? 'Skrýt klávesnici' : 'Ukázat klávesnici'}
          </button>
          <button class="btn-quiet" data-go="home">Konec</button>
        </div>
      </div>

      <div id="typing"></div>

      <p class="hint" id="hint"></p>

      <div class="card" id="kb-card" ${showKb ? '' : 'hidden'}>
        <div class="kb-row">
          <div id="kb"></div>
          <div id="hands"></div>
        </div>
      </div>
    </div>`;

  const kbCard = app.root.querySelector('#kb-card');
  const kb = app.root.querySelector('#kb');
  const handsEl = app.root.querySelector('#hands');
  const hint = app.root.querySelector('#hint');
  renderKeyboard(kb, app.profile.settings.layout, { taught: session.allowed });
  renderHands(handsEl);
  session.handsEl = handsEl;

  const engine = createEngine(app.root.querySelector('#typing'), {
    sound: app.profile.settings.sound,
    maxLineErrors: app.profile.settings.maxLineErrors ?? 2,
    allowBackspace: backspaceAllowedAt(session.index),
    onProgress: () => updateHint(engine, kb, hint),
    // při skládání ď nebo Á je háček už stisknutý, nápověda ukáže druhý úhoz
    onCompose: (active) => updateHint(engine, kb, hint, active),
    onFinish: (r) => finishStep(r),
  });
  session.engine = engine;
  engine.load(built.lines);
  engine.focus();
  updateHint(engine, kb, hint);

  app.root.querySelector('#toggle-kb').addEventListener('click', async (e) => {
    const nowShown = kbCard.hidden;
    kbCard.hidden = !nowShown;
    e.target.textContent = nowShown ? 'Skrýt klávesnici' : 'Ukázat klávesnici';
    app.profile.settings.showKeyboard = nowShown;
    engine.focus();
    api.saveSettings(app.profile.id, { showKeyboard: nowShown }).catch(() => {});
  });
}

function updateHint(engine, kb, hintEl, composing = false) {
  const layout = session.app.profile.settings.layout;
  const ch = engine.nextChar();
  const info = highlightChar(kb, ch, layout, composing ? 1 : 0);
  const step = info && info.dead ? info.steps[composing ? 1 : 0] : info;
  highlightFinger(session.handsEl, step ? step.finger : null);
  hintEl.innerHTML = hintText(ch, info, composing);
}

/**
 * Text nápovědy nad klávesnicí.
 *
 * Ruka se jmenuje "levá ruka", protože ruka je rod ženský, kdežto prst je rod
 * mužský. Nedají se proto slepit dohromady jako "levá prsteníček". Prst se
 * uvádí zvlášť za čárkou a bez rodového přívlastku, jinak by tam bylo
 * "levá ruka, levý prsteníček".
 */
export function hintText(ch, info, composing = false) {
  if (!info) return '';
  const label = ch === ' ' ? 'mezerník' : ch;

  if (info.dead) {
    // háček je Shift a klávesa vpravo nahoře, čárka je ta klávesa samotná
    const mark = info.steps[0].shift ? 'háček' : 'čárka';
    return composing
      ? `Teď <b>${esc(label)}</b>: pusť ${esc(mark === 'háček' ? 'háček' : 'čárku')} a stiskni písmeno.`
      : `Další: <b>${esc(label)}</b> — nejdřív ${esc(mark)} pravým malíčkem, pak teprve písmeno.`;
  }

  const hand = handOf(info.finger);
  const fingerOnly = info.fingerName.replace(/^(levý|pravý) /, '');
  const parts = hand
    ? [`<span class="hand-name" style="background:${hand.plate};color:${hand.ink}">${hand.name} ruka</span>`,
       esc(fingerOnly)]
    : [esc(info.fingerName)];

  if (info.shiftCode) {
    parts.push(esc(`k tomu Shift ${info.shiftCode === 'ShiftLeft' ? 'levým' : 'pravým'} malíčkem`));
  }
  return `Další: <b>${esc(label)}</b> — ${parts.join(', ')}`;
}

/**
 * Kolik ještě zbývá, řečeno tak, aby to dítě povzbudilo a ne odradilo.
 * Ptáme se, jestli to ještě zvládne, protože rozhodnutí má zůstat na něm.
 */
export function remainingText({ steps, minutes }) {
  if (steps <= 0) return 'A to je z téhle lekce všechno.';
  if (steps === 1) {
    return `Zbývá poslední cvičení, tak na ${minutes} ${plural(minutes, 'minutu', 'minuty', 'minut')}.`;
  }
  const kolik = ['', 'jedno', 'dvě', 'tři', 'čtyři', 'pět', 'šest', 'sedm'][steps] || String(steps);
  const sloveso = steps >= 2 && steps <= 4 ? 'Zvládneš' : 'Dáš';
  return `${sloveso} ještě ${kolik} ${plural(steps, 'cvičení', 'cvičení', 'cvičení')}?`
    + ` Je to tak na ${minutes} ${plural(minutes, 'minutu', 'minuty', 'minut')}.`;
}

/* ------------------------------------------------- konec kroku a lekce */

function finishStep(raw) {
  const { app, lesson } = session;
  session.collected.push({ ...raw, kind: lesson.steps[session.stepIdx].kind });

  rememberProgress(app, lesson.id, session.stepIdx + 1);
  const isLast = session.stepIdx >= lesson.steps.length - 1;
  const r = computeResult({ typed: raw.typed, errors: raw.errors, durationMs: raw.durationMs });

  if (isLast) return finishLesson();
  session.betweenSteps = true;

  const left = remainingWork(lesson, session.stepIdx + 1, recentSpeed(app.profile));
  const goal = goalReached(app, session.collected);

  app.root.innerHTML = `
    <div class="stack center">
      <div class="card">
        <h2>Cvičení hotové</h2>
        <div class="metrics" style="justify-content:center">
          <div class="metric"><b>${r.netCpm}</b><span>úhozů za minutu</span></div>
          <div class="metric"><b>${pct(r.accuracy)}</b><span>přesnost</span></div>
        </div>
        <p style="margin:.8rem 0 0">${esc(goal.done ? restText(goal.minutes) : remainingText(left))}</p>
      </div>
      ${goal.done
    ? `<div class="row" style="justify-content:center">
          <button class="btn-primary btn-big" data-go="home" id="rest">Konec pro dnešek</button>
        </div>
        <p class="muted small" style="margin:0">
          <button class="btn-quiet" id="next">Přesto ještě jedno cvičení</button>
        </p>`
    : `<div class="row" style="justify-content:center">
          <button class="btn-quiet" id="again">Znovu</button>
          <button class="btn-primary btn-big" id="next">Další cvičení</button>
        </div>
        <p class="muted small" style="margin:0">
          <button class="btn-quiet" data-go="home">Konec pro dnešek</button><br>
          Zbytek lekce na tebe počká, program si pamatuje, u kterého cvičení to bylo.
        </p>`}
    </div>`;

  const next = app.root.querySelector('#next');
  focusSoon(goal.done ? app.root.querySelector('#rest') : next);
  next.addEventListener('click', () => {
    session.stepIdx += 1;
    startStep();
  });
  const again = app.root.querySelector('#again');
  if (again) {
    again.addEventListener('click', () => {
      session.collected.pop();
      startStep();
    });
  }
}

/**
 * Jestli je dnešní cíl splněný, včetně cvičení z téhle lekce, která se na
 * server uloží až na jejím konci.
 */
export function goalReached(app, collected) {
  const today = new Date().toLocaleDateString('sv-SE');
  const saved = ((app.profile.days || {})[today] || {}).seconds || 0;
  const now = collected.reduce((n, r) => n + (r.durationMs || 0), 0) / 1000;
  const goal = dailyGoal(saved + now, app.profile.settings.dailyGoalMinutes || undefined);
  return { done: goal.done, minutes: Math.max(1, Math.round((saved + now) / 60)) };
}

/**
 * Co říct, když je dnešní cíl splněný a lekce ještě ne. Místo pobídky
 * k dalšímu cvičení doporučí odpočinek: kratší denní dávky fungují líp
 * než dlouhé sezení a únava na konci jen upevňuje chyby.
 */
export function restAfterLessonText(minutes) {
  return `Dnešní cíl je splněný, u klávesnice to bylo ${minutes} ${plural(minutes, 'minuta', 'minuty', 'minut')}.`
    + ' Další lekce počká na zítřek, prsty si teď zaslouží odpočinek.';
}

export function restText(minutes) {
  return `Dnešní cíl je splněný, u klávesnice to bylo ${minutes} ${plural(minutes, 'minuta', 'minuty', 'minut')}.`
    + ' I když je lákavé lekci dokončit, prsty si teď zaslouží odpočinek.'
    + ' Zítra jim to půjde líp a zbytek lekce na tebe počká.';
}

/** Výsledek hotových cvičení tak, jak se posílá na server. */
function resultPayload(sess, partial) {
  const { app, lesson } = sess;
  const total = sess.collected.reduce(
    (acc, r) => ({
      typed: acc.typed + r.typed,
      errors: acc.errors + r.errors,
      durationMs: acc.durationMs + r.durationMs,
      keyLog: acc.keyLog.concat(r.keyLog),
    }),
    { typed: 0, errors: 0, durationMs: 0, keyLog: [] }
  );

  const result = computeResult({ ...total, targetCpm: lesson.targetCpm });
  return {
    result,
    body: {
      lessonId: lesson.id,
      cpm: result.cpm,
      netCpm: result.netCpm,
      accuracy: result.accuracy,
      errors: result.errors,
      keystrokes: result.typed,
      durationMs: result.durationMs,
      stars: result.stars,
      partial,
      keys: summarizeKeys(total.keyLog),
      // výsledky po jednotlivých cvičeních, ať se pozná, který druh dře
      steps: sess.collected.map((r) => ({
        kind: r.kind,
        typed: r.typed,
        errors: r.errors,
        durationMs: r.durationMs,
      })),
      // rytmus: kde padají pauzy, po druzích přechodu mezi úhozy
      rhythm: rhythmSummary(total.keyLog, app.profile.settings.layout),
      // Syrový záznam úhozů. Na obrazovce se nepoužívá, ukládá se stranou
      // kvůli pozdějšímu rozboru: bez něj se nedá zpětně zjistit nic, co
      // jsme dopředu nezapočítali.
      strokes: sess.collected.map((r) => ({
        kind: r.kind,
        chars: r.keyLog.map((k) => k.char).join(''),
        typed: r.keyLog.map((k) => (k.ok ? '' : k.got || '?')).join('|'),
        lat: r.keyLog.map((k) => Math.round(k.latency)),
        ok: r.keyLog.map((k) => (k.ok ? 1 : 0)).join(''),
        line: r.keyLog.map((k) => k.line).join(','),
      })),
      practice: !!lesson.practice,
      assignmentId: sess.assignmentId,
    },
  };
}

async function finishLesson() {
  const { app, lesson, index } = session;
  session.finished = true;
  rememberProgress(app, lesson.id, null);

  // Opakování jen části lekce hvězdičky nepřidá. Pokračování v lekci, kterou
  // dítě minule přerušilo, ale ano: celou ji udělalo, jen na dvakrát.
  const partial = (session.startedAt || 0) > 0 && !session.resumed;
  const { result, body } = resultPayload(session, partial);
  const previousBest = (app.profile.lessons[lesson.id] || {}).bestCpm || 0;

  // odměna se losuje ještě před uložením, ať se počítá se stavem před lekcí
  const guaranteed = !partial && !!app.profile.settings.guaranteeSticker;
  const award = maybeAward(app.profile, lesson.id, result.stars, { guaranteed });

  let saveError = null;
  try {
    const saved = await saveResultSafe(app.profile.id, body);
    app.profile = saved.profile;
    if (award) {
      const res = await saveStickerSafe(app.profile.id, award.id, lesson.id);
      app.profile.stickers = res.stickers;
    }
  } catch (err) {
    saveError = err.message;
  }
  // Zajištěný obrázek platí jen jednou. Server příznak smaže, až obrázek
  // zapíše, ale do té doby by ho další lekce ve stejném sezení viděla znovu.
  if (award && guaranteed) app.profile.settings.guaranteeSticker = false;

  const isNewBest = result.netCpm > previousBest && previousBest > 0;
  const hasNext = !lesson.practice && index < LESSONS.length - 1;
  // uložený profil už dnešní čas obsahuje, neuložený ho musí dostat z lekce
  const goal = goalReached(app, saveError ? session.collected : []);

  app.root.innerHTML = `
    <div class="stack">
      <div class="card center">
        <p class="muted small" style="margin:0">${esc(lesson.title)}</p>
        ${starsHtml(result.stars, 'result-stars')}
        <p style="font-size:1.1rem">${esc(praise(result))}</p>
        <div class="metrics" style="justify-content:center">
          <div class="metric"><b>${result.netCpm}</b><span>úhozů za minutu</span></div>
          <div class="metric"><b>${pct(result.accuracy)}</b><span>přesnost</span></div>
          <div class="metric"><b>${humanDuration(result.durationMs / 1000)}</b><span>čistý čas psaní</span></div>
        </div>
        ${isNewBest ? '<p class="muted">Tohle je tvůj nový osobní rekord v téhle lekci.</p>' : ''}
        ${!lesson.practice && result.stars < 3 ? `<p class="muted small">Tři hvězdičky jsou za přesnost aspoň 98 % a rychlost ${lesson.targetCpm} úhozů za minutu.</p>` : ''}
        ${goal.done && hasNext ? `<p style="margin:.8rem 0 0">${esc(restAfterLessonText(goal.minutes))}</p>` : ''}
      </div>

      ${award ? rewardHtml(award) : ''}
      ${saveError ? `<div class="notice">
        <b>Výsledek se teď nepodařilo uložit.</b>
        Mám ho schovaný a uloží se sám, až se program zase ozve.
        Zkontroluj, jestli černé okno s programem pořád běží.
        <span class="small muted">(${esc(saveError)})</span>
      </div>` : ''}

      ${goal.done && hasNext
    ? `<div class="row" style="justify-content:center">
          <button class="btn-quiet" id="retry">Zkusit lekci znovu</button>
          <button class="btn-primary btn-big" data-go="home" id="rest">Konec pro dnešek</button>
        </div>
        <p class="muted small center" style="margin:0">
          <button class="btn-quiet" id="next-lesson">Přesto další lekce</button>
        </p>`
    : `<div class="row" style="justify-content:center">
          <button class="btn-quiet" id="retry">Zkusit lekci znovu</button>
          <button class="btn-quiet" data-go="home">Zpět na lekce</button>
          ${hasNext ? '<button class="btn-primary btn-big" id="next-lesson">Další lekce</button>' : ''}
        </div>`}
    </div>`;

  const nextBtn = app.root.querySelector('#next-lesson');
  if (goal.done && hasNext) focusSoon(app.root.querySelector('#rest'));
  if (nextBtn) {
    if (!(goal.done && hasNext)) focusSoon(nextBtn);
    nextBtn.addEventListener('click', () => app.go('lesson', { index: index + 1 }));
  }
  app.root.querySelector('#retry').addEventListener('click', () => app.go('lesson', { index }));

  const printBtn = app.root.querySelector('#print-sticker');
  if (printBtn) {
    printBtn.addEventListener('click', () =>
      printStickers([{ id: award.id, earnedAt: new Date().toISOString() }], app.profile.name));
  }
}

function rewardHtml(sticker) {
  return `
    <div class="reward">
      <p style="margin:0;font-weight:600">Něco pro tebe!</p>
      ${stickerSvg(sticker.id, 160)}
      <p style="margin:.2rem 0 1rem"><b>${esc(sticker.name)}</b> ti přibyl do notýsku.</p>
      <div class="row" style="justify-content:center">
        <button data-go="notebook">Otevřít notýsek</button>
        <button class="btn-quiet" id="print-sticker">Vytisknout k vybarvení</button>
      </div>
    </div>`;
}

function praise(r) {
  if (r.stars === 3) return 'Perfektní! Přesně tak se to má psát.';
  if (r.stars === 2) return 'Moc pěkně. Ještě kousek k plnému počtu hvězdiček.';
  if (r.stars === 1) return 'Dobrá práce. Příště zkus psát o něco pomaleji a přesněji.';
  return 'Tahle lekce byla těžká. Dej si pauzu a zkus ji ještě jednou, pomaleji.';
}
