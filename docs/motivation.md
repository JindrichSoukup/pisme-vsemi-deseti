# Motivating a child who is learning to type

What I found about children's motivation and how it shaped the program. Most
of the decisions about rewards, goals and praise come from here rather than
from a hunch.

## Why it needs thinking about at all

Touch typing is a dull activity with a deferred payoff. For the first few
weeks the child is slower than it was with two fingers and can see no benefit
at all. That is exactly the situation in which the framing of the work decides
the outcome, and exactly where damage is easy to do.

## Rewards and intrinsic motivation

A meta-analysis of a hundred and twenty-eight experiments by Deci, Koestner
and Ryan, published in 1999, found that tangible rewards tied to engagement,
completion or performance undermine intrinsic motivation. The effect is
stronger in children than in undergraduates. Positive feedback, by contrast,
strengthens intrinsic motivation, both in what people choose to do freely and
in how interested they say they are.

What decides it is how the recipient reads the reward. The same thing can be
information about one's own competence, or an instrument somebody is using to
steer you. The first helps; the second hurts.

The overjustification effect belongs here too. A reward promised in advance
for an activity that was enjoyable in itself reduces interest in it. The same
reward given as a surprise, after the fact, does not, because the child never
connects it to the reason it was doing the thing. In children the undermining
is more pronounced than in adults.

### What the program does with that

- While typing, the screen is quiet. No points, no countdown, nothing
  flashing.
- The picture for the scrapbook arrives only after a finished lesson, and is
  never promised beforehand.
- It does not arrive every time. Irregularity keeps it a surprise; a reliable
  reward would quickly turn into an expected entitlement.
- The scrapbook shows earned pictures only. Locked slots would turn the reward
  into a to-do list, which is precisely the known-in-advance goal that does
  the damage.

## Goals

In 1981 Bandura and Schunk worked with forty children aged seven to ten who
had large gaps in arithmetic and disliked it. They split them into three
groups: proximal sub-goals, one distant goal, no goal. The group with proximal
goals progressed fastest, reached the best mastery and the highest belief in
their own ability, and ended up the most interested in arithmetic. The distant
goal had no demonstrable effect and came out much like no goal at all.

The age matters. These were children of seven to ten, exactly the age this
program is written for, working on material they had not managed before and
did not enjoy. That is the same situation as touch typing. The proximal goal
did not merely do somewhat better: the distant goal did essentially nothing,
even though both groups got identical materials and identical time.

### What the program does with that

- On the home screen the child has one single goal, today's. Ten minutes, set
  by the parent.
- During a lesson, after every exercise, the program says how many are left
  and roughly how many minutes that is, computed from how fast the child
  actually types.
- The daily goal is reachable. If the exercises were shortened, the child
  would fall short of it and would have to decide whether to start another
  lesson.

### Why the whole ladder of lessons is hidden

This follows directly from that study and is probably the single biggest
decision in the design of the screen.

Thirty-eight lessons listed one under another are exactly the distant goal
Bandura and Schunk showed does not help. It also does two things at once: it
shows today's work as a negligible fraction of the whole, and everything else
as unfinished. The child would start every day by looking at a long list of
what it cannot do yet.

The program therefore shows three things, in this order:

- Now, the single lesson the child has in progress or ahead of it
- What you already know, the finished lessons, newest first
- What is still coming, behind a link that does not open by itself

The finished lessons are reversed on purpose, newest at the top. It looks like
a detail, but it changes what the child sees first after today's goal: the
last thing it mastered, rather than the easiest thing from its first week. It
also keeps the newest lesson within reach when the child wants to show it off
or repeat it, instead of scrolling past everything older.

The total number of lessons is never shown to the child. Only the parent sees
it, in the report.

## Praise

In 1998 Mueller and Dweck showed across six studies that praising intelligence
has worse motivational consequences than praising effort. Children praised for
being clever focused on performance rather than on learning. After a setback
they persisted less, enjoyed it less, more often explained the failure by a
lack of ability, and performed worse. They also came to treat ability as
fixed, while those praised for their work treated it as something that can be
improved.

