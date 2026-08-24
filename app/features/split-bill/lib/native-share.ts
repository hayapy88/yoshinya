// Handing the image to whatever the device uses for sharing.
//
// Support is patchy and has to be asked about rather than assumed: some
// browsers have `share` but refuse files, and a desktop browser may have
// neither. The answer also depends on the file itself, so it is asked with the
// real one rather than a guess.

export const IMAGE_FILE_NAME = 'warikan-result.png';

export type ShareOutcome = 'shared' | 'cancelled' | 'unsupported' | 'failed';

type ShareCapableNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
};

export function toShareFile(blob: Blob): File {
  return new File([blob], IMAGE_FILE_NAME, { type: 'image/png' });
}

/**
 * Whether this device can be handed this file.
 *
 * Three separate things have to be true, and a browser can have the first two
 * without the third: `canShare({ files })` is the only one that answers the
 * question actually being asked.
 */
export function canShareFile(file: File): boolean {
  const nav = navigator as ShareCapableNavigator;
  if (typeof nav.share !== 'function' || typeof nav.canShare !== 'function') {
    return false;
  }
  try {
    return nav.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Opens the share sheet with the image and nothing else.
 *
 * Sending text alongside the file looks helpful and is not: iOS offers a Copy
 * action that takes one of whatever it was given, and with any text present it
 * takes the text — so someone pressing Copy after "share the image" ended up
 * with "合計 ¥9,000" on their clipboard and no picture. The image already says
 * everything the text would have, so it travels alone.
 *
 * Closing the sheet rejects with an AbortError, and that is a decision rather
 * than a fault — reporting it as a failure would tell someone their deliberate
 * cancellation went wrong. It is separated here so the caller can stay quiet
 * about it.
 *
 * Must be called straight from a click: browsers refuse a share that is not
 * plainly a response to something the user did.
 */
export async function shareFile(file: File): Promise<ShareOutcome> {
  if (!canShareFile(file)) {
    return 'unsupported';
  }
  try {
    await (navigator as ShareCapableNavigator).share!({ files: [file] });
    return 'shared';
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return 'cancelled';
    }
    return 'failed';
  }
}
