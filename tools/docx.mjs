/**
 * Minimální zapisovač souborů .docx, bez jediné knihovny.
 *
 * Soubor .docx je obyčejný ZIP s pár XML soubory uvnitř. Node umí komprimaci
 * přes zlib, zbytek je hlavička ZIPu a kontrolní součet, což se dá napsat
 * na pár desítek řádků. Díky tomu projekt zůstává bez závislostí.
 */

import { deflateRawSync } from 'node:zlib';

/* ------------------------------------------------------------------- ZIP */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

/** Datum a čas v podobě, jakou používá ZIP (dvě 16bitová čísla). */
function dosTime(date = new Date()) {
  const time = ((date.getHours() & 31) << 11) | ((date.getMinutes() & 63) << 5)
    | ((date.getSeconds() / 2) & 31);
  const day = (((date.getFullYear() - 1980) & 127) << 9)
    | (((date.getMonth() + 1) & 15) << 5) | (date.getDate() & 31);
  return { time, day };
}

/**
 * Sestaví ZIP z dvojic { name, data }.
 * @param {Array<{name:string, data:Buffer|string}>} entries
 */
function zip(entries) {
  const { time, day } = dosTime();
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const raw = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const packed = deflateRawSync(raw, { level: 9 });
    const crc = crc32(raw);

    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);        // potřebná verze
    local.writeUInt16LE(0x0800, 6);    // příznak: názvy v UTF-8
    local.writeUInt16LE(8, 8);         // metoda deflate
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);      // verze zapisovatele
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(day, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(0, 38);      // vnější atributy
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);

    locals.push(local, packed);
    centrals.push(central);
    offset += local.length + packed.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, centralBuf, end]);
}

/* ------------------------------------------------------------------ DOCX */

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Odstavec daného stylu. */
export function p(text, style = 'Normal') {
  if (!text) return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr></w:p>`;
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>`
    + `<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

/** Odstavec s odrážkou. Odsazení se dělá ručně, aby nebylo potřeba číslování. */
export function bullet(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Odrazka"/></w:pPr>`
    + `<w:r><w:t xml:space="preserve">${esc('•  ' + text)}</w:t></w:r></w:p>`;
}

/** Řádek cvičení neproporcionálním písmem. */
export function mono(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Cviceni"/></w:pPr>`
    + `<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

export function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`;

/* Bez tohohle otevírá Word dokument v režimu kompatibility. */
const SETTINGS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:compat>
    <w:compatSetting w:name="compatibilityMode"
      w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
  </w:compat>
</w:settings>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;

/** Jeden styl. size je v půlbodech, jak to Word chce. */
function style(id, name, { size = 22, bold = false, color = '000000', before = 0, after = 120,
  font = 'Calibri', indent = 0, keepNext = false } = {}) {
  return `<w:style w:type="paragraph" w:styleId="${id}">
    <w:name w:val="${name}"/>
    <w:qFormat/>
    <w:pPr>
      ${keepNext ? '<w:keepNext/>' : ''}
      <w:spacing w:before="${before}" w:after="${after}" w:line="264" w:lineRule="auto"/>
      ${indent ? `<w:ind w:left="${indent}"/>` : ''}
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
      ${bold ? '<w:b/>' : ''}
      <w:color w:val="${color}"/>
      <w:sz w:val="${size}"/>
    </w:rPr>
  </w:style>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr>
    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/>
    <w:lang w:val="cs-CZ"/>
  </w:rPr></w:rPrDefault></w:docDefaults>
  ${style('Normal', 'Normal')}
  ${style('Nadpis', 'Title', { size: 52, bold: true, after: 60 })}
  ${style('Podnadpis', 'Subtitle', { size: 24, color: '767171', after: 400 })}
  ${style('Blok', 'heading 1', { size: 20, bold: true, color: '4A7C59', before: 400, after: 60, keepNext: true })}
  ${style('Lekce', 'heading 2', { size: 30, bold: true, before: 120, after: 120, keepNext: true })}
  ${style('Krok', 'heading 3', { size: 22, bold: true, color: '767171', before: 240, after: 60, keepNext: true })}
  ${style('Odrazka', 'List Paragraph', { indent: 340, after: 60 })}
  ${style('Cviceni', 'Exercise', { font: 'Consolas', size: 20, after: 40, indent: 340 })}
  ${style('Poznamka', 'Note', { size: 18, color: '767171', after: 60 })}
</w:styles>`;

/** Vyrobí hotový soubor .docx z pole odstavců. */
export function docx(bodyParts) {
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyParts.join('\n')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  return zip([
    { name: '[Content_Types].xml', data: CONTENT_TYPES },
    { name: '_rels/.rels', data: RELS },
    { name: 'word/_rels/document.xml.rels', data: DOC_RELS },
    { name: 'word/styles.xml', data: STYLES },
    { name: 'word/settings.xml', data: SETTINGS },
    { name: 'word/document.xml', data: document },
  ]);
}