### What the program does with that

- It praises the work done, never the child. The program says "that was eleven
  minutes at the keyboard", not "you are clever".
- Once the daily goal is met, nothing pushes: stop, or do some more, as you
  like.
- After a lesson that went badly the program does not scold. It suggests a
  break and a slower pace.
- The wording carries no grammatical gender, so the program works for a boy
  as well. (Czech marks gender in ordinary adjectives, so this takes effort.)
- Tests check that words like clever or smart never appear in the praise.

## Stars and feedback

The stars in the program are not a score against other people but a report on
your own accuracy against a fixed criterion. One for ninety percent, two for
ninety-five, three for ninety-eight plus the lesson's target speed. That kind
of judgement falls into the informational category, the one that tends to
support intrinsic motivation.

Deficit framing is kept out. A summary such as "five stars out of a hundred
and fourteen possible", or a count of lessons without a star, is visible to
the parent in the report only. The child has three stars per lesson and
nothing else.

Accuracy outranks speed, because while the technique is still shaky, speed
only cements the mistakes. Speed alone therefore cannot earn more than two
stars.

## Gamification as a whole

Meta-analyses of gamification in education come out mixed. The most consistent
finding is that gamification raises perceived autonomy and relatedness and
improves intrinsic motivation, but has little effect on perceived competence.
The reviews keep repeating two warnings: the novelty effect wears off, and
badly designed elements can eclipse the learning content, because the child
clicks through quickly for the reward instead of learning.

A progress indicator shows up in the reviews as an element that reliably
helps, because it makes progress visible and encourages finishing what has
been started.

Leaderboards, on the other hand, are risky: they motivate the competitive and
demotivate everyone else. The claim that a static leaderboard drives away
ninety percent of users within a week circulates on vendor blogs and I could
not trace a study behind it, so I do not treat it as evidence, only as a
warning pointing the same way.

### What is deliberately absent

- leaderboards and comparison with other children
- points, combos and a countdown while typing
- day streaks used as pressure. A streak appears only from two days, so that
  a zero never sits on the screen, and breaking one is never commented on
- rewards promised in advance

## Limits and what to watch

The studies this rests on are from the seventies to the nineties and concern
tasks other than typing. The transfer is reasonable, but it is not proof.

The novelty effect will wear off here too. When the scrapbook pictures stop
working, the answer is not bigger rewards, because that strengthens the very
extrinsic motivation that does the harm. The better move is more autonomy: a
choice of topic, the option to repeat one part of a lesson, or typing your own
text.

The observable indicator of whether any of this works is simple. Does the
child come back to the program on its own, or only when asked?

## Sources

- Deci, Koestner, Ryan (1999), a meta-analysis of rewards and intrinsic motivation,
  https://www.researchgate.net/publication/12712628_A_Meta-Analytic_Review_of_Experiments_Examining_the_Effects_of_Extrinsic_Rewards_on_Intrinsic_Motivation
- Bandura, Schunk (1981), proximal sub-goals in children,
  https://uploads-ssl.webflow.com/59faaf5b01b9500001e95457/5bc552d85141987915dab842_Bandura%20&%20Schunk,%201981.pdf
- Mueller, Dweck (1998), praise for intelligence,
  https://www.columbia.edu/cu/psychology/courses/3615/Readings/Mueller_Dweck.pdf
- Lepper, Greene (1975), surveillance and extrinsic rewards in children,
  https://bingschool.stanford.edu/sites/bingschool/files/1975_leppergreene.pdf
- The overjustification effect, an overview, https://en.wikipedia.org/wiki/Overjustification_effect
- A meta-analysis of the effectiveness of gamification in education,
  https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10591086/
- Gamification and intrinsic motivation, a meta-analysis,
  https://link.springer.com/article/10.1007/s11423-023-10337-7
