/**
 * Udělá z dokumentů ve složce docs soubory .docx a .html.
 *
 *   node tools/make-docs.mjs
 *
 * Zdrojem je vždycky Markdown, aby se text psal a opravoval na jednom místě.
 * Word je na čtení a tisk, HTML je připravené k vystavení na osobní stránku,
 * proto se drží jejího vzhledu.
 *
 * Podporuje se jen to, co je v těch dokumentech potřeba: tři úrovně nadpisů,
 * odstavce, odrážky a odsazené bloky s ukázkou cvičení.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { docx, p, bullet, mono } from './docx.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(here, '..', 'docs');

/** Dokumenty psané anglicky. Kvůli atributu lang, čtečky se podle něj řídí. */
const ENGLISH = new Set(['didactics.md', 'motivation.md', 'czech-keyboard.md']);

const REPO = 'https://github.com/JindrichSoukup/pisme-vsemi-deseti';

/**
 * Řádek nahoře. Kromě cesty zpátky na rozcestník říká, k čemu poznámka
 * patří, protože na ni většina lidí přijde rovnou odjinud a samotný text
 * program nepředstavuje.
 */
const BACK = {
  cs: `<a href="index.html">← Jindřich Soukup</a> · poznámka k programu
    <a href="${REPO}">Píšeme všemi deseti</a>, výuce psaní na české klávesnici`,
  en: `<a href="index.html">← Jindřich Soukup</a> · a note on
    <a href="${REPO}">Píšeme všemi deseti</a>, a touch-typing course for Czech children`,
};

/** Táž poznámka v druhém jazyce. Odkaz se nabízí nahoře vedle cesty zpátky. */
const OTHER_LANGUAGE = {
  'didaktika.md': 'didactics.md',
  'didactics.md': 'didaktika.md',
  'psychologie.md': 'motivation.md',
  'motivation.md': 'psychologie.md',
  'cestina.md': 'czech-keyboard.md',
  'czech-keyboard.md': 'cestina.md',
};

/**
 * Rozebere Markdown na bloky. Z jednoho rozboru se pak vyrábí Word i HTML,
 * aby se obojí nemohlo rozejít.
 *
 * Blok je { kind: 'heading' | 'text' | 'item' | 'pre', ... }.
 */
function parse(markdown) {
  const blocks = [];
  let paragraph = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ kind: 'text', text: paragraph.join(' ') });
    paragraph = [];
  };

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '');

    if (!line.trim()) {
      flush();
      continue;
    }
    // odsazený blok je ukázka cvičení, píše se neproporcionálním písmem
    if (/^ {4}\S/.test(line)) {
      const last = blocks[blocks.length - 1];
      flush();
      if (last && last.kind === 'pre' && blocks[blocks.length - 1] === last) {
        last.lines.push(line.slice(4));
      } else {
        blocks.push({ kind: 'pre', lines: [line.slice(4)] });
      }
      continue;
    }
    // odsazené pokračování odrážky patří k ní, ne do nového odstavce
    const open = blocks[blocks.length - 1];
    if (!paragraph.length && /^\s+\S/.test(line) && open && open.kind === 'item') {
      open.text += ` ${line.trim()}`;
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flush();
      blocks.push({ kind: 'item', text: line.replace(/^[-*]\s+/, '') });
      continue;
    }
    paragraph.push(line.trim());
  }
  flush();
  return blocks;
}

/** Odstraní značky, které Word nepotřebuje. */
function clean(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, text, href) => `${text} (${href.replace(/\.md$/, '.docx')})`);
}

/** Odstavce pro Word. */
function toDocx(blocks) {
  const out = [];
  for (const b of blocks) {
    if (b.kind === 'heading') {
      out.push(p(clean(b.text), ['Nadpis', 'Blok', 'Krok'][b.level - 1]));
    } else if (b.kind === 'item') {
      out.push(bullet(clean(b.text)));
    } else if (b.kind === 'pre') {
      for (const line of b.lines) out.push(mono(line));
    } else {
      out.push(p(clean(b.text)));
    }
  }
  return out;
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Značky uvnitř řádku. Odkaz se dělá až nakonec, aby se do jeho adresy
 * nepletly ostatní náhrady, a holá adresa se pozná podle http.
 */
function inline(text) {
  return escapeHtml(text)
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\(([^)\s]+)\)/g, (_, text, href) => `<a href="${href.replace(/\.md$/, '.html')}">${text}</a>`)
    .replace(/(^|[\s(])(https?:\/\/[^\s<),]+)/g, '$1<a href="$2">$2</a>');
}

