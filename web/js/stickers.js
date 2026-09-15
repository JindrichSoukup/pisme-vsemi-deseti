/**
 * Obrázky, které se dají získat za dokončenou lekci a nalepit do notýsku.
 *
 * Odměna se nikdy neslibuje dopředu. Výzkum motivace u dětí (Lepper a Greene
 * a další práce k takzvanému overjustification efektu) říká, že odměna slíbená
 * předem snižuje vnitřní zájem o činnost, zatímco stejná odměna jako překvapení
 * po výkonu ne. Proto se v aplikaci nikde neukazuje, co ještě jde získat,
 * a v notýsku jsou vidět jen obrázky, které už dítě má.
 *
 * Obrázky jsou kreslené vektorově, takže se dají vytisknout v jakékoli
 * velikosti a nepotřebují žádné externí soubory.
 */

const eyes = (lx, rx, y, r = 6, color = '#2f2a26') => `
  <circle cx="${lx}" cy="${y}" r="${r}" fill="${color}"/>
  <circle cx="${rx}" cy="${y}" r="${r}" fill="${color}"/>
  <circle cx="${lx + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.3}" fill="#fff"/>
  <circle cx="${rx + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.3}" fill="#fff"/>`;

const smile = (cx, y, w = 20) =>
  `<path d="M${cx - w / 2} ${y} q${w / 2} ${w * 0.5} ${w} 0" fill="none" stroke="#2f2a26" stroke-width="3.5" stroke-linecap="round"/>`;

