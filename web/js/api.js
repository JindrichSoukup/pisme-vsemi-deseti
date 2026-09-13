/** Komunikace s lokálním serverem. Nic z toho neopouští tvůj počítač. */

async function req(url, options) {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Nepovedlo se spojit s programem.');
  return data;
}

export const api = {
  listUsers: () => req('/api/users'),
  createUser: (name, vocative) =>
    req('/api/users', { method: 'POST', body: JSON.stringify({ name, vocative }) }),
  getUser: (id) => req('/api/users/' + id),
  saveResult: (id, result) =>
    req(`/api/users/${id}/result`, { method: 'POST', body: JSON.stringify(result) }),
  saveSettings: (id, settings) =>
    req(`/api/users/${id}/settings`, { method: 'PATCH', body: JSON.stringify(settings) }),
  saveProgress: (id, lessonId, step) =>
    req(`/api/users/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ lessonId, step }),
    }),
  addSticker: (id, stickerId, lessonId) =>
    req(`/api/users/${id}/sticker`, {
      method: 'POST',
      body: JSON.stringify({ stickerId, lessonId }),
    }),
  addAssignment: (id, kind) =>
    req(`/api/users/${id}/assignment`, { method: 'POST', body: JSON.stringify({ kind }) }),
  removeAssignment: (id, assignmentId) =>
    req(`/api/users/${id}/assignment/${assignmentId}`, { method: 'DELETE' }),
  deleteUser: (id) => req('/api/users/' + id, { method: 'DELETE' }),
};

/* --------------------------------------------------- záloha nedoručeného */

/**
 * Kdyby server zrovna neodpovídal, výsledek se neztratí: schová se
 * v prohlížeči a odešle se sám, jakmile se program zase ozve. Dítě
 * o odvedenou práci nesmí přijít kvůli výpadku spojení.
 */
const PENDING_KEY = 'psani.neulozeno';

function readPending() {
  try {
    const raw = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writePending(list) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-50)));
  } catch {
    /* plný nebo zakázaný localStorage, víc udělat nejde */
  }
}

function enqueue(entry) {
  const list = readPending();
  list.push({ ...entry, at: Date.now() });
  writePending(list);
}

async function twice(fn) {
  try {
    return await fn();
  } catch (first) {
    await new Promise((r) => setTimeout(r, 500));
    return fn();
  }
}

/** Uloží výsledek. Když se to nepovede, zařadí ho do fronty a chybu ohlásí. */
export async function saveResultSafe(userId, result) {
  try {
    return await twice(() => api.saveResult(userId, result));
  } catch (err) {
    enqueue({ kind: 'result', userId, payload: result });
    throw err;
  }
}

/** Totéž pro získaný obrázek. */
export async function saveStickerSafe(userId, stickerId, lessonId) {
  try {
    return await twice(() => api.addSticker(userId, stickerId, lessonId));
  } catch (err) {
    enqueue({ kind: 'sticker', userId, payload: { stickerId, lessonId } });
    throw err;
  }
}

/** Zkusí odeslat všechno, co zůstalo ve frontě. Vrací počet odeslaných. */
export async function flushPending() {
  const list = readPending();
  if (!list.length) return 0;
  const left = [];
  let sent = 0;
  for (const item of list) {
    try {
      if (item.kind === 'result') await api.saveResult(item.userId, item.payload);
      else if (item.kind === 'sticker') {
        await api.addSticker(item.userId, item.payload.stickerId, item.payload.lessonId);
      }
      sent += 1;
    } catch {
      left.push(item);
    }
  }
  writePending(left);
  return sent;
}


/** Naposledy zvolený profil si pamatujeme v prohlížeči, ať se nemusí pořád vybírat. */
export const lastUser = {
  get() {
    try { return localStorage.getItem('psani.lastUser') || null; } catch { return null; }
  },
  set(id) {
    try { localStorage.setItem('psani.lastUser', id); } catch { /* nevadí */ }
  },
  clear() {
    try { localStorage.removeItem('psani.lastUser'); } catch { /* nevadí */ }
  },
};
