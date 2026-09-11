/**
 * Jádro psaní. Tady záleží na každé milisekundě, proto se při každém úhozu
 * mění jen třída jednoho nebo dvou prvků, nic se nepřekresluje celé.
 *
 * Vstup se čte přes skrytý input a událost input, ne přes keydown. Díky tomu
 * fungují i mrtvé klávesy, tedy háček a čárka, kterými se skládá ď, ť, ň a ó.
 */

/** Delší pauzu než tohle považujeme za odchod od počítače a nepočítáme ji. */
const IDLE_MS = 20000;

/** Kolikrát nejvýš se řádek zopakuje, ať se dítě nezasekne donekonečna. */
const MAX_LINE_TRIES = 3;

export function createEngine(root, options = {}) {
  const state = {
    lines: [],
    spans: [],       // spans[řádek][znak]
    lineEls: [],
    cursorEl: null,
    justAdvanced: false,
    line: 0,
    pos: 0,
    lineErrors: 0,   // chyby na právě psaném řádku
    lineTries: 0,    // pokolikáté se ten řádek píše
    typed: 0,        // kolik znaků se odepsalo (bez oprav Backspacem)
    errors: 0,
    keyLog: [],
    elapsed: 0,
    lastTs: 0,
    started: false,
    finished: true,
  };

  const make = (tag, cls) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  };

  const wrap = make('div', 'engine');

  // rámeček s textem a překryvem, který vyzývá ke kliknutí
  const box = make('div', 'engine__box');
  const linesEl = make('div', 'engine__lines');
  linesEl.setAttribute('role', 'group');
  linesEl.setAttribute('aria-label', 'Text k opsání');
  const blurEl = make('div', 'engine__blur');
  blurEl.textContent = 'Klikni sem a piš';
  blurEl.hidden = true;
  box.appendChild(linesEl);
  box.appendChild(blurEl);

  // pruh postupu a číslo řádku vedle sebe, ať cvičení nezabírá zbytečnou výšku
  const foot = make('div', 'engine__foot');
  const barWrap = make('div', 'engine__bar');
  const barEl = make('i');
  barWrap.appendChild(barEl);
  const metaEl = make('div', 'engine__meta');
  foot.appendChild(barWrap);
  foot.appendChild(metaEl);

  const redoEl = make('div', 'engine__redo');
  redoEl.hidden = true;

  wrap.appendChild(box);
  wrap.appendChild(foot);
  wrap.appendChild(redoEl);

  const input = make('input', 'engine__input');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('aria-hidden', 'true');
  input.tabIndex = -1;
  wrap.appendChild(input);
  root.replaceChildren(wrap);

  /* ------------------------------------------------------------ vykreslení */

  function render() {
    linesEl.replaceChildren();
    state.spans = [];
    state.lineEls = [];
    state.lines.forEach((line, li) => {
      const div = document.createElement('div');
      div.className = 'line';
      const row = [];
      for (const ch of line) {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = ch === ' ' ? ' ' : ch;
        if (ch === ' ') s.classList.add('ch--space');
        div.appendChild(s);
        row.push(s);
      }
      linesEl.appendChild(div);
      state.spans.push(row);
      state.lineEls.push(div);
    });
    updateLineClasses();
    setCursor();
  }

  /** Vidět je vždycky jen jeden řádek, ten, který se právě píše. */
  function updateLineClasses() {
    state.lineEls.forEach((el, i) => {
      el.classList.toggle('line--active', i === state.line);
    });
    linesEl.scrollLeft = 0;
    metaEl.textContent = state.lines.length > 1
      ? `Řádek ${state.line + 1} ze ${state.lines.length}`
      : '';
  }

  function setCursor() {
    if (state.cursorEl) state.cursorEl.classList.remove('ch--cursor');
    const s = state.spans[state.line] && state.spans[state.line][state.pos];
    state.cursorEl = s || null;
    if (s) s.classList.add('ch--cursor');
  }

  function updateBar() {
    const total = state.lines.reduce((n, l) => n + l.length, 0) || 1;
    let done = 0;
    for (let i = 0; i < state.line; i++) done += state.lines[i].length;
    done += state.pos;
    barEl.style.width = Math.round((done / total) * 100) + '%';
  }

  /* ------------------------------------------------------------------ zvuk */

  let audio = null;
  function blip(freq, ms) {
    if (options.sound === 'off') return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.value = 0.05;
      osc.connect(gain).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + ms / 1000);
    } catch {
      /* zvuk je jen bonus, když nejde, nevadí */
    }
  }

  /* ------------------------------------------------------------------ vstup */

  let composing = false;

  function flush() {
    const v = input.value;
    if (!v) return;
    input.value = '';
    for (const ch of v) handleChar(ch);
  }

  input.addEventListener('compositionstart', () => {
    composing = true;
    // háček nebo čárka je stisknutá, teď se čeká na písmeno
    if (options.onCompose) options.onCompose(true);
  });
  input.addEventListener('compositionend', () => {
    composing = false;
    if (options.onCompose) options.onCompose(false);
    queueMicrotask(flush);
  });
  input.addEventListener('input', () => { if (!composing) flush(); });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      // V prvních lekcích se chyby neopravují, jen se píše dál. Tak se to
      // učí i v učebnicích: kdo opravuje každý překlep, prsty se nenaučí hmat.
      if (options.allowBackspace) backspace();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // řádky se přepínají samy, Enter jen posune, když je řádek hotový
      const line = state.lines[state.line];
      if (line && state.pos >= line.length) advanceLine();
    } else if (e.key === 'Escape') {
      input.blur();
    }
  });

  input.addEventListener('blur', () => { blurEl.hidden = false; });
  input.addEventListener('focus', () => { blurEl.hidden = true; });
  wrap.addEventListener('mousedown', (e) => {
    e.preventDefault();
    input.focus({ preventScroll: true });
  });

  /* ---------------------------------------------------------------- logika */

  function handleChar(ch) {
    if (state.finished) return;

    // Po dopsání řádku se skočí na další sám. Kdo je zvyklý psát, udeří na
    // konci řádku ještě mezeru, a ta se má tiše spolknout, ne počítat jako chyba.
    if (state.justAdvanced) {
      state.justAdvanced = false;
      if (ch === ' ') return;
    }

    const line = state.lines[state.line];
    if (state.pos >= line.length) {
      if (ch === ' ') return;
      advanceLine();
      return handleChar(ch);
    }

    const now = performance.now();
    if (!state.started) {
      state.started = true;
      state.lastTs = now;
      if (options.onStart) options.onStart();
    } else {
      const gap = now - state.lastTs;
      if (gap < IDLE_MS) state.elapsed += gap;
      state.lastTs = now;
    }

    const expected = line[state.pos];
    const ok = ch === expected;
    const span = state.spans[state.line][state.pos];

    state.typed += 1;
    if (!ok) {
      state.errors += 1;
      state.lineErrors += 1;
      blip(180, 90);
    } else if (options.sound === 'all') {
      blip(880, 25);
    }
    if (!redoEl.hidden) redoEl.hidden = true;

    state.keyLog.push({
      char: expected,
      ok,
      latency: state.keyLog.length ? now - (state.keyLog[state.keyLog.length - 1].ts || now) : 0,
      ts: now,
    });

    span.classList.remove('ch--cursor');
    span.classList.add(ok ? 'ch--ok' : 'ch--bad');
    state.pos += 1;

    if (state.pos >= line.length) {
      if (tooManyErrors()) repeatLine();
      else if (state.line >= state.lines.length - 1) return finish();
      else advanceLine();
    } else {
      setCursor();
    }
    updateBar();
    if (options.onProgress) options.onProgress(snapshot());
  }

  /**
   * Řádek plný chyb nemá smysl pouštět dál, špatný hmat by se jen upevňoval.
   * Po pár pokusech se ale jede dál, aby se dítě nezaseklo.
   */
  function tooManyErrors() {
    const limit = options.maxLineErrors;
    if (!limit || limit < 1) return false;
    return state.lineErrors > limit && state.lineTries + 1 < MAX_LINE_TRIES;
  }

  /** Vymaže napsaný řádek a nechá ho napsat znovu. */
  function repeatLine() {
    state.lineTries += 1;
    for (const span of state.spans[state.line]) {
      span.classList.remove('ch--ok', 'ch--bad', 'ch--cursor');
    }
    state.pos = 0;
    state.lineErrors = 0;
    state.cursorEl = null;
    redoEl.textContent = 'Chybek bylo moc. Zkus ten řádek ještě jednou, pomaleji.';
    redoEl.hidden = false;
    setCursor();
  }

  function advanceLine() {
    if (state.line >= state.lines.length - 1) return finish();
    state.line += 1;
    state.pos = 0;
    state.lineErrors = 0;
    state.lineTries = 0;
    state.justAdvanced = true;
    updateLineClasses();
    setCursor();
    updateBar();
  }

  function backspace() {
    if (state.finished) return;
    if (state.pos === 0) return; // přes začátek řádku zpátky nechodíme
    state.pos -= 1;
    const span = state.spans[state.line][state.pos];
    span.classList.remove('ch--ok', 'ch--bad');
    setCursor();
    updateBar();
    // chyba zůstává započítaná: co bylo jednou špatně, to se nedá vymazat
  }

  function snapshot() {
    const total = state.lines.reduce((n, l) => n + l.length, 0);
    let done = 0;
    for (let i = 0; i < state.line; i++) done += state.lines[i].length;
    done += state.pos;
    return { done, total, typed: state.typed, errors: state.errors, elapsed: state.elapsed };
  }

  function finish() {
    if (state.finished) return;
    state.finished = true;
    input.blur();
    blurEl.hidden = true;
    const result = {
      typed: state.typed,
      errors: state.errors,
      durationMs: Math.max(1, Math.round(state.elapsed)),
      keyLog: state.keyLog.map((k) => ({ char: k.char, ok: k.ok, latency: k.latency })),
    };
    if (options.onFinish) options.onFinish(result);
  }

  /* --------------------------------------------------------------- veřejné */

  return {
    /** Nahraje nové cvičení a začne odznova. */
    load(lines) {
      Object.assign(state, {
        // Řádek nesmí začínat ani končit mezerou. Cvičení, které končí mezerou,
        // by po dítěti chtělo úhoz, který na obrazovce není vidět.
        lines: lines.map((l) => l.trim().replace(/\s+/g, ' ')).filter((l) => l.length),
        cursorEl: null,
        justAdvanced: false,
        line: 0,
        pos: 0,
        lineErrors: 0,
        lineTries: 0,
        typed: 0,
        errors: 0,
        keyLog: [],
        elapsed: 0,
        lastTs: 0,
        started: false,
        finished: false,
      });
      input.value = '';
      // dokud vstup není zaostřený, je přes text vidět výzva ke kliknutí
      blurEl.hidden = false;
      redoEl.hidden = true;
      render();
      updateBar();
    },
    focus() { input.focus({ preventScroll: true }); },
    /** Znak, který se má napsat jako další. Používá se pro nápovědu na klávesnici. */
    nextChar() {
      const line = state.lines[state.line];
      if (!line) return null;
      if (state.pos < line.length) return line[state.pos];
      const next = state.lines[state.line + 1];
      return next ? next[0] : null;
    },
    snapshot,
    isFinished() { return state.finished; },
    setSound(mode) { options.sound = mode; },
    destroy() { root.replaceChildren(); },
  };
}