export const STICKERS = [
  {
    id: 'jezek', name: 'Ježek', bg: '#f3e7d3',
    art: `
      <ellipse cx="96" cy="122" rx="60" ry="44" fill="#8d6e4f"/>
      <path d="M40 116 q4-32 20-18 q2-30 20-14 q4-28 22-10 q8-24 26-4"
            fill="none" stroke="#5f4630" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="146" cy="132" rx="28" ry="22" fill="#e8d3b6"/>
      <circle cx="168" cy="130" r="6" fill="#2f2a26"/>
      <circle cx="152" cy="122" r="4.5" fill="#2f2a26"/>`,
  },
  {
    id: 'liska', name: 'Liška', bg: '#fde8d6',
    art: `
      <path d="M58 74 L68 28 L98 58 Z" fill="#e8843c"/>
      <path d="M142 74 L132 28 L102 58 Z" fill="#e8843c"/>
      <circle cx="100" cy="100" r="48" fill="#f2974f"/>
      <path d="M100 96 q-34 14-24 42 q24 16 48 0 q10-28-24-42 Z" fill="#fff6ea"/>
      ${eyes(82, 118, 94)}
      <path d="M100 126 l-10-9 h20 Z" fill="#2f2a26"/>`,
  },
  {
    id: 'sova', name: 'Sova', bg: '#e4e8dc',
    art: `
      <path d="M62 62 L72 30 L94 52 Z" fill="#8a7455"/>
      <path d="M138 62 L128 30 L106 52 Z" fill="#8a7455"/>
      <ellipse cx="100" cy="108" rx="54" ry="56" fill="#a98d68"/>
      <ellipse cx="100" cy="124" rx="34" ry="36" fill="#e8dbc4"/>
      <circle cx="80" cy="96" r="20" fill="#fff"/>
      <circle cx="120" cy="96" r="20" fill="#fff"/>
      ${eyes(80, 120, 96, 9)}
      <path d="M100 108 l-9 10 h18 Z" fill="#e2a13c"/>`,
  },
  {
    id: 'kocka', name: 'Kočka', bg: '#e6e3ee',
    art: `
      <path d="M60 76 L62 32 L96 58 Z" fill="#9b95a8"/>
      <path d="M140 76 L138 32 L104 58 Z" fill="#9b95a8"/>
      <circle cx="100" cy="104" r="50" fill="#aaa3b6"/>
      ${eyes(80, 120, 96, 7)}
      <path d="M100 118 l-8-7 h16 Z" fill="#f0a6b4"/>
      ${smile(100, 124, 22)}
      <path d="M52 108 h24 M52 120 h24 M124 108 h24 M124 120 h24"
            stroke="#5f5a68" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  {
    id: 'pes', name: 'Pejsek', bg: '#f6ead6',
    art: `
      <ellipse cx="56" cy="104" rx="18" ry="34" fill="#9a6f45"/>
      <ellipse cx="144" cy="104" rx="18" ry="34" fill="#9a6f45"/>
      <circle cx="100" cy="102" r="48" fill="#c99a63"/>
      <ellipse cx="100" cy="128" rx="26" ry="20" fill="#f0e0c8"/>
      ${eyes(82, 118, 94)}
      <ellipse cx="100" cy="120" rx="9" ry="7" fill="#2f2a26"/>
      ${smile(100, 132, 20)}`,
  },
  {
    id: 'zaba', name: 'Žabka', bg: '#dcecd6',
    art: `
      <circle cx="74" cy="66" r="22" fill="#7bb661"/>
      <circle cx="126" cy="66" r="22" fill="#7bb661"/>
      <circle cx="74" cy="64" r="12" fill="#fff"/>
      <circle cx="126" cy="64" r="12" fill="#fff"/>
      ${eyes(74, 126, 64, 6)}
      <ellipse cx="100" cy="120" rx="56" ry="44" fill="#8cc76f"/>
      <path d="M72 126 q28 26 56 0" fill="none" stroke="#3f6b32" stroke-width="4" stroke-linecap="round"/>
      <circle cx="70" cy="112" r="4" fill="#6ba653"/>
      <circle cx="130" cy="112" r="4" fill="#6ba653"/>`,
  },
  {
    id: 'motyl', name: 'Motýl', bg: '#f1e4f2',
    art: `
      <ellipse cx="68" cy="80" rx="34" ry="28" fill="#e97ba0" transform="rotate(-18 68 80)"/>
      <ellipse cx="132" cy="80" rx="34" ry="28" fill="#e97ba0" transform="rotate(18 132 80)"/>
      <ellipse cx="72" cy="130" rx="27" ry="23" fill="#f2a8c0" transform="rotate(14 72 130)"/>
      <ellipse cx="128" cy="130" rx="27" ry="23" fill="#f2a8c0" transform="rotate(-14 128 130)"/>
      <circle cx="72" cy="80" r="7" fill="#fff"/>
      <circle cx="128" cy="80" r="7" fill="#fff"/>
      <rect x="94" y="66" width="12" height="80" rx="6" fill="#5c4a63"/>
      <path d="M96 66 q-12-18-24-20 M104 66 q12-18 24-20"
            fill="none" stroke="#5c4a63" stroke-width="3.5" stroke-linecap="round"/>`,
  },
  {
    id: 'vcela', name: 'Včelka', bg: '#f7efd2',
    art: `
      <ellipse cx="62" cy="72" rx="28" ry="18" fill="#cfe4f2" transform="rotate(-24 62 72)"/>
      <ellipse cx="138" cy="72" rx="28" ry="18" fill="#cfe4f2" transform="rotate(24 138 72)"/>
      <ellipse cx="100" cy="112" rx="52" ry="42" fill="#f0c542"/>
      <path d="M78 78 q22 66 0 68 M108 74 q26 72 0 76" fill="none" stroke="#3b3226" stroke-width="13"/>
      <ellipse cx="100" cy="112" rx="52" ry="42" fill="none"/>
      <circle cx="70" cy="100" r="5" fill="#3b3226"/>
      <path d="M92 62 q-10-18-22-22 M108 62 q10-18 22-22"
            fill="none" stroke="#3b3226" stroke-width="3.5" stroke-linecap="round"/>`,
  },
  {
    id: 'ryba', name: 'Rybka', bg: '#d9ecf3',
    art: `
      <path d="M150 100 L184 68 L184 132 Z" fill="#4f9dc4"/>
      <ellipse cx="94" cy="100" rx="62" ry="42" fill="#67b6da"/>
      <path d="M94 58 q22-22 34-6" fill="none" stroke="#3f87ab" stroke-width="7" stroke-linecap="round"/>
      <circle cx="58" cy="92" r="8" fill="#fff"/>
      <circle cx="56" cy="92" r="4.5" fill="#2f2a26"/>
      <path d="M114 78 q-8 22 0 44 M136 84 q-8 16 0 32"
            fill="none" stroke="#3f87ab" stroke-width="4" stroke-linecap="round"/>
      ${smile(62, 108, 16)}`,
  },
  {
    id: 'delfin', name: 'Delfín', bg: '#d6e6f2',
    art: `
      <path d="M28 118 q34-62 96-56 q34 4 48 22 q-10 8-28 6 q18 16 12 34
               q-30 22-76 12 q-32-6-52-18 Z" fill="#7aa8c9"/>
      <path d="M60 122 q40 18 84 2 q-24 24-58 20 q-18-4-26-22 Z" fill="#e2eef5"/>
      <circle cx="150" cy="82" r="5.5" fill="#2f2a26"/>
      <path d="M164 92 q8 4 12 0" fill="none" stroke="#2f2a26" stroke-width="3" stroke-linecap="round"/>`,
  },
  {
    id: 'tucnak', name: 'Tučňák', bg: '#dfeaf0',
    art: `
      <ellipse cx="100" cy="112" rx="52" ry="60" fill="#37414c"/>
      <ellipse cx="100" cy="122" rx="34" ry="46" fill="#f4f6f7"/>
      <ellipse cx="52" cy="118" rx="12" ry="30" fill="#2b333c" transform="rotate(12 52 118)"/>
      <ellipse cx="148" cy="118" rx="12" ry="30" fill="#2b333c" transform="rotate(-12 148 118)"/>
      ${eyes(86, 114, 88, 6)}
      <path d="M100 100 l-12 10 h24 Z" fill="#e8a33d"/>
      <ellipse cx="82" cy="172" rx="16" ry="8" fill="#e8a33d"/>
      <ellipse cx="118" cy="172" rx="16" ry="8" fill="#e8a33d"/>`,
  },
  {
    id: 'medved', name: 'Medvěd', bg: '#f0e3d2',
    art: `
      <circle cx="58" cy="62" r="22" fill="#8d6544"/>
      <circle cx="142" cy="62" r="22" fill="#8d6544"/>
      <circle cx="58" cy="62" r="11" fill="#c99a76"/>
      <circle cx="142" cy="62" r="11" fill="#c99a76"/>
      <circle cx="100" cy="110" r="54" fill="#a3764f"/>
      <ellipse cx="100" cy="132" rx="30" ry="24" fill="#e3c9a8"/>
      ${eyes(80, 120, 100)}
      <ellipse cx="100" cy="124" rx="10" ry="8" fill="#2f2a26"/>
      ${smile(100, 138, 20)}`,
  },
  {
    id: 'kralik', name: 'Králíček', bg: '#f4e8ee',
    art: `
      <ellipse cx="78" cy="52" rx="15" ry="40" fill="#efe6e2" transform="rotate(-8 78 52)"/>
      <ellipse cx="122" cy="52" rx="15" ry="40" fill="#efe6e2" transform="rotate(8 122 52)"/>
      <ellipse cx="78" cy="54" rx="7" ry="28" fill="#f3bfcd" transform="rotate(-8 78 54)"/>
      <ellipse cx="122" cy="54" rx="7" ry="28" fill="#f3bfcd" transform="rotate(8 122 54)"/>
      <circle cx="100" cy="122" r="46" fill="#f6efec"/>
      ${eyes(82, 118, 114)}
      <path d="M100 134 l-8-7 h16 Z" fill="#e491a6"/>
      <path d="M100 134 v8 M100 142 q-10 8-18 2 M100 142 q10 8 18 2"
            fill="none" stroke="#b98d9b" stroke-width="3" stroke-linecap="round"/>`,
  },
  {
    id: 'veverka', name: 'Veverka', bg: '#f7e6d5',
    art: `
      <path d="M44 158 q-26-26-8-56 q16-26 40-20 q-30 12-24 42 q4 22 24 30 Z" fill="#c9743c"/>
      <path d="M62 70 L66 36 L92 58 Z" fill="#d2803f"/>
      <path d="M138 70 L134 36 L108 58 Z" fill="#d2803f"/>
      <circle cx="100" cy="108" r="46" fill="#dd8f4c"/>
      <ellipse cx="100" cy="128" rx="24" ry="18" fill="#f6e2c8"/>
      ${eyes(84, 116, 100)}
      <path d="M100 122 l-7-6 h14 Z" fill="#2f2a26"/>
      <path d="M96 140 h8 v14 h-8 Z" fill="#fff" stroke="#d8c6ad" stroke-width="1.5"/>`,
  },
  {
    id: 'slon', name: 'Slon', bg: '#e6e8ec',
    art: `
      <ellipse cx="46" cy="98" rx="30" ry="38" fill="#95a0ad"/>
      <ellipse cx="154" cy="98" rx="30" ry="38" fill="#95a0ad"/>
      <circle cx="100" cy="100" r="48" fill="#a7b2bf"/>
      ${eyes(82, 118, 92)}
      <path d="M100 112 q-14 26 2 44 q14 16 26 2"
            fill="none" stroke="#a7b2bf" stroke-width="20" stroke-linecap="round"/>
      <path d="M84 130 q-6 16 4 22 M116 130 q6 16-4 22"
            fill="none" stroke="#f2f0ea" stroke-width="7" stroke-linecap="round"/>`,
  },
  {
    id: 'zirafa', name: 'Žirafa', bg: '#f8f0d8',
    art: `
      <rect x="86" y="96" width="28" height="76" rx="12" fill="#e6b955"/>
      <path d="M84 54 v-16 M116 54 v-16" stroke="#e6b955" stroke-width="8" stroke-linecap="round"/>
      <circle cx="84" cy="36" r="7" fill="#8d6a35"/>
      <circle cx="116" cy="36" r="7" fill="#8d6a35"/>
      <ellipse cx="100" cy="80" rx="42" ry="34" fill="#efc768"/>
      ${eyes(84, 116, 72, 5.5)}
      <ellipse cx="100" cy="96" rx="20" ry="14" fill="#e0a97f"/>
      <circle cx="92" cy="94" r="3" fill="#a9765a"/>
      <circle cx="108" cy="94" r="3" fill="#a9765a"/>
      <circle cx="92" cy="124" r="8" fill="#c99a45"/>
      <circle cx="110" cy="146" r="7" fill="#c99a45"/>`,
  },
  {
    id: 'lev', name: 'Lev', bg: '#f8ecd6',
    art: `
      <circle cx="100" cy="104" r="62" fill="#d59a45"/>
      <circle cx="100" cy="104" r="52" fill="#c98a35"/>
      <circle cx="100" cy="104" r="42" fill="#f0c273"/>
      ${eyes(84, 116, 96)}
      <path d="M100 116 l-9-8 h18 Z" fill="#8a5b2b"/>
      ${smile(100, 126, 22)}
      <path d="M60 100 h18 M60 112 h18 M122 100 h18 M122 112 h18"
            stroke="#b07f3d" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  {
    id: 'panda', name: 'Panda', bg: '#e8e8e8',
    art: `
      <circle cx="58" cy="62" r="22" fill="#2f2f31"/>
      <circle cx="142" cy="62" r="22" fill="#2f2f31"/>
      <circle cx="100" cy="108" r="54" fill="#fbfbfb"/>
      <ellipse cx="78" cy="100" rx="17" ry="21" fill="#2f2f31" transform="rotate(-16 78 100)"/>
      <ellipse cx="122" cy="100" rx="17" ry="21" fill="#2f2f31" transform="rotate(16 122 100)"/>
      <circle cx="79" cy="100" r="6" fill="#fff"/>
      <circle cx="121" cy="100" r="6" fill="#fff"/>
      <ellipse cx="100" cy="126" rx="11" ry="8" fill="#2f2f31"/>
      ${smile(100, 138, 22)}`,
  },
  {
    id: 'jednorozec', name: 'Jednorožec', bg: '#f1e7f6',
    art: `
      <path d="M100 30 L112 74 L88 74 Z" fill="#f2c85c"/>
      <path d="M96 36 l14 8 M92 50 l18 10" stroke="#d8a72f" stroke-width="3" stroke-linecap="round"/>
      <path d="M62 70 L66 40 L92 62 Z" fill="#fbf5fd"/>
      <path d="M138 70 L134 40 L108 62 Z" fill="#fbf5fd"/>
      <path d="M140 66 q34 6 30 40 q-4 32-34 40 q22-26 14-48 q-6-20-10-32 Z" fill="#f2a8c0"/>
      <path d="M148 78 q22 10 18 36" fill="none" stroke="#a8d3ef" stroke-width="6" stroke-linecap="round"/>
      <circle cx="100" cy="116" r="46" fill="#fdf8ff"/>
      ${eyes(84, 116, 108)}
      <ellipse cx="100" cy="134" rx="14" ry="9" fill="#f0bccd"/>
      <circle cx="94" cy="132" r="2.5" fill="#c98da0"/>
      <circle cx="106" cy="132" r="2.5" fill="#c98da0"/>`,
  },
  {
    id: 'drak', name: 'Drak', bg: '#dff0e4',
    art: `
      <path d="M40 96 q-16-34 16-40 q10 20 26 26 Z" fill="#6fa86b"/>
      <path d="M160 96 q16-34-16-40 q-10 20-26 26 Z" fill="#6fa86b"/>
      <circle cx="100" cy="106" r="50" fill="#8cc487"/>
      <path d="M74 60 L80 34 L96 56 Z" fill="#4f8a52"/>
      <path d="M126 60 L120 34 L104 56 Z" fill="#4f8a52"/>
      ${eyes(82, 118, 96, 7)}
      <ellipse cx="100" cy="126" rx="26" ry="18" fill="#b6dcae"/>
      <circle cx="92" cy="122" r="3.5" fill="#2f2a26"/>
      <circle cx="108" cy="122" r="3.5" fill="#2f2a26"/>
      ${smile(100, 132, 20)}`,
  },
  {
    id: 'raketa', name: 'Raketa', bg: '#e3e6f3',
    art: `
      <path d="M100 22 q30 34 30 78 v22 H70 v-22 q0-44 30-78 Z" fill="#eceff5"/>
      <path d="M70 106 L44 148 L70 138 Z" fill="#e0655f"/>
      <path d="M130 106 L156 148 L130 138 Z" fill="#e0655f"/>
      <circle cx="100" cy="82" r="17" fill="#7fb3dd"/>
      <circle cx="100" cy="82" r="10" fill="#cfe4f4"/>
      <path d="M78 122 h44 v10 H78 Z" fill="#c4cbdb"/>
      <path d="M86 134 q14 34 28 0 q-14 16-28 0 Z" fill="#f0a63f"/>
      <path d="M92 138 q8 22 16 0 q-8 10-16 0 Z" fill="#e0655f"/>`,
  },
  {
    id: 'hvezda', name: 'Hvězda', bg: '#f7f0d8',
    art: `
      <path d="M100 26 L122 82 L182 88 L136 126 L150 184 L100 152 L50 184 L64 126 L18 88 L78 82 Z"
            fill="#f2c443" stroke="#d8a72f" stroke-width="4" stroke-linejoin="round"/>
      ${eyes(84, 116, 104, 6)}
      ${smile(100, 120, 22)}`,
  },
  {
    id: 'duha', name: 'Duha', bg: '#eaf2f7',
    art: `
      <path d="M22 148 a78 78 0 0 1 156 0" fill="none" stroke="#e0655f" stroke-width="16"/>
      <path d="M38 148 a62 62 0 0 1 124 0" fill="none" stroke="#f0a63f" stroke-width="16"/>
      <path d="M54 148 a46 46 0 0 1 92 0" fill="none" stroke="#f2c443" stroke-width="16"/>
      <path d="M70 148 a30 30 0 0 1 60 0" fill="none" stroke="#7bb661" stroke-width="16"/>
      <ellipse cx="38" cy="156" rx="26" ry="14" fill="#fff"/>
      <ellipse cx="162" cy="156" rx="26" ry="14" fill="#fff"/>
      <ellipse cx="52" cy="150" rx="18" ry="11" fill="#f4f8fa"/>
      <ellipse cx="148" cy="150" rx="18" ry="11" fill="#f4f8fa"/>`,
  },
  {
    id: 'strom', name: 'Strom', bg: '#e6efdc',
    art: `
      <rect x="90" y="112" width="20" height="60" rx="8" fill="#8d6544"/>
      <path d="M96 130 l-22-16 M104 146 l22-16" stroke="#8d6544" stroke-width="7" stroke-linecap="round"/>
      <circle cx="100" cy="76" r="38" fill="#79ab5c"/>
      <circle cx="66" cy="98" r="27" fill="#8bbd68"/>
      <circle cx="134" cy="98" r="27" fill="#8bbd68"/>
      <circle cx="100" cy="104" r="24" fill="#95c974"/>
      <circle cx="82" cy="64" r="5" fill="#e0655f"/>
      <circle cx="122" cy="88" r="5" fill="#e0655f"/>
      <circle cx="60" cy="106" r="5" fill="#e0655f"/>`,
  },
];

/** Vrátí hotové SVG obrázku, připravené vložit do stránky nebo vytisknout. */
export function stickerSvg(id, size = 200) {
  const s = STICKERS.find((x) => x.id === id);
  if (!s) return '';
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="${s.name}">
    <circle cx="100" cy="100" r="98" fill="${s.bg}"/>
    ${s.art}
  </svg>`;
}

export function stickerById(id) {
  return STICKERS.find((x) => x.id === id) || null;
}

/**
 * Obrázek jen jako obrys, k vytištění na obyčejné černobílé tiskárně
 * a k vybarvení pastelkami.
 *
 * Kresba je jinak založená na barevných výplních, takže se z ní barvy vyzobou
 * a nahradí se bílou výplní s tmavou linkou. Tenké odlesky v očích se zahodí,
 * na papíře by z nich byly jen zbytečné kroužky.
 */
export function outlineSvg(id, size = 200) {
  const s = STICKERS.find((x) => x.id === id);
  if (!s) return '';
  const art = s.art
    .replace(/<circle[^>]*\br="(?:[01](?:\.\d+)?|2(?:\.[0-2])?)"[^>]*\/>/g, '')
    .replace(/\sfill="(?!none)[^"]*"/g, '')
    .replace(/\sstroke="[^"]*"/g, '')
    // Tlustý tah je v barevné kresbě plocha, ale v obrysu by z něj byl
    // černý blok. Chobot slona a duha se tím měnily v mazanici.
    .replace(/\sstroke-width="([\d.]+)"/g, (m, w) => ` stroke-width="${Math.min(Number(w), 3)}"`);
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="${s.name}">
    <g fill="#fff" stroke="#1c1c1c" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="100" cy="100" r="97"/>
      ${art}
    </g>
  </svg>`;
}

/**
 * Vytiskne vybrané obrázky na samostatný list, ať se dají vystřihnout
 * a nalepit do notýsku. Tiskne se přes skrytý rám, aby se na papír nedostalo
 * nic z ovládání aplikace a aby to neblokovalo vyskakovací okna.
 */
export function printStickers(entries, ownerName = '') {
  const cards = entries
    .map((e) => {
      const s = stickerById(e.id);
      if (!s) return '';
      const date = e.earnedAt ? new Date(e.earnedAt).toLocaleDateString('cs-CZ') : '';
      return `<div class="card">
        ${outlineSvg(s.id, 200)}
        <div class="name">${escapeHtml(s.name)}</div>
        <div class="meta">${escapeHtml([ownerName, date].filter(Boolean).join(' · '))}</div>
      </div>`;
    })
    .join('');

  const doc = `<!doctype html><html lang="cs"><head><meta charset="utf-8">
    <title>Obrázky k vybarvení</title>
    <style>
      @page { size: A4; margin: 16mm; }
      body { margin: 0; font-family: Georgia, "Times New Roman", serif; }
      .sheet { display: flex; flex-wrap: wrap; gap: 10mm; }
      .card {
        width: 72mm; box-sizing: border-box; text-align: center;
        border: 1.2pt dashed #999; border-radius: 5mm; padding: 5mm;
        page-break-inside: avoid; break-inside: avoid;
      }
      .card svg { width: 52mm; height: 52mm; display: block; margin: 0 auto 3mm; }
      .name { font-size: 13pt; font-weight: 600; }
      .meta { font-size: 9pt; color: #555; margin-top: 1mm; }
    </style></head><body><div class="sheet">${cards}</div></body></html>`;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  frame.contentDocument.open();
  frame.contentDocument.write(doc);
  frame.contentDocument.close();

  const go = () => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    // rám necháme chvíli žít, tisk je v některých prohlížečích nesynchronní
    setTimeout(() => frame.remove(), 60000);
  };
  if (frame.contentDocument.readyState === 'complete') go();
  else frame.onload = go;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Rozhodne, jestli za právě dokončenou lekci přijde obrázek.
 *
 * Záměrně to není za každou lekci. První odměna přijde hned, aby dítě vědělo,
 * že se to může stát, další pak nepravidelně. Nepravidelnost udrží efekt
 * překvapení, pravidelná odměna by se rychle změnila v očekávaný nárok.
 *
 * @param {object} profile profil uživatele
 * @param {string} lessonId lekce, která se právě dokončila
 * @param {number} stars kolik hvězdiček dítě dostalo
 * @returns {object|null} obrázek k odemčení, nebo null
 */
export function maybeAward(profile, lessonId, stars, { guaranteed = false } = {}) {
  const owned = new Set((profile.stickers || []).map((s) => s.id));
  if (owned.size >= STICKERS.length) return null;

  // Rodič může zařídit, že po příští lekci obrázek určitě přijde, třeba když
  // dítě mrzelo, že minule nic nedostalo. Pak se nelosuje a nekouká se ani na
  // hvězdičky: odměna je za odvedenou práci. Dítěti se to dopředu neříká,
  // jinak by se z překvapení stal slib a ten motivaci podrývá.
  if (guaranteed) {
    const remaining = STICKERS.filter((s) => !owned.has(s.id));
    return remaining[Math.floor(Math.random() * remaining.length)];
  }

  if (stars < 1) return null;

  // za tuhle lekci už jednou obrázek byl, podruhé ne
  if ((profile.stickers || []).some((s) => s.lessonId === lessonId)) return null;

  const finished = Object.values(profile.lessons || {}).filter((l) => l.stars > 0).length;
  let chance;
  if (owned.size === 0) chance = 1;            // první dokončená lekce vždycky
  else if (stars === 3) chance = 0.75;
  else if (stars === 2) chance = 0.5;
  else chance = 0.3;
  // ať se sbírka nevyčerpá dřív, než dojdou lekce
  if (owned.size > finished * 0.8) chance *= 0.5;

  if (Math.random() > chance) return null;

  const remaining = STICKERS.filter((s) => !owned.has(s.id));
  return remaining[Math.floor(Math.random() * remaining.length)];
}
