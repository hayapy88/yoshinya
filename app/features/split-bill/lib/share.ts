import type { CalculationResult, Participant } from './calculate';
import { formatMoney, type CurrencyCode } from './money';

/**
 * The words the text is built from, passed in rather than imported, so this
 * stays a pure function and the Japanese and English versions come out of the
 * same code path. Hardcoding either language here would guarantee they drift.
 */
export type ShareLabels = {
  title: string;
  total: string;
  settlementsHeading: string;
  breakdownHeading: string;
  burden: string;
  paid: string;
  receive: string;
  pay: string;
  settled: string;
  nothingToSettle: string;
  footer: string;
};

export type ShareInput = {
  eventName: string;
  eventDate: string;
  currency: CurrencyCode;
  locale: string;
  participants: Participant[];
  result: CalculationResult;
  labels: ShareLabels;
};

/**
 * The result as plain text, for pasting into a group chat.
 *
 * Empty fields are left out entirely rather than printed blank — a line reading
 * "日付：" tells the reader nothing except that the tool has gaps in it.
 */
export function buildShareText({
  eventName,
  eventDate,
  currency,
  locale,
  participants,
  result,
  labels,
}: ShareInput): string {
  const money = (minor: number) => formatMoney(minor, currency, locale);
  const nameOf = (id: string) =>
    participants.find((p) => p.id === id)?.name ?? '';

  const heading = [eventName.trim() || labels.title, eventDate.trim()]
    .filter(Boolean)
    .join('｜');

  const lines: string[] = [
    `【${heading}】`,
    `${labels.total}${money(result.totalMinor)}`,
    '',
    `■ ${labels.settlementsHeading}`,
  ];

  if (result.settlements.length === 0) {
    lines.push(labels.nothingToSettle);
  } else {
    for (const s of result.settlements) {
      lines.push(
        `${nameOf(s.fromParticipantId)} → ${nameOf(s.toParticipantId)}：${money(s.amountMinor)}`,
      );
    }
  }

  lines.push('', `■ ${labels.breakdownHeading}`);
  for (const participant of participants) {
    const r = result.participantResults.find(
      (x) => x.participantId === participant.id,
    );
    if (!r) {
      continue;
    }
    const standing =
      r.balanceMinor > 0
        ? `${labels.receive} ${money(r.balanceMinor)}`
        : r.balanceMinor < 0
          ? `${labels.pay} ${money(-r.balanceMinor)}`
          : labels.settled;
    lines.push(
      `${participant.name}：${labels.burden} ${money(r.burdenMinor)} / ${labels.paid} ${money(r.paidMinor)} / ${standing}`,
    );
  }

  lines.push('', labels.footer);
  return lines.join('\n');
}
