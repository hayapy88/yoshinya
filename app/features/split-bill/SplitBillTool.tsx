import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useLocale } from '~/i18n/locale';
import { track } from '~/lib/analytics';
import { ToolIntro } from '~/components/tool/ToolIntro';
import { ToolGuide } from '~/components/tool/ToolGuide';
import { calculateResults, sharesOf } from './lib/calculate';
import {
  CURRENCIES,
  decimalsFor,
  formatMoney,
  parseAmountToMinor,
  symbolFor,
  type Currency,
} from './lib/money';
import {
  breakDownExpenses,
  narrateSettlements,
  netBetweenPairs,
  netPositions,
  statementFor,
} from './lib/explain';
import { buildShareText } from './lib/share';
import { ImageTooLongError, renderShareImage } from './lib/share-image';
import {
  emptyState,
  parseStored,
  reducer,
  serialiseDraft,
  STORAGE_KEY,
} from './lib/state';
import { LIMITS, problemsFor, validate } from './lib/validate';
import './split-bill.css';

const TOOL = 'split-bill' as const;

type ImageVariant = 'simple' | 'detailed' | 'items';

/** Coarse enough to be useless for identifying anyone, which is the point. */
const sizeBand = (n: number) => (n <= 5 ? '2-5' : n <= 10 ? '6-10' : '11-20');

