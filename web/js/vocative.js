/**
 * Pátý pád křestního jména, tedy oslovení.
 *
 * Čeština osloví Annu jako Anno a Petra jako Petře, takže "Ahoj, Anna!" zní
 * špatně. Pravidla níž pokryjí většinu běžných jmen, ale ne všechna: ženská
 * jména zakončená na souhlásku (Dagmar, Ingrid, Karin) se neskloňují a pár
 * jmen má výjimku. Proto se odvozený tvar při zakládání profilu ukáže
 * a dá se přepsat ručně.
 */

const VOWELS = 'aáeéěiíoóuúůyý';

/** Vrátí pátý pád křestního jména. Bere jen první slovo. */
export function vocative(name) {
  const full = String(name || '').trim();
  if (!full) return '';

  const first = full.split(/\s+/)[0];
  const low = first.toLowerCase();
  if (first.length < 2) return first;

  // ženská jména a mužské zdrobněliny na -a: Anno, Eliško, Honzo, Jirko
  if (low.endsWith('a')) return first.slice(0, -1) + 'o';

  // Marie, Lucie, Alice, Jiří, Otto, Hugo: pátý pád se neliší
  if ('eěíýou'.includes(low.slice(-1))) return first;

  // Marku, Radku, Patriku, Vojtěchu, Olegu
  if (low.endsWith('ek')) return first.slice(0, -2) + 'ku';
  if (low.endsWith('k') || low.endsWith('g')) return first + 'u';
  if (low.endsWith('ch') || low.endsWith('h')) return first + 'u';

  // Tomáši, Lukáši, Ondřeji, Matěji, Jiříku od měkkých souhlásek
  if ('šžčřcj'.includes(low.slice(-1))) return first + 'i';

  // Pavle, Karle: vypadne e
  if (low.endsWith('el')) return first.slice(0, -2) + 'le';

  // Petře, ale Otakare. Záleží, co stojí před r.
  if (low.endsWith('r')) {
    const before = low[low.length - 2];
    return VOWELS.includes(before) ? first + 'e' : first.slice(0, -1) + 'ře';
  }

  // Jakube, Adame, Jane, Filipe, Davide, Michale
  return first + 'e';
}
