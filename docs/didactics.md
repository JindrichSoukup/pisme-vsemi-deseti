# How typing is taught, and what this program took from it

What I found about teaching touch typing, what the program uses and what it
leaves out. It exists so that the decisions behind the curriculum can be
checked later rather than changed blindly.

## Where the material comes from

Four kinds of source turned out to be usable. Czech teaching sites: ZAV,
Umíme informatiku and psani-deseti.cz. The open lesson files of GNU Typist
and its MIT predecessor, which are a literal transcript of a classic typing
textbook and can be read line by line. The how-to-type and Ratatype courses.
And my own computations over this program's word list.

I could not get the lesson content of the Century 21 and 20th Century
Typewriting textbooks; searching returns catalogue records only. The same
goes for the lesson structure of Klavaro and TIPP10. Mastering Computer
Typing turned out to be a scan whose text layer is scrambled and reads
backwards.

## The order of the keys

Czech sources agree on working outwards from the index fingers: F and J
first, then D and K, S and L, A and Ů, then G and H. The top row follows,
then the bottom row, then capitals, and the accented letters on the number
row last.

The ZAV method does it differently. It teaches letters by their frequency in
Czech and starts from A, because syllables and short words can then be built
early. After two hundred exercises a student has covered roughly
eighty-five percent of ordinary text.

The classic English textbook goes a third way. Lesson T1 covers the whole
home row at once, and by the end of that same lesson the student is typing
real words and a sentence:

    fff jjj ddd kkk sss lll aaa ;;;
    asdf jkl; asdf jkl; asdf jkl;
    sad add all; alas flask fad
    dad asks a lad; a lass falls

This program takes small steps instead and spreads the home row over four
lessons. The price is that the first real words arrive in lesson four and the
first sentence in lesson eighteen. For a nine-year-old starting from nothing,
smaller steps seemed to me worth more than the quick reward of a real word.

## How an exercise is built

### Shrinking groups

The textbook does not repeat a single letter forever. It shortens the groups:

    fff fff fff  ff ff ff  f f f

There is a reason for that. The shorter the group, the more often the space
bar comes round, and the more often the finger has to return to its home
key. A line made only of "fff" drills one movement over and over, but almost
never the return home.

### The space bar from lesson one

On the question of when to introduce the space bar, the sources are
unanimous: immediately. The classic textbook separates groups with a space on
the very first line of the very first lesson, and Czech sources do the same.
The space bar is not another key that could be postponed, because without it
nothing longer than one cluster of letters can be written.

There is a second reason. The space bar is struck with the thumb, the one
finger that has no home key in the home row and never reaches anywhere. It
does not compete with the other fingers and can be learned alongside them.
The program therefore asks for the thumb from the first lesson and never
introduces the space bar as new material.

### Three stages of drill

Research on motor learning describes the contextual interference effect.
Blocked practice, meaning the same thing repeated in a row, produces better
performance during the practice session itself but poorer retention. Random
order is harder while practising, yet holds up far better in later recall and
transfer. For a beginner in the early phase blocked practice works better, so
the right answer is both, in that order, not one instead of the other.

The program therefore goes:

- one letter over and over, so the finger learns the path
- regular alternation between the hands, so a rhythm sets in
- shuffled groups that also mix in letters from earlier lessons

### A warm-up first

A textbook lesson does not open with new material but with a reminder of what
the student already knows. First the whole home row, then the clamps for keys
learned earlier.

### Clamping a reach between home keys

The most common beginner mistake is not the wrong key. It is the whole hand
drifting after a reaching finger, failing to come back, so the next letter
lands one key over. For every key outside the home row the textbook has this
grip:

    fgf jhj ded k,k

The finger reaches out and returns home immediately, before the hand has time
to follow. The program derives these triples from the finger map itself, so
`frf juj` comes out for R and U, and `sěs dšd` for Ě and Š on the number row.

### Shift

The courses agree on the opposite-hand rule: the letter with one hand, Shift
with the little finger of the other. The textbook adds a clamp between the
home key of the little finger holding Shift, and later the same thing with
whole words:

    ;;; ;A; ;;; ;F; ;;; ;D;
    aaa Pi aaa Lord aaa Jill aaa

The hardest case is alternating both Shifts, meaning two capitals in a row
from opposite sides of the keyboard. The how-to-type course gives it a step
of its own, called All Together.

## How performance is measured

Czech measures typing speed in keystrokes per minute, not in words per minute
as English does. One keystroke is one key press, the space bar included. The
program keeps the Czech unit, because every local requirement is stated in it
and any school result the child later sees will be in it too.

What the program shows is net speed, lowered by the error rate. Gross speed,
which ignores mistakes, is misleading for a beginner: it can be raised by
typing fast and badly, which is exactly what the whole drill is trying to
prevent.

### The target speed of a lesson

Every lesson has a target speed, from forty keystrokes per minute in the first
lesson to a hundred and twenty in the hardest ones. That series is not taken
from any table; I set it as a gentle ramp. That is deliberate, because the
target speed blocks nothing. It decides the third star only, and unlocking the
next lesson depends on accuracy alone. So if the number on some lesson is set
more strictly than suits a nine-year-old, the worst that happens is that the
third star is harder to reach there.

