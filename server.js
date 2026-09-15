'use strict';
/*
 * Lokální server pro výukový program psaní všemi deseti.
 * Bez jediné externí závislosti - stačí Node.js.
 *
 *   node server.js            spustí na http://127.0.0.1:7331
 *   node server.js --port 8080
 */

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const ROOT = __dirname;
const WEB_DIR = path.join(ROOT, 'web');
// Profily se ukládají vedle programu. Proměnná prostředí PSANI_DATA umí
// složku přesměrovat jinam, což se hodí při zkoušení, aby se nesahalo
// na opravdová data dětí.
const DATA_DIR = process.env.PSANI_DATA
  ? path.resolve(process.env.PSANI_DATA)
  : path.join(ROOT, 'data');

const PORT = readPortArg() || Number(process.env.PORT) || 7331;
const HOST = '127.0.0.1';

const LOG_FILE = path.join(DATA_DIR, 'server.log');

/** Zapíše řádek do okna i do souboru, ať jde zpětně zjistit, co se dělo. */
function log(...parts) {
  const line = new Date().toISOString() + '  ' + parts.join(' ') + '\n';
  process.stdout.write(line);
  try {
    // ať log neroste donekonečna: po megabajtu se začne od začátku
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > 1024 * 1024) {
      fs.writeFileSync(LOG_FILE, '');
    }
    fs.appendFileSync(LOG_FILE, line);
  } catch {
    /* když nejde psát log, program kvůli tomu končit nebude */
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function readPortArg() {
  const i = process.argv.indexOf('--port');
  if (i !== -1 && process.argv[i + 1]) return Number(process.argv[i + 1]);
  return 0;
}

/* ---------------------------------------------------------------- profily */

/** Prevede jmeno na bezpecne id souboru: "Jana Nováková" -> "jana-novakova". */
function slugify(name) {
  const base = String(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'uzivatel';
}

function userPath(id) {
  // id vzniká jen přes slugify, ale jistota nikoho nezabije
  if (!/^[a-z0-9-]{1,64}$/.test(id)) return null;
  return path.join(DATA_DIR, id + '.json');
}

function emptyProfile(id, name) {
  return {
    id,
    name,
    createdAt: new Date().toISOString(),
    settings: {
      layout: 'cs-qwertz',
      showKeyboard: true,
      showHands: true,
      sound: 'error',    // 'off' | 'error' | 'all'
      maxLineErrors: 2,     // 0 = bez omezení
      dailyGoalMinutes: 10, // dnešní cíl, který dítě vidí na úvodní stránce
    },
    lessons: {},  // id lekce -> { stars, bestCpm, bestAccuracy, attempts[] }
    kindStats: {},// druh cvičení -> { runs, keystrokes, errors, durationMs, recent[] }
    rhythm: {},   // rytmus po druzích přechodu mezi úhozy
    keyStats: {}, // znak -> { presses, errors, latencyEma }
    stickers: [], // { id, earnedAt, lessonId }
    days: {},     // 'YYYY-MM-DD' -> { seconds, keystrokes, errors }
    assignments: [], // cvičení navíc od rodiče: { id, kind, at, doneAt }
  };
}

async function readProfile(id) {
  const p = userPath(id);
  if (!p) return null;
  try {
    return JSON.parse(await fsp.readFile(p, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/** Zápis přes dočasný soubor a přejmenování, aby se profil nemohl poškodit. */
async function writeProfile(profile) {
  const p = userPath(profile.id);
  if (!p) throw new Error('neplatné id profilu');
  const tmp = p + '.' + randomUUID().slice(0, 8) + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(profile, null, 2), 'utf8');
  await fsp.rename(tmp, p);
}

async function listProfiles() {
  const files = await fsp.readdir(DATA_DIR).catch(() => []);
  const out = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const prof = await readProfile(f.slice(0, -5));
    if (!prof) continue;
    out.push({
      id: prof.id,
      name: prof.name,
      createdAt: prof.createdAt,
      lessonsDone: Object.values(prof.lessons || {}).filter((l) => l.stars > 0).length,
      stickers: (prof.stickers || []).length,
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
  return out;
}

/** Dnešní datum v místním čase jako YYYY-MM-DD. */
function today() {
  return new Date().toLocaleDateString('sv-SE');
}

const EMA_ALPHA = 0.2;

/**
 * Zapíše výsledek jednoho cvičení do profilu.
 * Tělo z klienta: { lessonId, cpm, netCpm, accuracy, errors, keystrokes,
 *                   durationMs, stars, keys: { znak: { presses, errors, meanLatency } } }
 */
/**
 * Výsledky jednotlivých cvičení podle druhu. Odsud se pozná, co dělá
 * potíže: lekce míchá rozcvičku, nácvik kláves i věty dohromady, takže
 * samotný průměr za lekci to schová.
 */
function applySteps(profile, steps) {
  if (!Array.isArray(steps)) return;
  profile.kindStats = profile.kindStats || {};

  for (const s of steps.slice(0, 30)) {
    const kind = String(s.kind || '').slice(0, 24);
    if (!kind) continue;
    const typed = num(s.typed);
    const ms = num(s.durationMs);
    if (typed <= 0 || ms <= 0) continue;

    const cur = profile.kindStats[kind]
      || { runs: 0, keystrokes: 0, errors: 0, durationMs: 0, recent: [] };
    cur.runs += 1;
    cur.keystrokes += typed;
    cur.errors += num(s.errors);
    cur.durationMs += ms;
    cur.lastAt = new Date().toISOString();
    // pár posledních čistých rychlostí kvůli trendu, víc není potřeba
    cur.recent = (cur.recent || []).concat(Math.round(((typed - num(s.errors)) / ms) * 60000));
    if (cur.recent.length > 10) cur.recent = cur.recent.slice(-10);
    profile.kindStats[kind] = cur;
  }
}

/**
 * Rytmus psaní po druzích přechodu mezi úhozy. Klient pošle souhrn za lekci,
 * tady se jen přičte k dosavadnímu, ať se dá sledovat, kde padají pauzy.
 */
function applyRhythm(profile, rhythm) {
  if (!rhythm || !rhythm.classes) return;
  // starší profil má rhythm prázdný objekt, nový ho nemá vůbec
  const cur = profile.rhythm && profile.rhythm.classes
    ? profile.rhythm
    : { strokes: 0, runs: 0, medians: [], classes: {} };

  cur.runs += 1;
  cur.strokes += num(rhythm.strokes);
  cur.medians = (cur.medians || []).concat(num(rhythm.median)).slice(-50);

  for (const [name, s] of Object.entries(rhythm.classes)) {
    const key = String(name).slice(0, 24);
    const c = cur.classes[key] || { strokes: 0, sumMs: 0, slow: 0, errors: 0 };
    c.strokes += num(s.strokes);
    c.sumMs += num(s.sumMs);
    c.slow += num(s.slow);
    c.errors += num(s.errors);
    cur.classes[key] = c;
  }
  profile.rhythm = cur;
}

/**
 * Syrový záznam úhozů do vlastního souboru vedle profilu.
 *
 * Do profilu nepatří: rostl by donekonečna a přepisuje se celý při každém
 * uložení. Tady se jen přidává řádek, takže se dá kdykoliv rozebrat, i na
 * něco, co dneska ještě neměříme.
 */
async function appendStrokes(profile, r) {
  if (!Array.isArray(r.strokes) || !r.strokes.length) return;
  const file = path.join(DATA_DIR, profile.id + '.keys.jsonl');
  const at = new Date().toISOString();
  const lines = r.strokes
    .filter((s) => s && typeof s.chars === 'string' && s.chars.length)
    .map((s, i) => JSON.stringify({
      at,
      lesson: String(r.lessonId || '').slice(0, 32),
      step: i,
      kind: String(s.kind || '').slice(0, 24),
      practice: !!r.practice,
      chars: s.chars.slice(0, 4000),
      typed: String(s.typed || '').slice(0, 4000),
      lat: Array.isArray(s.lat) ? s.lat.slice(0, 4000).map((x) => Math.round(num(x))) : [],
      ok: String(s.ok || '').slice(0, 4000),
      line: String(s.line || '').slice(0, 8000),
    }));
  if (lines.length) await fsp.appendFile(file, lines.join('\n') + '\n', 'utf8');
}

function applyResult(profile, r) {
  const lessonId = String(r.lessonId || '').slice(0, 32);
  if (!lessonId) throw new Error('chybí lessonId');

  applySteps(profile, r.steps);
  applyRhythm(profile, r.rhythm);

  // Cvičení navíc se do osnovy nezapisuje. Nemá hvězdičky ani rekord,
  // jen se odškrtne jako hotové a započítá do dne a do druhů cvičení.
  if (r.practice) {
    const attempt = {
      at: new Date().toISOString(),
      netCpm: num(r.netCpm),
      accuracy: num(r.accuracy),
      errors: num(r.errors),
      keystrokes: num(r.keystrokes),
      durationMs: num(r.durationMs),
      practice: true,
    };
    closeAssignment(profile, String(r.assignmentId || ''), r.steps);
    applyKeys(profile, r.keys);
    applyDay(profile, attempt);
    return attempt;
  }

  const rec = profile.lessons[lessonId] || { stars: 0, bestCpm: 0, bestAccuracy: 0, attempts: [] };
  const attempt = {
    at: new Date().toISOString(),
    cpm: num(r.cpm),
    netCpm: num(r.netCpm),
    accuracy: num(r.accuracy),
    errors: num(r.errors),
    keystrokes: num(r.keystrokes),
    durationMs: num(r.durationMs),
    stars: Math.max(0, Math.min(3, Math.round(num(r.stars)))),
  };
  // Když se opakovala jen část lekce, výsledek se zapíše do historie, ale
  // hvězdičky ani rekord nezvedne. Jinak by šlo získat tři hvězdičky za
  // zopakování jednoho snadného cvičení.
  attempt.partial = !!r.partial;
  rec.attempts.push(attempt);
  if (rec.attempts.length > 20) rec.attempts = rec.attempts.slice(-20);
  // Přerušená lekce si pamatuje, kde pokračovat. Posílá se to spolu s výsledkem,
  // protože dva zápisy profilu hned po sobě by se navzájem přepsaly.
  if (attempt.partial && r.resumeStep !== undefined) {
    rec.lastStep = Math.max(0, Math.min(50, Math.round(num(r.resumeStep))));
  }
  if (!attempt.partial) {
    rec.stars = Math.max(rec.stars || 0, attempt.stars);
    rec.bestCpm = Math.max(rec.bestCpm || 0, attempt.netCpm);
    rec.bestAccuracy = Math.max(rec.bestAccuracy || 0, attempt.accuracy);
    delete rec.lastStep;
  }
  rec.lastAt = attempt.at;
  profile.lessons[lessonId] = rec;

  applyKeys(profile, r.keys);
  applyDay(profile, attempt);

  return attempt;
}

/** Statistiky jednotlivých kláves. */
function applyKeys(profile, keys) {
  for (const [ch, s] of Object.entries(keys || {})) {
    if (typeof ch !== 'string' || ch.length > 4) continue;
    const cur = profile.keyStats[ch] || { presses: 0, errors: 0, latencyEma: 0 };
    cur.presses += num(s.presses);
    cur.errors += num(s.errors);
    const lat = num(s.meanLatency);
    if (lat > 0) {
      cur.latencyEma = cur.latencyEma > 0
        ? Math.round(cur.latencyEma * (1 - EMA_ALPHA) + lat * EMA_ALPHA)
        : Math.round(lat);
    }
    profile.keyStats[ch] = cur;
  }
}

/** Denní souhrn, ze kterého se počítá dnešní cíl. */
function applyDay(profile, attempt) {
  const day = profile.days[today()] || { seconds: 0, keystrokes: 0, errors: 0 };
  day.seconds += Math.round(num(attempt.durationMs) / 1000);
  day.keystrokes += num(attempt.keystrokes);
  day.errors += num(attempt.errors);
  profile.days[today()] = day;
}

/** Hotová cvičení navíc se drží týden, ať je rodič v přehledu ještě vidí. */
function keepDone(a) {
  return Date.now() - Date.parse(a.doneAt) < 7 * 24 * 3600 * 1000;
}

/**
 * Průměr druhu cvičení k danému okamžiku. Null, když se ještě nedělal.
 * Drží se u zadání, aby rodič viděl, jak to vypadalo předtím.
 */
function snapshot(s) {
  if (!s || !s.keystrokes || !s.durationMs) return null;
  return {
    runs: s.runs || 0,
    netCpm: Math.round(Math.max(0, s.keystrokes - s.errors) / (s.durationMs / 60000)),
    accuracy: Math.max(0, (s.keystrokes - s.errors) / s.keystrokes),
  };
}

/** Jak dopadla ta cvičení, o která v zadání šlo. */
function runOf(steps, kind) {
  const mine = (Array.isArray(steps) ? steps : []).filter((s) => s.kind === kind);
  const typed = mine.reduce((n, s) => n + num(s.typed), 0);
  const errors = mine.reduce((n, s) => n + num(s.errors), 0);
  const ms = mine.reduce((n, s) => n + num(s.durationMs), 0);
  if (!typed || !ms) return null;
  return {
    runs: mine.length,
    netCpm: Math.round(Math.max(0, typed - errors) / (ms / 60000)),
    accuracy: Math.max(0, (typed - errors) / typed),
  };
}

/** Odškrtne zadané cvičení navíc. Bez id se zavře nejstarší nehotové. */
function closeAssignment(profile, id, steps) {
  const list = profile.assignments || [];
  const open = list.filter((a) => !a.doneAt);
  const target = open.find((a) => a.id === id) || open[0];
  if (target) {
    target.doneAt = new Date().toISOString();
    target.after = runOf(steps, target.kind);
  }
  profile.assignments = list;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ------------------------------------------------------------------- HTTP */

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

function readBody(req, limit = 1024 * 512) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > limit) {
        reject(new Error('tělo požadavku je příliš velké'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error('neplatný JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath);
  if (rel === '/' || rel === '') rel = '/index.html';
  const full = path.join(WEB_DIR, path.normalize(rel));
  if (!full.startsWith(WEB_DIR)) {
    res.writeHead(403).end('Zakázáno');
    return;
  }
  try {
    const stat = await fsp.stat(full);
    if (stat.isDirectory()) throw Object.assign(new Error('dir'), { code: 'ENOENT' });
    res.writeHead(200, {
      'content-type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'content-length': stat.size,
      // vývoj i provoz na jednom stroji: ať se vždy načte aktuální verze
      'cache-control': 'no-cache',
    });
    fs.createReadStream(full).pipe(res);
  } catch (err) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Nenalezeno: ' + rel);
  }
}

async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api', 'users', id, ...]
  const method = req.method;

  if (parts[1] === 'users' && parts.length === 2) {
    if (method === 'GET') return sendJson(res, 200, await listProfiles());
    if (method === 'POST') {
      const body = await readBody(req);
      const name = String(body.name || '').trim().slice(0, 40);
      if (!name) return sendJson(res, 400, { error: 'Vyplň prosím jméno.' });
      const id = slugify(name);
      if (await readProfile(id)) {
        return sendJson(res, 409, { error: 'Profil s tímto jménem už existuje.' });
      }
      const profile = emptyProfile(id, name);
      // pátý pád odvozuje prohlížeč, server jen uloží, co dostal
      profile.settings.vocative = String(body.vocative || name).trim().slice(0, 40);
      await writeProfile(profile);
      return sendJson(res, 201, profile);
    }
  }

  if (parts[1] === 'users' && parts.length >= 3) {
    const id = parts[2];
    const profile = await readProfile(id);
    if (!profile) return sendJson(res, 404, { error: 'Profil nenalezen.' });

    if (parts.length === 3 && method === 'GET') return sendJson(res, 200, profile);

    if (parts[3] === 'result' && method === 'POST') {
      const body = await readBody(req);
      const attempt = applyResult(profile, body);
      await writeProfile(profile);
      // syrový záznam jde stranou, výsledek se kvůli němu nesmí zdržet
      appendStrokes(profile, body).catch((err) => log('záznam úhozů selhal:', err.message));
      return sendJson(res, 200, { attempt, profile });
    }

    if (parts[3] === 'settings' && method === 'PATCH') {
      const body = await readBody(req);
      profile.settings = { ...profile.settings, ...body };
      await writeProfile(profile);
      return sendJson(res, 200, profile);
    }

    // kde dítě uprostřed lekce skončilo, ať se má kam vrátit
    if (parts[3] === 'progress' && method === 'POST') {
      const body = await readBody(req);
      const lessonId = String(body.lessonId || '').slice(0, 32);
      if (lessonId) {
        const rec = profile.lessons[lessonId] || { stars: 0, bestCpm: 0, bestAccuracy: 0, attempts: [] };
        if (body.step === null || body.step === undefined) delete rec.lastStep;
        else rec.lastStep = Math.max(0, Math.min(50, Math.round(num(body.step))));
        profile.lessons[lessonId] = rec;
        await writeProfile(profile);
      }
      return sendJson(res, 200, { ok: true });
    }

    // cvičení navíc, které zadává rodič ze svého přehledu
    if (parts[3] === 'assignment' && method === 'POST') {
      const body = await readBody(req);
      const kind = String(body.kind || '').slice(0, 24);
      if (!kind) return sendJson(res, 400, { error: 'Chybí druh cvičení.' });
      // Zadat jde jen druh, který dítě už dělalo. Jinak by se přes cvičení
      // navíc dostalo k látce, kterou ještě nemělo, třeba k číslicím.
      if (!(profile.kindStats || {})[kind]) {
        return sendJson(res, 400, { error: 'Tenhle druh cvičení dítě zatím nedělalo.' });
      }
      profile.assignments = (profile.assignments || []).filter((a) => !a.doneAt || keepDone(a));
      profile.assignments.push({
        id: 'a' + Date.now().toString(36),
        kind,
        at: new Date().toISOString(),
        doneAt: null,
        // stav druhu v okamžiku zadání, aby šlo po cvičení porovnat před a po
        before: snapshot(profile.kindStats[kind]),
      });
      await writeProfile(profile);
      return sendJson(res, 200, profile);
    }

    if (parts[3] === 'assignment' && method === 'DELETE') {
      const wanted = String(parts[4] || '');
      profile.assignments = (profile.assignments || []).filter((a) => a.id !== wanted);
      await writeProfile(profile);
      return sendJson(res, 200, profile);
    }

    if (parts[3] === 'sticker' && method === 'POST') {
      const body = await readBody(req);
      const stickerId = String(body.stickerId || '').slice(0, 40);
      if (stickerId && !profile.stickers.some((s) => s.id === stickerId)) {
        profile.stickers.push({
          id: stickerId,
          earnedAt: new Date().toISOString(),
          lessonId: String(body.lessonId || '').slice(0, 32),
        });
        await writeProfile(profile);
      }
      return sendJson(res, 200, { stickers: profile.stickers });
    }

    if (parts.length === 3 && method === 'DELETE') {
      await fsp.unlink(userPath(id));
      return sendJson(res, 200, { ok: true });
    }
  }

  return sendJson(res, 404, { error: 'Neznámé API: ' + url.pathname });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + HOST);
  const isApi = url.pathname.startsWith('/api/');
  try {
    if (isApi) {
      log(req.method, url.pathname);
      return await handleApi(req, res, url);
    }
    return await serveStatic(req, res, url.pathname);
  } catch (err) {
    log('CHYBA', req.method, url.pathname, '->', err.stack || err.message);
    try {
      if (!res.headersSent) sendJson(res, 500, { error: err.message });
      else res.end();
    } catch {
      /* spojení už mezitím spadlo, nic s tím nenaděláme */
    }
  }
});

// Program běží dítěti pod rukama. Když se něco pokazí, radši to zapíšeme
// do logu a poběžíme dál, než aby uprostřed lekce zmizel server.
server.on('clientError', (err, socket) => {
  log('CHYBA SPOJENÍ', err.message);
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
process.on('uncaughtException', (err) => log('NEODCHYCENÁ CHYBA', err.stack || err));
process.on('unhandledRejection', (err) => log('NEODCHYCENÝ SLIB', (err && err.stack) || err));

/** Otevře výchozí prohlížeč na dané adrese (Windows, macOS, Linux). */
function openBrowser(url) {
  const { spawn } = require('node:child_process');
  const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', url]]
    : process.platform === 'darwin' ? ['open', [url]]
    : ['xdg-open', [url]];
  try {
    spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore' }).unref();
  } catch {
    console.log('  Otevři prosím ručně: ' + url);
  }
}

if (require.main === module) {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const BASE = 'http://' + HOST + ':' + PORT;

  /** Kterou stránku má program po startu otevřít. */
  function pageToOpen() {
    if (process.argv.includes('--open-parents')) return BASE + '/rodice.html';
    if (process.argv.includes('--open')) return BASE + '/';
    return null;
  }

  /**
   * Běžící program drží kód tak, jak vypadal při spuštění. Kdo do něj sáhne,
   * čeká změnu a nechápe, proč se nic neděje. Tohle na to jednou upozorní,
   * víckrát ne, ať okno nezahltí.
   */
  function watchForChanges() {
    let said = false;
    const notice = () => {
      if (said) return;
      said = true;
      log('Soubory programu se změnily. Zavři tohle okno a spusť start.bat znovu,');
      log('jinak poběží dál ta verze, se kterou se program zapnul.');
    };
    for (const target of [__filename, WEB_DIR]) {
      try {
        fs.watch(target, { recursive: target === WEB_DIR }, notice).unref();
      } catch {
        /* hlídání souborů je jen pohodlí, bez něj program běží dál */
      }
    }
  }

  server.listen(PORT, HOST, () => {
    console.log('');
    console.log('  Píšeme všemi deseti  ->  ' + BASE);
    console.log('  Pro rodiče           ->  ' + BASE + '/rodice.html');
    console.log('  Profily se ukládají do: ' + DATA_DIR);
    console.log('  Konec: Ctrl+C');
    console.log('');
    const page = pageToOpen();
    if (page) openBrowser(page);
    watchForChanges();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const page = pageToOpen();
      if (page) {
        // program už běží v jiném okně, tak jen otevřeme prohlížeč a nekřičíme
        console.log('  Program už běží, otevírám prohlížeč.');
        openBrowser(page);
        setTimeout(() => process.exit(0), 1500);
        return;
      }
      console.error('Port ' + PORT + ' je obsazený. Program už možná běží v jiném okně.');
      console.error('Jiný port: node server.js --port 7332');
      process.exit(1);
      return;
    }
    throw err;
  });
}

module.exports = { slugify, applyResult, emptyProfile };
