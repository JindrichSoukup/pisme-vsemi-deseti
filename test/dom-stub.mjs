/**
 * Nejmenší možná náhrada DOM, aby se dalo jádro psaní otestovat v Node.
 * Umí jen to, co engine.js opravdu používá.
 */

class ClassList {
  constructor() { this.set = new Set(); }
  add(...c) { c.forEach((x) => this.set.add(x)); }
  remove(...c) { c.forEach((x) => this.set.delete(x)); }
  contains(c) { return this.set.has(c); }
  toggle(c, force) {
    const on = force === undefined ? !this.set.has(c) : force;
    if (on) this.set.add(c); else this.set.delete(c);
    return on;
  }
  toString() { return [...this.set].join(' '); }
}

class El {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attrs = {};
    this.classList = new ClassList();
    this.style = {};
    this.textContent = '';
    this.hidden = false;
    this.value = '';
    this.listeners = new Map();
    // rozměry: nula znamená, že se posun řádků nepočítá
    this.scrollHeight = 0;
    this.clientHeight = 0;
    this.offsetTop = 0;
    this.offsetHeight = 0;
    this.scrollTop = 0;
    this.innerHTML = '';
  }

  set className(v) {
    this.classList = new ClassList();
    String(v).split(/\s+/).filter(Boolean).forEach((c) => this.classList.add(c));
  }
  get className() { return this.classList.toString(); }

  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] ?? null; }

  appendChild(el) { this.children.push(el); return el; }
  replaceChildren(...els) { this.children = els; }

  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  dispatch(type, event = {}) {
    const ev = { type, preventDefault() {}, ...event };
    for (const fn of this.listeners.get(type) || []) fn(ev);
  }

  focus() { this.dispatch('focus'); }
  blur() { this.dispatch('blur'); }

  /** Text všech potomků, pro kontrolu ve zkoušce. */
  get text() {
    return this.children.length
      ? this.children.map((c) => c.text).join('')
      : this.textContent;
  }
}

/** Nainstaluje stub a hodiny, které se dají posouvat ručně. */
export function installDom() {
  const clock = { now: 0 };
  globalThis.document = { createElement: (tag) => new El(tag) };
  globalThis.performance = { now: () => clock.now };
  return {
    clock,
    root: new El('div'),
    /** Najde skrytý vstup v právě vytvořeném enginu. */
    inputOf(root) {
      return root.children[0].children.find((c) => c.tagName === 'INPUT');
    },
    linesOf(root) {
      return root.children[0].children[0];
    },
  };
}

/** Napíše text do enginu tak, jak by to udělal prohlížeč. */
export function typeText(input, text, clock, msPerKey = 200) {
  for (const ch of text) {
    clock.now += msPerKey;
    input.value = ch;
    input.dispatch('input');
  }
}

/** Napíše znak skládaný mrtvou klávesou (háček nebo čárka a pak písmeno). */
export async function typeDead(input, composed, clock, msPerKey = 200) {
  clock.now += msPerKey;
  input.dispatch('compositionstart');
  input.value = composed;
  input.dispatch('compositionend');
  await Promise.resolve();
}