function SplitBillTool() {
  const { locale, t } = useLocale();
  const s = t.splitBill;

  // The default currency follows the page, since that is the best guess
  // available without asking, and it is one control away from being changed.
  const defaultCurrency: Currency = locale === 'ja' ? 'yen' : 'dollar';
  const [state, dispatch] = useReducer(reducer, defaultCurrency, emptyState);
  const [showResult, setShowResult] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageVariant, setImageVariant] = useState<ImageVariant>('simple');
  const [imageBusy, setImageBusy] = useState(false);
  const imageBlob = useRef<Blob | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [editingSharers, setEditingSharers] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);

  useEffect(() => {
    track('tool_opened', { tool: TOOL });
  }, []);

  // Restored once, on the client only: the server has no localStorage, and
  // reading it during render would produce different HTML on each side.
  useEffect(() => {
    if (restored.current) {
      return;
    }
    restored.current = true;
    const saved = parseStored(window.localStorage.getItem(STORAGE_KEY));
    if (saved) {
      dispatch({ type: 'restore', state: saved });
    }
  }, []);

  useEffect(() => {
    if (!restored.current) {
      return;
    }
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          serialiseDraft(state, Date.now()),
        );
      } catch {
        // A full or blocked store is not worth interrupting the user over —
        // the draft is a convenience, and the numbers on screen are unaffected.
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [state]);

  useEffect(
    () => () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    },
    [imageUrl],
  );

  useEffect(() => {
    if (!notice) {
      return;
    }
    const id = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(id);
  }, [notice]);

  const amountInputs = useMemo(
    () => new Map(Object.entries(state.amountInputs)),
    [state.amountInputs],
  );
  const problems = useMemo(
    () =>
      validate(
        state.participants,
        state.expenses,
        state.currency,
        amountInputs,
      ),
    [state.participants, state.expenses, state.currency, amountInputs],
  );
  const result = useMemo(
    () => calculateResults(state.participants, state.expenses),
    [state.participants, state.expenses],
  );
  const breakdowns = useMemo(
    () => breakDownExpenses(state.expenses, state.participants),
    [state.expenses, state.participants],
  );
  const pairDebts = useMemo(() => netBetweenPairs(breakdowns), [breakdowns]);
  const positions = useMemo(
    () => netPositions(pairDebts, state.participants),
    [pairDebts, state.participants],
  );
  const settlementSteps = useMemo(
    () => narrateSettlements(positions),
    [positions],
  );

  /**
   * One colour per person, so a name can be followed down the page.
   *
   * Colour identifies the person and nothing else. It is tempting to colour
   * "which debts became which transfer", but that mapping does not exist:
   * netting destroys it, and only each person's balance survives.
   */
  const hueOf = (participantId: string) => {
    const index = state.participants.findIndex((p) => p.id === participantId);
    // The golden angle keeps neighbouring people far apart in hue.
    return index < 0 ? 0 : Math.round((index * 137.508) % 360);
  };
  const Person = ({ id }: { id: string }) => (
    <span
      className="sb-person"
      style={{ '--sb-hue': hueOf(id) } as React.CSSProperties}
    >
      {nameOf(id)}
    </span>
  );

  const money = (minor: number) => formatMoney(minor, state.currency, locale);
  const nameOf = (id: string) =>
    state.participants.find((p) => p.id === id)?.name ?? '';

  const calculate = () => {
    setShowErrors(true);
    if (problems.length > 0) {
      track('tool_error' as never, { tool: TOOL, action: problems[0].code });
      return;
    }
    setShowResult(true);
    track('batch_action' as never, {
      tool: TOOL,
      action: 'calculate',
      mode: sizeBand(state.participants.length),
      file_count: state.expenses.length,
    });
    // Moved to rather than announced: the result is the answer to the button
    // that was just pressed, and on a phone it is below the fold.
    window.setTimeout(() => resultRef.current?.focus(), 0);
  };

  const shareText = () =>
    buildShareText({
      eventName: state.eventName,
      eventDate: state.eventDate,
      currency: state.currency,
      locale,
      participants: state.participants,
      result,
      labels: {
        title: s.defaultTitle,
        total: `${s.total}：`,
        settlementsHeading: s.settlementsHeading,
        breakdownHeading: s.breakdownHeading,
        burden: s.colBurden,
        paid: s.colPaid,
        receive: s.receive,
        pay: s.pay,
        settled: s.settled,
        nothingToSettle: s.nothingToSettle,
        footer: s.footer,
      },
    });

  const copy = async () => {
    const text = shareText();
    try {
      await navigator.clipboard.writeText(text);
      setNotice(s.copied);
      setCopyFallback(null);
      track('batch_action' as never, { tool: TOOL, action: 'copy_result' });
    } catch {
      // Clipboard access is refused in more situations than it is granted in
      // some browsers, so the text is offered directly rather than lost.
      setCopyFallback(text);
      setNotice(s.copyFailed);
    }
  };

  const makeImage = async (variant: ImageVariant) => {
    setImageBusy(true);
    setImageVariant(variant);
    try {
      const blob = await renderShareImage({
        title: state.eventName.trim() || s.defaultTitle,
        date: state.eventDate.trim(),
        total: money(result.totalMinor),
        summary: `${s.participantCount(state.participants.length)} · ${s.expenseCount(state.expenses.length)}`,
        settlementsHeading: s.settlementsHeading,
        settlements: result.settlements.map((settlement) => ({
          from: nameOf(settlement.fromParticipantId),
          to: nameOf(settlement.toParticipantId),
          amount: money(settlement.amountMinor),
        })),
        nothingToSettle: s.nothingToSettle,
        // The expense list is deliberately absent from both: the image is for
        // paying the right person, not for auditing the receipts.
        // Travels with the itemised version: the person checking what is
        // inside their share also wants to know whose money went out.
        expenses:
          variant === 'items'
            ? {
                heading: s.detailsHeading,
                rows: state.expenses.map((expense) => ({
                  payer: nameOf(expense.payerId),
                  label: expense.description || s.amount,
                  amount: money(expense.amountMinor),
                })),
              }
            : null,
        statements:
          variant === 'items'
            ? {
                heading: s.statementsHeading,
                people: state.participants.flatMap((participant) => {
                  const r = result.participantResults.find(
                    (x) => x.participantId === participant.id,
                  );
                  return r
                    ? [
                        {
                          name: participant.name,
                          total: `${s.statementBurdenTotal} ${money(r.burdenMinor)}`,
                          items: statementFor(breakdowns, participant.id).map(
                            (item) => ({
                              label: item.expense.description || s.amount,
                              amount:
                                item.amountMinor === null
                                  ? s.statementNotShared
                                  : money(item.amountMinor),
                              carried: item.amountMinor !== null,
                            }),
                          ),
                        },
                      ]
                    : [];
                }),
              }
            : null,
        breakdown:
          variant === 'simple'
            ? null
            : {
                heading: s.breakdownHeading,
                columns: [
                  s.colName,
                  s.colWeight,
                  s.colBurden,
                  s.colPaid,
                  s.colBalance,
                ],
                rows: state.participants.flatMap((participant) => {
                  const r = result.participantResults.find(
                    (x) => x.participantId === participant.id,
                  );
                  return r
                    ? [
                        [
                          participant.name,
                          String(participant.weight),
                          money(r.burdenMinor),
                          money(r.paidMinor),
                          r.balanceMinor > 0
                            ? `${s.receive} ${money(r.balanceMinor)}`
                            : r.balanceMinor < 0
                              ? `${s.pay} ${money(-r.balanceMinor)}`
                              : s.settled,
                        ],
                      ]
                    : [];
                }),
              },
        footer: s.footer,
      });
      imageBlob.current = blob;
      setImageUrl((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return URL.createObjectURL(blob);
      });
      track('batch_action' as never, {
        tool: TOOL,
        action: 'create_image',
        mode: variant,
      });
    } catch (error) {
      setNotice(
        error instanceof ImageTooLongError ? s.imageTooLong : s.imageFailed,
      );
    } finally {
      setImageBusy(false);
    }
  };

  const downloadImage = () => {
    if (!imageBlob.current || !imageUrl) {
      return;
    }
    const anchorEl = document.createElement('a');
    anchorEl.href = imageUrl;
    anchorEl.download = 'warikan-result.png';
    anchorEl.click();
    track('download_completed', { tool: TOOL, file_count: 1 });
  };

  const removalTarget = state.participants.find((p) => p.id === pendingRemoval);
  const removalExpenseCount = state.expenses.filter(
    (e) => e.payerId === pendingRemoval,
  ).length;

  const requestRemoval = (id: string) => {
    if (state.expenses.some((e) => e.payerId === id)) {
      setPendingRemoval(id);
      return;
    }
    dispatch({ type: 'remove_participant', id, withExpenses: false });
  };

  const canRemoveParticipant =
    state.participants.length > LIMITS.minParticipants;
  const errorsFor = (key: { participantId?: string; expenseId?: string }) =>
    showErrors ? problemsFor(problems, key) : [];
  const globalErrors = showErrors
    ? problems.filter((p) => !p.participantId && !p.expenseId)
    : [];

  return (
    <main className="sb-page">
      <ToolIntro
        heading={t.splitBillPage.heading}
        lead={t.splitBillPage.lead}
        privacyNote={t.splitBillPage.privacyNote}
      />

      <section className="sb-section">
        <h2>{s.eventHeading}</h2>
        <div className="sb-grid">
          <div className="sb-field">
            <label htmlFor="sb-event-name">
              {s.eventName}{' '}
              <span className="sb-optional">{s.eventNameOptional}</span>
            </label>
            <input
              id="sb-event-name"
              type="text"
              value={state.eventName}
              placeholder={s.eventNamePlaceholder}
              onChange={(e) =>
                dispatch({
                  type: 'set_event',
                  patch: { eventName: e.target.value },
                })
              }
            />
          </div>
          <div className="sb-field">
            <label htmlFor="sb-event-date">
              {s.eventDate}{' '}
              <span className="sb-optional">{s.eventNameOptional}</span>
            </label>
            <input
              id="sb-event-date"
              type="date"
              value={state.eventDate}
              onChange={(e) =>
                dispatch({
                  type: 'set_event',
                  patch: { eventDate: e.target.value },
                })
              }
            />
          </div>
          <div className="sb-field">
            <label htmlFor="sb-currency">{s.currency}</label>
            <select
              id="sb-currency"
              value={state.currency}
              onChange={(e) =>
                dispatch({
                  type: 'set_currency',
                  currency: e.target.value as Currency,
                })
              }
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {symbolFor(code)} {s.currencies[code]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="sb-section">
        <h2>{s.participantsHeading}</h2>
        <p className="sb-hint">{s.weightHint}</p>
        <p className="sb-hint sb-examples">{s.weightExamples}</p>

        <ul className="sb-list">
          {state.participants.map((participant, index) => {
            const errors = errorsFor({ participantId: participant.id });
            return (
              <li key={participant.id} className="sb-row">
                <div className="sb-field sb-grow">
                  <label htmlFor={`sb-name-${participant.id}`}>
                    {s.participantName}
                  </label>
                  <input
                    id={`sb-name-${participant.id}`}
                    type="text"
                    value={participant.name}
                    maxLength={LIMITS.maxNameLength}
                    placeholder={s.participantNamePlaceholder}
                    aria-invalid={errors.length > 0}
                    onChange={(e) =>
                      dispatch({
                        type: 'update_participant',
                        id: participant.id,
                        patch: { name: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="sb-field sb-narrow">
                  <label htmlFor={`sb-weight-${participant.id}`}>
                    {s.weight}
                  </label>
                  <input
                    id={`sb-weight-${participant.id}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={LIMITS.maxWeight}
                    step={0.1}
                    value={participant.weight}
                    onChange={(e) =>
                      dispatch({
                        type: 'update_participant',
                        id: participant.id,
                        patch: { weight: Number(e.target.value) },
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="sb-linkbtn"
                  disabled={!canRemoveParticipant}
                  aria-label={`${s.removeParticipant}: ${participant.name || index + 1}`}
                  onClick={() => requestRemoval(participant.id)}
                >
                  {s.removeParticipant}
                </button>
                {errors.map((problem) => (
                  <p key={problem.code} className="sb-error" role="alert">
                    {s.errors[problem.code]}
                  </p>
                ))}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="sb-btn sb-btn-secondary"
          disabled={state.participants.length >= LIMITS.maxParticipants}
          onClick={() => dispatch({ type: 'add_participant' })}
        >
          {s.addParticipant}
        </button>
      </section>

      <section className="sb-section">
        <h2>{s.expensesHeading}</h2>
        <ul className="sb-list">
          {state.expenses.map((expense) => {
            const errors = errorsFor({ expenseId: expense.id });
            return (
              <li key={expense.id} className="sb-row sb-expense-row">
                <div className="sb-field">
                  <label htmlFor={`sb-payer-${expense.id}`}>{s.payer}</label>
                  <select
                    id={`sb-payer-${expense.id}`}
                    value={expense.payerId}
                    onChange={(e) =>
                      dispatch({
                        type: 'update_expense',
                        id: expense.id,
                        patch: { payerId: e.target.value },
                      })
                    }
                  >
                    <option value="">{s.payerPlaceholder}</option>
                    {state.participants.map((participant, i) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.name || `${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sb-field sb-grow">
                  <label htmlFor={`sb-desc-${expense.id}`}>
                    {s.description}
                  </label>
                  <input
                    id={`sb-desc-${expense.id}`}
                    type="text"
                    value={expense.description}
                    placeholder={s.descriptionPlaceholder}
                    onChange={(e) =>
                      dispatch({
                        type: 'update_expense',
                        id: expense.id,
                        patch: { description: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="sb-field sb-narrow">
                  <label htmlFor={`sb-amount-${expense.id}`}>{s.amount}</label>
                  <input
                    id={`sb-amount-${expense.id}`}
                    type="text"
                    inputMode={
                      decimalsFor(state.currency) === 0 ? 'numeric' : 'decimal'
                    }
                    value={state.amountInputs[expense.id] ?? ''}
                    aria-invalid={errors.length > 0}
                    onChange={(e) =>
                      dispatch({
                        type: 'set_amount_input',
                        id: expense.id,
                        value: e.target.value,
                        amountMinor:
                          parseAmountToMinor(e.target.value, state.currency) ??
                          0,
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="sb-linkbtn"
                  disabled={state.expenses.length <= 1}
                  aria-label={`${s.removeExpense}: ${expense.description || ''}`}
                  onClick={() =>
                    dispatch({ type: 'remove_expense', id: expense.id })
                  }
                >
                  {s.removeExpense}
                </button>

                {/* Collapsed to a summary by default. Most costs are shared by
                    everyone, and a column of twenty checkboxes on every row
                    would bury the three fields that always need filling in. */}
                <div className="sb-sharers">
                  <span className="sb-sharers-label">{s.sharedByLabel}</span>
                  <span className="sb-sharers-value">
                    {expense.shares === null
                      ? s.sharedByEveryone
                      : sharesOf(expense, state.participants)
                          .map((share) => {
                            const name = nameOf(share.id);
                            // The weight is only worth saying when it is not
                            // the ordinary one — otherwise it is noise on every
                            // line.
                            return share.weight === 1
                              ? name
                              : `${name}(${share.weight})`;
                          })
                          .join('・') || s.sharedByNobody}
                  </span>
                  <button
                    type="button"
                    className="sb-linkbtn"
                    aria-expanded={editingSharers === expense.id}
                    onClick={() =>
                      setEditingSharers(
                        editingSharers === expense.id ? null : expense.id,
                      )
                    }
                  >
                    {s.sharedByEdit}
                  </button>
                </div>

                {editingSharers === expense.id && (
                  <div className="sb-sharer-picker">
                    <p className="sb-hint">{s.sharedByHint}</p>
                    <ul>
                      {state.participants.map((participant, i) => {
                        // Untouched, an expense follows everyone's usual share.
                        // The moment it is edited it becomes explicit, seeded
                        // from those same shares so nothing changes by itself.
                        const materialise = () =>
                          expense.shares ??
                          Object.fromEntries(
                            state.participants.map((p) => [p.id, p.weight]),
                          );
                        const included =
                          expense.shares === null ||
                          participant.id in expense.shares;
                        const weight =
                          expense.shares?.[participant.id] ??
                          participant.weight;
                        const setShares = (next: Record<string, number>) => {
                          const sameAsUsual =
                            state.participants.length ===
                              Object.keys(next).length &&
                            state.participants.every(
                              (p) => next[p.id] === p.weight,
                            );
                          dispatch({
                            type: 'update_expense',
                            id: expense.id,
                            // Collapsed back to "everyone" when it once again
                            // says nothing the usual shares do not.
                            patch: { shares: sameAsUsual ? null : next },
                          });
                        };
                        return (
                          <li key={participant.id}>
                            <label>
                              <input
                                type="checkbox"
                                checked={included}
                                onChange={(e) => {
                                  const next = materialise();
                                  if (e.target.checked) {
                                    next[participant.id] = participant.weight;
                                  } else {
                                    delete next[participant.id];
                                  }
                                  setShares({ ...next });
                                }}
                              />
                              {participant.name || `${i + 1}`}
                            </label>
                            <input
                              className="sb-share-weight"
                              type="number"
                              inputMode="decimal"
                              min={0}
                              max={LIMITS.maxWeight}
                              step={0.1}
                              value={included ? weight : ''}
                              disabled={!included}
                              aria-label={`${participant.name || i + 1} ${s.weight}`}
                              onChange={(e) => {
                                const next = materialise();
                                next[participant.id] = Number(e.target.value);
                                setShares({ ...next });
                              }}
                            />
                          </li>
                        );
                      })}
                    </ul>
                    <div className="sb-sharer-actions">
                      <button
                        type="button"
                        className="sb-linkbtn"
                        onClick={() =>
                          dispatch({
                            type: 'update_expense',
                            id: expense.id,
                            patch: { shares: null },
                          })
                        }
                      >
                        {s.sharedByAll}
                      </button>
                      <button
                        type="button"
                        className="sb-linkbtn"
                        onClick={() =>
                          dispatch({
                            type: 'update_expense',
                            id: expense.id,
                            patch: { shares: {} },
                          })
                        }
                      >
                        {s.sharedByNone}
                      </button>
                      <button
                        type="button"
                        className="sb-btn sb-btn-secondary"
                        onClick={() => setEditingSharers(null)}
                      >
                        {s.sharedByDone}
                      </button>
                    </div>
                  </div>
                )}

                {errors.map((problem) => (
                  <p key={problem.code} className="sb-error" role="alert">
                    {s.errors[problem.code]}
                  </p>
                ))}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="sb-btn sb-btn-secondary"
          disabled={state.expenses.length >= LIMITS.maxExpenses}
          onClick={() => dispatch({ type: 'add_expense' })}
        >
          {s.addExpense}
        </button>
      </section>

      {globalErrors.length > 0 && (
        <ul className="sb-errors" role="alert">
          {globalErrors.map((problem) => (
            <li key={problem.code}>{s.errors[problem.code]}</li>
          ))}
        </ul>
      )}

      <div className="sb-actions">
        <button
          type="button"
          className="sb-btn sb-btn-primary"
          onClick={calculate}
        >
          {s.calculate}
        </button>
      </div>

      {/* Sits with the sentence that makes the promise about storage, because
          that is where someone reads it and wants to act on it. */}
      <p className="sb-hint sb-storage">
        {s.storageNote}{' '}
        <button
          type="button"
          className="sb-linkbtn"
          onClick={() => {
            if (window.confirm(s.resetConfirm)) {
              window.localStorage.removeItem(STORAGE_KEY);
              dispatch({ type: 'reset', currency: defaultCurrency });
              setShowResult(false);
              setShowErrors(false);
              setNotice(s.dataDeleted);
            }
          }}
        >
          {s.deleteData}
        </button>
      </p>

      {showResult && problems.length === 0 && (
        <section
          className="sb-section sb-result"
          ref={resultRef}
          tabIndex={-1}
          aria-labelledby="sb-result-heading"
        >
          <h2 id="sb-result-heading">{s.resultHeading}</h2>

          <p className="sb-summary">
            <strong>{money(result.totalMinor)}</strong>
            <span>
              {s.participantCount(state.participants.length)} ·{' '}
              {s.expenseCount(state.expenses.length)}
            </span>
          </p>

          {/* The answer to the question people came with, so it goes first and
              largest — the table below is the evidence for it. */}
          <h3>{s.settlementsHeading}</h3>
          {result.settlements.length === 0 ? (
            <p className="sb-settled">{s.nothingToSettle}</p>
          ) : (
            <ul className="sb-settlements">
              {result.settlements.map((settlement, i) => (
                <li key={i}>
                  <span>{nameOf(settlement.fromParticipantId)}</span>
                  <span aria-hidden="true">→</span>
                  <span>{nameOf(settlement.toParticipantId)}</span>
                  <strong>{money(settlement.amountMinor)}</strong>
                </li>
              ))}
            </ul>
          )}

          {/* The settlement list alone cannot answer the question it provokes:
              why someone who paid 3,000 for wine is owed 1,000. These are the
              two steps between the receipts and that number. */}
          <details className="sb-working">
            <summary>{s.workingHeading}</summary>

            <p className="sb-hint">{s.workingColourNote}</p>

            <h4>{s.workingStep1}</h4>
            <ul className="sb-working-list">
              {breakdowns.map((breakdown) => (
                <li key={breakdown.expense.id}>
                  <p className="sb-working-expense">
                    <span>
                      {breakdown.expense.description || s.amount}{' '}
                      <strong>{money(breakdown.expense.amountMinor)}</strong>
                    </span>
                    <span className="sb-hint">
                      {s.workingPaidBy(nameOf(breakdown.expense.payerId))}
                    </span>
                  </p>
                  <ul>
                    {breakdown.shares.map((share) => (
                      <li key={share.participantId}>
                        {s.workingEach(
                          nameOf(share.participantId),
                          money(share.amountMinor),
                        )}
                        {share.participantId === breakdown.expense.payerId && (
                          <span className="sb-hint">
                            {' '}
                            (
                            {s.workingPaidBy(nameOf(breakdown.expense.payerId))}
                            )
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            <h4>{s.workingStep2}</h4>
            <p className="sb-hint">{s.workingNetNote}</p>
            {pairDebts.length === 0 ? (
              <p>{s.workingNothing}</p>
            ) : (
              <ul className="sb-working-debts">
                {pairDebts.map((debt, i) => (
                  <li key={i}>
                    <Person id={debt.fromParticipantId} /> →{' '}
                    <Person id={debt.toParticipantId} />
                    <strong>{money(debt.amountMinor)}</strong>
                  </li>
                ))}
              </ul>
            )}

            {/* The step between the two lists. Gross totals do not survive the
                netting; each person's balance is what does. */}
            <h4>{s.workingStepNet}</h4>
            <p className="sb-hint">{s.workingNetPositionNote}</p>
            <ul className="sb-working-debts sb-net-positions">
              {positions.map((position) => (
                <li key={position.participantId}>
                  <Person id={position.participantId} />
                  <span className="sb-hint">
                    {s.workingPays(money(position.paysMinor))} /{' '}
                    {s.workingReceives(money(position.receivesMinor))}
                  </span>
                  <strong>
                    {position.netMinor > 0
                      ? `${s.receive} ${money(position.netMinor)}`
                      : position.netMinor < 0
                        ? `${s.pay} ${money(-position.netMinor)}`
                        : s.settled}
                  </strong>
                </li>
              ))}
            </ul>

            {/* Narrated rather than listed. Which pairwise debt became which
                transfer is not a question with an answer — netting throws that
                away — but how the transfers are built is, and every line here
                follows from the balances above. */}
            <h4>{s.workingStep3}</h4>
            <p className="sb-hint">{s.workingCombineNote}</p>
            <ol className="sb-working-steps">
              {settlementSteps.map((step, i) => (
                <li key={i}>
                  <p className="sb-step-line">
                    <Person id={step.fromParticipantId} /> →{' '}
                    <Person id={step.toParticipantId} />
                    <strong>{money(step.amountMinor)}</strong>
                  </p>
                  <p className="sb-hint">
                    {s.workingStepWhy(
                      nameOf(step.fromParticipantId),
                      money(step.fromOwedMinor),
                      nameOf(step.toParticipantId),
                      money(step.toOwedMinor),
                    )}
                    {step.toRemainingMinor > 0 &&
                      ` ${s.workingStepLeft(nameOf(step.toParticipantId), money(step.toRemainingMinor))}`}
                    {step.fromRemainingMinor > 0 &&
                      ` ${s.workingStepStillOwes(nameOf(step.fromParticipantId), money(step.fromRemainingMinor))}`}
                  </p>
                </li>
              ))}
            </ol>
          </details>

          <h3>{s.breakdownHeading}</h3>
          <div className="sb-table-wrap">
            <table className="sb-table">
              <thead>
                <tr>
                  <th scope="col">{s.colName}</th>
                  <th scope="col">{s.colWeight}</th>
                  <th scope="col">{s.colBurden}</th>
                  <th scope="col">{s.colPaid}</th>
                  <th scope="col">{s.colBalance}</th>
                </tr>
              </thead>
              <tbody>
                {state.participants.map((participant) => {
                  const r = result.participantResults.find(
                    (x) => x.participantId === participant.id,
                  );
                  if (!r) {
                    return null;
                  }
                  return (
                    <tr key={participant.id}>
                      <th scope="row">{participant.name}</th>
                      <td>{participant.weight}</td>
                      <td>{money(r.burdenMinor)}</td>
                      <td>{money(r.paidMinor)}</td>
                      {/* Worded, not just coloured: the sign of a number is a
                          poor place to hide the difference between owing and
                          being owed. */}
                      <td>
                        {r.balanceMinor > 0
                          ? `${s.receive} ${money(r.balanceMinor)}`
                          : r.balanceMinor < 0
                            ? `${s.pay} ${money(-r.balanceMinor)}`
                            : s.settled}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* One block per person, listing every cost — including the ones
              they carry none of. Someone handed a figure wants to check what
              is inside it, and an omitted line asks them to notice a gap. */}
          <h3>{s.statementsHeading}</h3>
          <p className="sb-hint">{s.statementsHint}</p>
          <div className="sb-statements">
            {state.participants.map((participant) => {
              const r = result.participantResults.find(
                (x) => x.participantId === participant.id,
              );
              if (!r) {
                return null;
              }
              return (
                <details key={participant.id} className="sb-statement">
                  <summary>
                    <Person id={participant.id} />
                    <span className="sb-hint">
                      {s.statementBurdenTotal} {money(r.burdenMinor)}
                    </span>
                  </summary>
                  <ul className="sb-statement-items">
                    {statementFor(breakdowns, participant.id).map((item) => (
                      <li
                        key={item.expense.id}
                        className={
                          item.amountMinor === null ? 'sb-not-shared' : ''
                        }
                      >
                        <span>
                          <span className="sb-item-name">
                            {item.expense.description || s.amount}
                          </span>
                          <span className="sb-hint">
                            {' '}
                            {money(item.expense.amountMinor)}
                            {item.amountMinor !== null &&
                              ` · ${s.statementSplitAmong(item.sharerCount)}`}
                          </span>
                        </span>
                        <strong>
                          {item.amountMinor === null
                            ? s.statementNotShared
                            : money(item.amountMinor)}
                        </strong>
                      </li>
                    ))}
                  </ul>
                  <p className="sb-statement-total">
                    <span>{s.statementBurdenTotal}</span>
                    <strong>{money(r.burdenMinor)}</strong>
                  </p>
                  <p className="sb-statement-total">
                    <span>{s.statementPaidTotal}</span>
                    <strong>{money(r.paidMinor)}</strong>
                  </p>
                  <p className="sb-statement-total">
                    <span>{s.colBalance}</span>
                    <strong>
                      {r.balanceMinor > 0
                        ? `${s.receive} ${money(r.balanceMinor)}`
                        : r.balanceMinor < 0
                          ? `${s.pay} ${money(-r.balanceMinor)}`
                          : s.settled}
                    </strong>
                  </p>
                </details>
              );
            })}
          </div>

          <details className="sb-details">
            <summary>{s.detailsHeading}</summary>
            <ul className="sb-expense-list">
              {state.expenses.map((expense) => (
                <li key={expense.id}>
                  <span>{nameOf(expense.payerId)}</span>
                  <span>{expense.description}</span>
                  <strong>{money(expense.amountMinor)}</strong>
                </li>
              ))}
            </ul>
          </details>

          <div className="sb-actions">
            <button
              type="button"
              className="sb-btn sb-btn-primary"
              onClick={() => void copy()}
            >
              {s.copyResult}
            </button>
            <button
              type="button"
              className="sb-btn sb-btn-secondary"
              disabled={imageBusy}
              onClick={() => void makeImage('simple')}
            >
              {imageBusy ? s.imageBuilding : s.createImage}
            </button>
          </div>

          {imageUrl && (
            <div className="sb-image-preview">
              <h3>{s.imagePreviewHeading}</h3>
              {/* Two versions, switched here rather than chosen up front: the
                  difference is easier to judge by looking at it. */}
              <div className="sb-image-variants" role="group">
                <button
                  type="button"
                  className={`sb-btn sb-btn-secondary${imageVariant === 'simple' ? ' sb-selected' : ''}`}
                  aria-pressed={imageVariant === 'simple'}
                  disabled={imageBusy}
                  onClick={() => void makeImage('simple')}
                >
                  {s.imageVariantSimple}
                </button>
                <button
                  type="button"
                  className={`sb-btn sb-btn-secondary${imageVariant === 'detailed' ? ' sb-selected' : ''}`}
                  aria-pressed={imageVariant === 'detailed'}
                  disabled={imageBusy}
                  onClick={() => void makeImage('detailed')}
                >
                  {s.imageVariantDetailed}
                </button>
                <button
                  type="button"
                  className={`sb-btn sb-btn-secondary${imageVariant === 'items' ? ' sb-selected' : ''}`}
                  aria-pressed={imageVariant === 'items'}
                  disabled={imageBusy}
                  onClick={() => void makeImage('items')}
                >
                  {s.imageVariantItems}
                </button>
              </div>
              <img src={imageUrl} alt="" className="sb-image" />
              <div className="sb-actions">
                <button
                  type="button"
                  className="sb-btn sb-btn-primary"
                  onClick={downloadImage}
                >
                  {s.downloadImage}
                </button>
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary"
                  onClick={() => {
                    setImageUrl((previous) => {
                      if (previous) {
                        URL.revokeObjectURL(previous);
                      }
                      return null;
                    });
                    imageBlob.current = null;
                  }}
                >
                  {s.close}
                </button>
              </div>
            </div>
          )}

          {copyFallback && (
            <textarea
              className="sb-fallback"
              readOnly
              rows={10}
              value={copyFallback}
              onFocus={(e) => e.currentTarget.select()}
            />
          )}

          <p className="sb-hint">{s.resultPrivacyNote}</p>
        </section>
      )}

      {removalTarget && (
        <div className="sb-modal" role="dialog" aria-modal="true">
          <div className="sb-modal-body">
            <p>
              {s.removeWithExpenses(removalTarget.name, removalExpenseCount)}
            </p>
            <div className="sb-actions">
              <button
                type="button"
                className="sb-btn sb-btn-primary"
                onClick={() => {
                  dispatch({
                    type: 'remove_participant',
                    id: removalTarget.id,
                    withExpenses: true,
                  });
                  setPendingRemoval(null);
                }}
              >
                {s.removeWithExpensesConfirm}
              </button>
              <button
                type="button"
                className="sb-btn sb-btn-secondary"
                onClick={() => {
                  dispatch({
                    type: 'remove_participant',
                    id: removalTarget.id,
                    withExpenses: false,
                  });
                  setPendingRemoval(null);
                }}
              >
                {s.removeKeepExpenses}
              </button>
              <button
                type="button"
                className="sb-linkbtn"
                onClick={() => setPendingRemoval(null)}
              >
                {s.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="sb-notice" role="status" aria-live="polite">
        {notice}
      </p>

      <ToolGuide guide={t.splitBillGuide} current={TOOL} />
    </main>
  );
}

export default SplitBillTool;
