# Czech and the Czech keyboard

What is different about teaching typing in Czech rather than in English. A
smaller part is about the layout; the larger part is my own computation over
this program's word list. It continues [the note on didactics](didactics.md), which holds
the rest of the curriculum.

## The QWERTZ layout

Z sits in the top row and Y at the bottom left, exactly the other way round
from an English keyboard. Letters with diacritics have keys of their own on
the number row, ěščřžýáíé from left to right, which means the digits are typed
with Shift. Ů sits next to L, and ú next to P.

For teaching, one nuisance follows from that. The digits, which in English are
a lesson of their own at the end, carry Shift as well in Czech. The program
therefore leaves them for the very end, after capitals.

## Capitals with diacritics

This is the strangest thing about the Czech keyboard, and I only found it
while writing a test. Capital Č, Ř or Š cannot be typed with Shift at all.
Shift over ř gives 5, because the digits sit above the diacritics.

They have to be composed with a dead key: first the acute or the caron, at
which point nothing appears on screen, and only the next stroke completes the
letter. The same goes for ď, ť, ň and ó, which have no key of their own at
all.

That decides how the program reads input. If it listened to key presses, a
dead key would arrive as an empty press and the finished letter would never
come. It therefore reads the composed character, meaning whatever actually
appears in the text. Composition also gets a lesson of its own, because
without an explanation the first stroke looks like a broken keyboard.

Capital Ě and Ů are left out. In Czech they never begin a word, and elsewhere
they do not need a capital.

## The hardest pairs for a single finger in Czech

The hardest pairs are those where one finger has to hit two different keys
one immediately after the other. The work cannot be split between two fingers
or between the hands; the finger has to lift, move and strike again in time.

- lo and ol, right ring finger, 36 occurrences
- ce and ec, left middle finger, 27 occurrences
- tr and rt, left index finger, 25 occurrences
- ed and de, left middle finger, 25 occurrences

The hardest Czech word in the list is čtvrtek, Thursday, which packs four such
pairs into seven letters. With two each come bratr, dcera, kolo, kouzlo,
leden, meloun, muž, poledne, pstruh, rozum and slunce.

The program turned this into a lesson of finger twisters of its own. They work
like tongue twisters: the point is not to type them fast, but to find out
whether the fingers are working independently.

## One-handed words

The second group of hard words are those typed entirely with one hand. The
other hand has nothing to do, and one hand has to manage the whole sequence
alone.

In Czech there are markedly more of these for the left hand. In the program's
word list thirty-five came out for the left and fourteen for the right, two
and a half times as many. The left hand can type sestra, srdce, stavba, cesta,
večer or větev; the right hand kolo, okno, pokoj, kouzlo or kluk. The alphabet
sits further left on a Czech keyboard.

The one-handed exercise therefore has real words for the left hand, while the
right hand has to be padded with syllables, or there would be nothing to build
a line from.

## How this was computed

I computed both statistics myself. They are not taken from English sources,
where they would apply to a different layout anyway. The method is simple.
Take the program's word list, assign each letter a finger and a hand from the
finger map, and walk the adjacent letter pairs in every word. A pair where the
same finger serves both characters, and the key is not the same one twice,
counts.

One limitation deserves saying out loud. The list holds five hundred and
thirty-nine words and was chosen so that it can be used in exercises for a
child, not to represent Czech as a whole. The numbers therefore describe what
is hard in these words. The ranking of the worst pairs would probably survive
on a larger corpus; the exact counts would not.

## English words on a Czech keyboard

The swapped Y and Z is the worst trap when typing English on a Czech keyboard,
and it catches people who otherwise type confidently. The lesson of English
vocabulary therefore has a step of its own, built only from words containing Y
or Z. Without it, the two letters would come up too rarely for the difference
to sink in.
