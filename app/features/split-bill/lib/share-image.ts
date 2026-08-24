// Draws the result as a PNG for sending to the group.
//
// Not a screenshot: a screenshot carries the form, the buttons and whatever
// else happened to be on screen. This is a layout of its own, holding only what
// someone needs in order to pay the right person the right amount.
//
// Everything is drawn from text already formatted by the caller, so the module
// never has to know which language or currency it is working in — and the
// layout arithmetic below can be checked without a canvas.

export type ShareImageInput = {
  title: string;
  date: string;
  total: string;
  summary: string;
  settlementsHeading: string;
  settlements: { from: string; to: string; amount: string }[];
  nothingToSettle: string;
  /**
   * The table of shares and payments, or null for the short version.
   *
   * Two images are wanted for two moments. The short one is what goes into the
   * group chat — who pays whom, and nothing else to scroll past. The long one
   * is for anyone who wants to check the figures. Rather than a flag, the
   * difference is simply whether there is a table to draw.
   */
  breakdown: {
    heading: string;
    columns: string[];
    rows: string[][];
  } | null;
  /**
   * Each person's itemised statement, or null when it is not wanted.
   *
   * The longest of the three, and the one that answers "is the wine I skipped
   * in what you are asking me for?" — which is why the lines a person carries
   * nothing of are in it too.
   */
  statements: {
    heading: string;
    people: {
      name: string;
      total: string;
      items: { label: string; amount: string; carried: boolean }[];
    }[];
  } | null;
  /**
   * Who paid for what. The specification left this out of the image to keep it
   * short, but the same person checking what is inside their share also wants
   * to know whose money went out — so it travels with the itemised version.
   */
  expenses: {
    heading: string;
    rows: { payer: string; label: string; amount: string }[];
  } | null;
  footer: string;
};

export const IMAGE_WIDTH = 1080;

/**
 * As tall as the image may get.
 *
 * Canvases have limits, and Safari's is on total area rather than height: at
 * this width, much beyond here the browser returns a blank image instead of an
 * error. Twenty people against a hundred expenses would ask for something ten
 * times this, so the caller is told to use a shorter version rather than handed
 * an empty file.
 */
export const MAX_IMAGE_HEIGHT = 12000;

export class ImageTooLongError extends Error {
  constructor() {
    super('the image would be taller than a canvas can hold');
    this.name = 'ImageTooLongError';
  }
}

const PAD = 64;
const COLOURS = {
  background: '#fdfbf7',
  text: '#1c1b1f',
  muted: '#6f6b78',
  accent: '#162e64',
  line: '#e0ddd6',
  card: '#ffffff',
};

const FONT = `'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif`;

/**
 * Where everything goes, and how tall the result has to be.
 *
 * Height is worked out rather than fixed: twenty people and nineteen transfers
 * must not run off the bottom, and three people must not sit in a sea of empty
 * space. Shrinking the type to fit a fixed frame would defeat the point of the
 * image, which is to be read on a phone in a group chat.
 */
export function layoutShareImage(input: ShareImageInput) {
  const blocks: { y: number; height: number }[] = [];
  let y = PAD;

  const titleY = y + 52;
  y += 52 + (input.date ? 44 : 0) + 40;

  const totalY = y + 70;
  y += 70 + 34 + 48;

  const settlementsHeadingY = y + 34;
  y += 34 + 20;

  const rowCount = Math.max(input.settlements.length, 1);
  const settlementsY = y;
  const settlementHeight = 96;
  y += rowCount * (settlementHeight + 16);

  const headerHeight = 56;
  const rowHeight = 64;
  let breakdownHeadingY = 0;
  let tableY = 0;
  if (input.breakdown) {
    y += 40;
    breakdownHeadingY = y + 34;
    y += 34 + 24;
    tableY = y;
    y += headerHeight + input.breakdown.rows.length * rowHeight;
  }

  const expenseRowHeight = 46;
  let expensesHeadingY = 0;
  let expensesY = 0;
  if (input.expenses) {
    y += 48;
    expensesHeadingY = y + 34;
    y += 34 + 24;
    expensesY = y;
    y += input.expenses.rows.length * expenseRowHeight;
  }

  const statementHeadingHeight = 34 + 24;
  const statementNameHeight = 48;
  const statementItemHeight = 44;
  const statementGap = 28;
  let statementsHeadingY = 0;
  let statementsY = 0;
  if (input.statements) {
    y += 48;
    statementsHeadingY = y + 34;
    y += statementHeadingHeight;
    statementsY = y;
    for (const person of input.statements.people) {
      y +=
        statementNameHeight +
        person.items.length * statementItemHeight +
        statementGap;
    }
  }

  y += 56;
  const footerY = y + 26;
  y += 26 + PAD;

  return {
    width: IMAGE_WIDTH,
    height: Math.round(y),
    titleY,
    dateY: titleY + 44,
    totalY,
    summaryY: totalY + 34,
    settlementsHeadingY,
    settlementsY,
    settlementHeight,
    breakdownHeadingY,
    tableY,
    headerHeight,
    rowHeight,
    expensesHeadingY,
    expensesY,
    expenseRowHeight,
    statementsHeadingY,
    statementsY,
    statementNameHeight,
    statementItemHeight,
    statementGap,
    footerY,
    blocks,
  };
}