/**
 * Odrážka v seznamu zdrojů má tvar "název, adresa". Na webu se z ní udělá
 * odkaz pod názvem, protože vypsaná adresa je dlouhá a na mobilu přetéká.
 * Ve Wordu adresa zůstane vypsaná, tam se klikat nedá.
 */
function source(text) {
  const m = text.match(/^(.*[^\s,]),\s*(https?:\/\/\S+)$/);
  return m ? `[${m[1]}](${m[2]})` : text;
}

/** Odkaz na tutéž poznámku v druhém jazyce, nebo prázdno, když protějšek není. */
function switcher(name) {
  const other = OTHER_LANGUAGE[name];
  if (!other) return '';
  const lang = ENGLISH.has(other) ? 'en' : 'cs';
  const label = lang === 'en' ? 'English' : 'Česky';
  const href = other.replace(/\.md$/, '.html');
  return ` · <a href="${href}" hreflang="${lang}" lang="${lang}">${label}</a>`;
}

/** Celá stránka poznámky ve vzhledu osobní stránky. */
function toHtml(blocks, lang = 'cs', other = '') {
  const title = (blocks.find((b) => b.kind === 'heading' && b.level === 1) || {}).text || 'Poznámka';
  const lead = blocks.find((b) => b.kind === 'text');
  const body = [];
  let list = null;

  const closeList = () => {
    if (list) body.push(`  <ul>\n${list.join('\n')}\n  </ul>`);
    list = null;
  };

  for (const b of blocks) {
    if (b === lead) continue;
    if (b.kind === 'heading' && b.level === 1) continue;

    if (b.kind === 'item') {
      list = list || [];
      list.push(`    <li>${inline(source(b.text))}</li>`);
      continue;
    }
    closeList();
    if (b.kind === 'heading') {
      body.push(`  <h${b.level}>${inline(b.text)}</h${b.level}>`);
    } else if (b.kind === 'pre') {
      body.push(`  <pre>${escapeHtml(b.lines.join('\n'))}</pre>`);
    } else {
      body.push(`  <p>${inline(b.text)}</p>`);
    }
  }
  closeList();

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      max-width: 720px;
      margin: 4rem auto;
      padding: 0 1.5rem;
      line-height: 1.6;
      color: #1a1a1a;
    }
    h1 { margin-bottom: 0.25rem; font-size: 1.6rem; }
    p.subtitle { color: #555; margin-top: 0; }
    h2 {
      font-size: 1.05rem;
      margin: 2rem 0 0.5rem;
      padding-bottom: 0.3rem;
      border-bottom: 1px solid #e5e5e5;
    }
    h3 { font-size: 0.98rem; margin: 1.5rem 0 0.4rem; color: #333; }
    p { color: #333; }
    ul { padding-left: 1.2rem; }
    li { margin: 0.35rem 0; color: #333; }
    a { color: #A8552E; }
    .back { font-size: 0.9rem; margin-bottom: 2rem; }
    pre {
      background: #f4f4f2;
      padding: 0.8rem 1rem;
      border-radius: 3px;
      overflow-x: auto;
      font-size: 0.9em;
      line-height: 1.5;
    }
    code {
      background: #f4f4f2;
      padding: 0.1em 0.3em;
      border-radius: 3px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <p class="back">${BACK[lang] || BACK.cs}${other}</p>

  <h1>${inline(title)}</h1>
${lead ? `  <p class="subtitle">${inline(lead.text)}</p>\n` : ''}
${body.join('\n')}
</body>
</html>
`;
}

/** Zapíše soubor a poradí, když ho drží otevřený Word. */
function write(file, data) {
  try {
    fs.writeFileSync(file, data);
  } catch (err) {
    if (err.code === 'EBUSY' || err.code === 'EPERM') {
      console.error(`${path.basename(file)} je otevřený v jiném programu. Zavři ho a spusť to znovu.`);
      process.exit(1);
    }
    throw err;
  }
}

const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));
if (!files.length) {
  console.error('Ve složce docs není žádný .md soubor.');
  process.exit(1);
}

for (const name of files) {
  const blocks = parse(fs.readFileSync(path.join(docsDir, name), 'utf8'));
  const base = name.replace(/\.md$/, '');
  const paragraphs = toDocx(blocks);
  write(path.join(docsDir, `${base}.docx`), docx(paragraphs));
  write(path.join(docsDir, `${base}.html`), toHtml(blocks, ENGLISH.has(name) ? 'en' : 'cs', switcher(name)));
  console.log(`${name} -> ${base}.docx (${paragraphs.length} odstavců), ${base}.html`);
}
