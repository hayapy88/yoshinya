# Split Bill (よしにゃに割り勘)

## Problem being solved

Several people bring food and drink to a party, each paying for different
things, and afterwards nobody can work out who owes what. Dividing the total by
the number of heads is wrong twice over: it ignores who already paid, and it
charges the person who arrived for the last hour the same as everyone else.

The tool takes what each person paid and how much of each cost they carry, and
answers the question people actually have — who pays whom, and how much.

## Target users

Whoever ends up doing the arithmetic: the host of a house party, the person who
booked the trip, someone who fronted a group order. No account, no app, and the
result is meant to be handed to the group rather than kept.

## Naming

| | |
| --- | --- |
| Japanese | よしにゃに割り勘 |
| English | Split Bill by Yoshinya |
| Slug | `split-bill` |

## Money is integers, all the way through

Amounts are held as whole minor units — 10.25 becomes 1025 — and converted back
only for display. This is exactly the arithmetic where 0.1 + 0.2 stops being
0.3, and the consequence is not a cosmetic one: a rounding error here is a
person paying a cent more than they owe, in a table that is supposed to add up
to what was spent.

Input is parsed strictly. `Number()` would accept `1e5`, `0x10`, `Infinity` and
`-100`, and each of those would produce a confident, wrong settlement; the
parser refuses anything that is not a plain positive amount, while accepting the
thousands separators people paste in.

## Three properties, asserted everywhere

Every calculation the tests make is checked against the same three statements,
rather than only against worked examples — the failures that matter are the ones
nobody thought to write an example for:

```
Σ burden  = total          nobody covers more or less than was spent
Σ balance = 0              what is owed equals what is owed to
after settling, every balance is 0
```

## Shares are allocated per expense

The total is not divided once. Each expense is divided among the people who
share it, and those amounts are summed per person.

Dividing the grand total would let one person's exclusion from the wine quietly
change what everyone owes on the taxi. Doing it per expense also means each cost
rounds to its own exact amount, which is what keeps the column adding up.

Rounding uses the largest remainder method: every share is floored, and the
leftover units go to whoever was cut hardest. Ties break by registration order —
arbitrary, but it has to be decided by something, and being deterministic is
what stops the same input producing two different answers.

## Per-expense shares

Not in the specification, which listed it as a future extension. It went in
because the specification's own motivating scene is a wine party, and a single
share per person cannot say *drank one glass of the wine but ate a normal amount
of the food* — one number applies to everything at once.

Each expense may name who carries it and at what weight. Left alone it is
`null`, meaning everyone at their usual share, so nothing about the simple case
changes. The moment the picker is opened and narrowed it becomes an explicit
list, seeded from those same shares so that opening it changes nothing by
itself, and it collapses back to `null` when it once again says nothing the
usual shares do not.

## Explaining the result took three attempts

The settlement list is correct and unreadable. Someone who paid 3,000 for wine
they also drank is owed 1,000, not 1,500, and no amount of looking at the total
explains the difference. Three rounds of "the number is right but I cannot see
why" produced this:

1. **Each expense on its own** — who carried what, and what that leaves them
   owing the person who paid.
2. **Between each pair** — everything owed one way, cancelled against what is
   owed back. This is where the wine payer's 1,500 becomes 1,000, because they
   owe 500 for the food somebody else bought.
3. **What that leaves each person** — the gross totals do not survive the
   netting, and this is the only thing that does.
4. **How the transfers are built** — largest owed against largest due, narrated
   with a running remainder so each line follows from the one above.

Which pairwise debt "became" which transfer is deliberately not claimed. That
mapping does not exist — netting destroys it — and an early attempt to assert it
was caught by a test: someone can owe 500 in one direction while being owed
1,500 in another and end up receiving, so gross totals do not carry across.

The narration mirrors `generateSettlements` and a test pins them together. An
explanation that describes a calculation the tool does not perform is worse than
no explanation.

## Each person's statement lists what they do not carry

Every cost appears in every person's breakdown, including the ones they carry
none of, marked as such.

Omitting them would ask the reader to notice an absence. Someone handed a figure
and asked to pay it wants to check that the wine they skipped is not inside it,
and "wine — none of this is yours" answers that outright where a missing line
does not.