/**
 * Room for each numeric column, from what its widest entry actually needs.
 *
 * Fixed widths were tuned against Japanese and broke the moment the page was
 * English: "Receives JPY 3,386" is far longer than "受取 ￥3,386", and the
 * balance — the one figure in the row that has to read — came out as
 * "Receives JPY …". Currency symbols and thousands separators vary the same
 * way, so the only reliable width is the measured one.
 *
 * When the measurements do not fit, every numeric column is squeezed by the
 * same proportion rather than one being sacrificed, and the name column keeps
 * a floor so names do not vanish either.
 */
export function distributeColumns(
  needed: number[],
  available: number,
  nameNeeded: number,
  nameMin: number,
): { numeric: number[]; name: number } {
  const numericTotal = needed.reduce((sum, width) => sum + width, 0);
  const name = Math.max(
    nameMin,
    Math.min(nameNeeded, available - numericTotal),
  );
  const room = available - name;
  if (numericTotal <= room) {
    return { numeric: needed, name: available - numericTotal };
  }
  const scale = room / numericTotal;
  return { numeric: needed.map((width) => width * scale), name };
}

/** Cuts a string to fit, ending in an ellipsis rather than mid-character. */
export function fitText(
  measure: (text: string) => number,
  text: string,
  maxWidth: number,
): string {
  if (measure(text) <= maxWidth) {
    return text;
  }
  const chars = [...text];
  let low = 0;
  let high = chars.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (measure(chars.slice(0, mid).join('') + '…') <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return chars.slice(0, low).join('') + '…';
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * Renders the image.
 *
 * Nothing external is drawn — no logo file, no avatars — so the canvas is never
 * tainted and the PNG can always be read back out. Web fonts are waited for
 * first: drawing before they arrive silently produces the fallback face.
 */
export async function renderShareImage(input: ShareImageInput): Promise<Blob> {
  const layout = layoutShareImage(input);
  if (layout.height > MAX_IMAGE_HEIGHT) {
    throw new ImageTooLongError();
  }
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('no 2d context');
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  ctx.fillStyle = COLOURS.background;
  ctx.fillRect(0, 0, layout.width, layout.height);

  const measure = (text: string) => ctx.measureText(text).width;
  const right = layout.width - PAD;

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLOURS.text;
  ctx.font = `bold 44px ${FONT}`;
  ctx.fillText(
    fitText(measure, input.title, layout.width - PAD * 2),
    PAD,
    layout.titleY,
  );

  if (input.date) {
    ctx.fillStyle = COLOURS.muted;
    ctx.font = `28px ${FONT}`;
    ctx.fillText(input.date, PAD, layout.dateY);
  }

  ctx.fillStyle = COLOURS.text;
  ctx.font = `bold 64px ${FONT}`;
  ctx.fillText(input.total, PAD, layout.totalY);
  ctx.fillStyle = COLOURS.muted;
  ctx.font = `26px ${FONT}`;
  ctx.fillText(input.summary, PAD, layout.summaryY);

  // The settlements are the reason the image exists, so they are the loudest
  // thing on it — cards, not another table row.
  ctx.fillStyle = COLOURS.text;
  ctx.font = `bold 32px ${FONT}`;
  ctx.fillText(input.settlementsHeading, PAD, layout.settlementsHeadingY);

  if (input.settlements.length === 0) {
    ctx.fillStyle = COLOURS.muted;
    ctx.font = `30px ${FONT}`;
    ctx.fillText(input.nothingToSettle, PAD, layout.settlementsY + 56);
  } else {
    input.settlements.forEach((settlement, index) => {
      const y = layout.settlementsY + index * (layout.settlementHeight + 16);
      ctx.fillStyle = COLOURS.card;
      roundedRect(
        ctx,
        PAD,
        y,
        layout.width - PAD * 2,
        layout.settlementHeight,
        16,
      );
      ctx.fill();
      ctx.strokeStyle = COLOURS.accent;
      ctx.lineWidth = 3;
      roundedRect(
        ctx,
        PAD,
        y,
        layout.width - PAD * 2,
        layout.settlementHeight,
        16,
      );
      ctx.stroke();

      ctx.font = `bold 36px ${FONT}`;
      const amountWidth = measure(settlement.amount);
      ctx.fillStyle = COLOURS.text;
      ctx.textAlign = 'right';
      ctx.fillText(settlement.amount, right - 28, y + 60);

      ctx.textAlign = 'left';
      ctx.font = `34px ${FONT}`;
      const names = `${settlement.from}  →  ${settlement.to}`;
      ctx.fillText(
        fitText(measure, names, layout.width - PAD * 2 - amountWidth - 90),
        PAD + 28,
        y + 60,
      );
    });
  }

  if (input.breakdown) {
    ctx.fillStyle = COLOURS.text;
    ctx.font = `bold 32px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(input.breakdown.heading, PAD, layout.breakdownHeadingY);

    // Measured, not guessed: what a column needs depends on the language and
    // the currency, and both change under the same layout.
    const columnCount = input.breakdown.columns.length;
    const widest = (index: number) => {
      ctx.font = `24px ${FONT}`;
      let max = measure(input.breakdown!.columns[index]);
      ctx.font = `28px ${FONT}`;
      for (const row of input.breakdown!.rows) {
        max = Math.max(max, measure(row[index] ?? ''));
      }
      return max + 28;
    };
    const needed = Array.from({ length: columnCount - 1 }, (_, i) =>
      widest(i + 1),
    );
    const { numeric: widths, name: nameWidth } = distributeColumns(
      needed,
      layout.width - PAD * 2,
      widest(0),
      180,
    );
    // The right edge of each column, which is where its figures end. Column 1
    // ends after the first width, column 2 after the first two, and so on.
    const columnX = (index: number) =>
      index === 0
        ? PAD
        : PAD +
          nameWidth +
          widths.slice(0, index).reduce((sum, w) => sum + w, 0);

    ctx.font = `24px ${FONT}`;
    ctx.fillStyle = COLOURS.muted;
    input.breakdown.columns.forEach((column, index) => {
      ctx.textAlign = index === 0 ? 'left' : 'right';
      ctx.fillText(column, columnX(index), layout.tableY + 36);
    });

    input.breakdown.rows.forEach((row, rowIndex) => {
      const y =
        layout.tableY + layout.headerHeight + rowIndex * layout.rowHeight;
      ctx.strokeStyle = COLOURS.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(right, y);
      ctx.stroke();

      row.forEach((cell, index) => {
        ctx.fillStyle = index === 0 ? COLOURS.text : COLOURS.muted;
        ctx.font = index === 0 ? `bold 28px ${FONT}` : `28px ${FONT}`;
        ctx.textAlign = index === 0 ? 'left' : 'right';
        const maxWidth = index === 0 ? nameWidth - 24 : widths[index - 1] - 16;
        ctx.fillText(fitText(measure, cell, maxWidth), columnX(index), y + 42);
      });
    });
  }

  if (input.expenses) {
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOURS.text;
    ctx.font = `bold 32px ${FONT}`;
    ctx.fillText(input.expenses.heading, PAD, layout.expensesHeadingY);

    input.expenses.rows.forEach((row, index) => {
      const y = layout.expensesY + index * layout.expenseRowHeight;
      ctx.fillStyle = COLOURS.muted;
      ctx.font = `26px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(fitText(measure, row.payer, 240), PAD, y + 30);
      ctx.fillStyle = COLOURS.text;
      ctx.fillText(fitText(measure, row.label, 480), PAD + 260, y + 30);
      ctx.textAlign = 'right';
      ctx.fillText(row.amount, right, y + 30);
    });
  }

  if (input.statements) {
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOURS.text;
    ctx.font = `bold 32px ${FONT}`;
    ctx.fillText(input.statements.heading, PAD, layout.statementsHeadingY);

    let y = layout.statementsY;
    for (const person of input.statements.people) {
      ctx.fillStyle = COLOURS.text;
      ctx.font = `bold 30px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(fitText(measure, person.name, 600), PAD, y + 32);
      ctx.textAlign = 'right';
      ctx.font = `28px ${FONT}`;
      ctx.fillText(person.total, right, y + 32);
      y += layout.statementNameHeight;

      for (const item of person.items) {
        // Lines they carry nothing of are kept, and set apart, because the
        // question being answered is whether something is absent.
        ctx.fillStyle = item.carried ? COLOURS.text : COLOURS.muted;
        ctx.font = item.carried ? `26px ${FONT}` : `italic 26px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.fillText(fitText(measure, item.label, 620), PAD + 24, y + 30);
        ctx.textAlign = 'right';
        ctx.fillText(item.amount, right, y + 30);
        y += layout.statementItemHeight;
      }

      ctx.strokeStyle = COLOURS.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, y + 8);
      ctx.lineTo(right, y + 8);
      ctx.stroke();
      y += layout.statementGap;
    }
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = COLOURS.muted;
  ctx.font = `24px ${FONT}`;
  ctx.fillText(input.footer, PAD, layout.footerY);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('could not encode the image'));
      }
    }, 'image/png');
  });
}