For comparison, an ordinary touch-typing adult runs at around two hundred
keystrokes per minute. The targets in the program sit well below that on
purpose.

## Mistakes during a drill

The sources agree that typos are not corrected during a drill, because
stopping and deleting interrupts the very movement the finger is supposed to
learn. The program honours that by keeping Backspace switched off at first
and introducing it later as a lesson of its own.

Letting a child finish a line on which it has already made six mistakes makes
no sense either. The fingers are reinforcing the wrong movement while they do
it. The program therefore watches the line: once more than two mistakes pile
up on it, the line is cleared and typed again from the start. After three
attempts it moves on regardless, so that nobody gets stuck on one line and
loses heart. The limit of two is adjustable, or can be switched off.

The difference from deleting is that a single character in the middle of
typing is never patched. The whole movement is repeated from the beginning,
which is how any other motor skill is practised.

## Weak keys come back

Adaptive programs such as keybr track the error rate and the reaction time of
each key separately and deliberately feed weak keys back into the text. This
program takes that over in a milder form: for every character it keeps an
error rate and a moving average of latency, and computes from them a weight
for drawing words. A word containing a key that is giving the child trouble
turns up more often.

It is milder in two respects. The weight moves within a small range, so an
exercise never degenerates into one difficult key over and over. And a key
with fewer than ten strokes so far gets a raised weight too, because the
program knows nothing about it yet, and a barely practised key deserves
attention as much as an error-prone one.

## What the sources agree on

- Accuracy matters more than speed. Fast typing with a bad technique only
  cements the mistakes.
- Short daily doses work better than a long session now and then. Ten to
  fifteen minutes a day is enough.
- Do not look at your hands. Anyone who looks will not learn to touch type.
- Mistakes are not corrected during a drill. Correcting every typo means
  stopping constantly, and the fingers never get to learn the movement.
  Backspace should come later, as material of its own.
- The space bar is struck with a thumb. The English textbook insists on the
  right thumb; Czech sources leave it open.
- After every stroke outside the home row the finger returns to its home key.
- Posture is material, not friendly advice. Straight back, both feet on the
  floor, elbows loose at the sides, wrists not resting on the desk. The
  program says so in the first lesson and only occasionally afterwards, so
  that it does not become wallpaper.

### How long one lesson is

One decision follows from the short daily doses and is not obvious from the
outside: a lesson is roughly as long as a whole day's practice. Shorter,
friendlier lessons would look more sensible, but then a finished lesson would
leave the daily goal a few minutes short, and every day would end in a
negotiation about whether to start another one. This way the day is closed by
a single lesson.

A child who runs out of steam stops between exercises and finishes tomorrow,
because the program remembers where the lesson was left. That covers the case
that would otherwise argue for shortening lessons.

### Not looking at your hands

The on-screen keyboard is genuinely double-edged here. It helps while the
child does not know where a key is, and it hurts the moment the child starts
looking at it instead of remembering. The program can therefore switch it off
and expects that to happen once the technique settles. The drawing of the
hands with the next finger highlighted stays, because it shows which finger is
due, not where the key is.

## What is specific to Czech

The QWERTZ layout, the accented letters on the number row, capitals with
diacritics composed through a dead key, and my own computation of which
letter pairs are hardest for a single finger in Czech: all of that has
a note of its own, [Czech and the Czech keyboard](czech-keyboard.md). The
curriculum leans on it in several places, above all in the lesson on composing
capitals and in the finger twisters.

## Left and right at nine

Mixing up the sides is normal at this age. The recommendations that keep
recurring in the material are colour coding, naming the side out loud and
repeatedly, and demonstrating on your own body beside the child rather than
facing them.

The program solves it by letting colour mean the finger, not the hand. The
same finger has the same colour on both hands, so four colours are enough and
they can be told apart. Left and right are distinguished by the drawing of the
hands, which carries a large L and P on the palms, and by the wording of the
hint. The eight muted pastel shades the program started with ran together the
moment anybody actually used it.

## Sources

- ZAV, the Czech internet typing school, https://www.zav.cz/vyuka-psani-na-klavesnici/
- Touch typing at Umíme informatiku, https://www.umimeinformatiku.cz/cviceni-psani-vsemi-deseti
- The theory of touch typing, psani-deseti.cz, https://www.psani-deseti.cz/teorie
- Typist, the MIT lesson file, https://web.mit.edu/games/lib/typist/t.typ
- GNU Typist, https://www.gnu.org/software/gtypist/doc/gtypist.html
- How To Type, the lesson on capitals, https://www.how-to-type.com/touch-typing-lessons/how-to-type-capitals/
- Ratatype, the guide for teachers, https://www.ratatype.com/faq/The-ultimate-Guide-for-Teachers-to-teach-touch-typing-to-children/
- A review of blocked versus random practice, https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4069194/
