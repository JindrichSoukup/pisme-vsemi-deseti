/**
 * Přehled, kolik opravdových slov a vět jde v každé lekci použít.
 * Spustí se ručně: node test/check-content.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LESSONS, allowedCharsUpTo, knowsUppercase } from '../web/js/curriculum.js';
import { setContent, usableWordCount, usableSentenceCount, buildStep } from '../web/js/generator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const content = path.join(here, '..', 'web', 'content');
const read = (f) => JSON.parse(fs.readFileSync(path.join(content, f), 'utf8'));

setContent({
  words: read('words-cs.json'),
  sentences: read('sentences-cs.json'),
  texts: read('texts-cs.json'),
});

console.log('lekce | nová písmena       | slov | vět | ukázka prvního kroku');
console.log('-'.repeat(90));
LESSONS.forEach((lesson, i) => {
  const allowed = allowedCharsUpTo(i);
  const uppercase = knowsUppercase(i);
  const words = usableWordCount(allowed);
  const sentences = usableSentenceCount(allowed, !uppercase);
  const step = buildStep(lesson, lesson.steps[0], { allowed, keyStats: {}, uppercase }, 0);
  console.log(
    lesson.id.padEnd(5),
    '|', (lesson.newKeys.join('') || '—').slice(0, 18).padEnd(18),
    '|', String(words).padStart(4),
    '|', String(sentences).padStart(3),
    '|', (step.lines[0] || '').slice(0, 34)
  );
});