The share each cost was split by is shown too. It was set on the form and then
appeared nowhere in the result, so a half share could not be checked. Where
everyone carries the same weight the wording stays "split 3 ways", which reads
better; where they do not, that phrasing is actively misleading — it reads as
equal thirds — so the weights are shown instead.

## The share column admits its limits

The table's share column exists to explain the amount beside it, and once an
expense sets its own weights it cannot: someone shown as 1 can be down for half
the wine, and the column and the amount then contradict each other in plain
sight.

Affected rows are marked and the reader is sent to the breakdown that does
explain it. The column is kept rather than removed because it is correct and
useful in the ordinary case, and the mark only appears when it is not.

## Three images, drawn rather than screenshotted

A screenshot carries the form, the buttons and whatever else was on screen.
These are a layout of their own, holding only what someone needs in order to pay
the right person the right amount:

| Version | Holds |
| --- | --- |
| Short | Total and who pays whom — for the group chat |
| With the table | Adds shares and payments per person |
| With the detail | Adds who paid for what, and each person's itemised statement |

The layout arithmetic is a pure function, so heights and column widths are
tested without a canvas. Nothing external is drawn — no logo file, no avatars —
so the canvas is never tainted and the PNG can always be read back out. Web
fonts are awaited first; drawing before they arrive silently produces the
fallback face.

Two defects there were found by looking at the output, not by tests: even column
widths cut the balance to "受取 ￥7,…", and the fix for that pushed the same
column off the canvas entirely. Widths are now measured from the text they hold,
which also fixed English — "Receives JPY 3,386" needs far more room than "受取
￥3,386" and was being truncated in exactly the same way.

There is a ceiling on the height. Canvases are limited by area in Safari, and
past it the browser returns a blank image rather than an error, so a request
that would exceed it is refused with an explanation instead.

## Sharing hands over the image alone

`navigator.share` existing is not enough — a browser can offer sharing and still
refuse files — so `canShare({ files })` is asked with the actual image, and the
button only appears where the answer is yes. Where it is no, the download is the
whole answer; a button that explains itself only after being pressed is not
worth showing.

Nothing accompanies the file. Sending text alongside looks helpful and is not:
iOS offers Copy among the share targets, and it takes one of whatever it was
given — with any text present it takes the text, so someone pressing Copy after
"share the image" ended up with "合計 ¥9,000" on their clipboard and no picture. The saved file is named
`split-bill-result.png`.
That was reported from a real iPhone; no stubbed check could have seen it,
because they all stop at the point the payload is handed over.

Closing the share sheet rejects with an `AbortError`, which is a decision rather
than a fault, and is separated from a real failure so the page can stay quiet
about it.

## Currencies are symbols

A currency code has to be reconciled with the page language before it can be
shown, and `Intl` gives up when they disagree: an English page asked for JPY
printed "JPY 5,031". Codes also multiply without adding anything, since AUD,
USD, CAD and SGD are all "$" to the people splitting the bill, and a group
settling up already knows which dollar they are in.

What matters to the arithmetic is the number of decimal places, and that is what
the list carries. The won is included because it is the only other currency here
without a subunit — "₩1,000.00" reads as a mistake, and rounding it to cents
would invent a precision the money does not have.

## Drafts expire

Kept on the device so a session survives a reload, and discarded after thirty
days. The page called the save temporary and, without an expiry, it was not:
names and amounts would have sat there indefinitely. A split is settled within
days of the event, so a month is generous without being forever.

Anything that does not match the current shape is discarded rather than
repaired. A half-recognised draft fed into the calculation is worse than
starting over.

## Privacy

Names, amounts, the result and the images stay in the browser. Nothing is sent
to a server, and analytics carry only counts, the tool slug and coarse size
bands.

## Tests

Unit tests cover the arithmetic against the three properties above, the awkward
divisions, per-expense shares, the explanation steps, the stored-draft shape and
its expiry, the image layout including the height ceiling, and every outcome of
sharing.

End-to-end tests drive the specification's worked example, the wine only some
people share, the share markings, a statement listing what a person does not
carry, all three images, the download, and a draft surviving a reload and then
being deleted.
