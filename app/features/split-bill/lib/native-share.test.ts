import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShareFile, shareFile, toShareFile } from './native-share';

const file = () => toShareFile(new Blob(['x'], { type: 'image/png' }));

/** Stands in for a device with a given level of support. */
function stubNavigator(options: {
  share?: (data: unknown) => Promise<void>;
  canShare?: (data: unknown) => boolean;
}) {
  vi.stubGlobal('navigator', options);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('canShareFile', () => {
  it('accepts a device that will take files', () => {
    stubNavigator({ share: async () => {}, canShare: () => true });
    expect(canShareFile(file())).toBe(true);
  });

  // The case that makes asking necessary: sharing exists, files do not.
  it('refuses a device that shares but not files', () => {
    stubNavigator({ share: async () => {}, canShare: () => false });
    expect(canShareFile(file())).toBe(false);
  });

  it('refuses a device with no sharing at all', () => {
    stubNavigator({});
    expect(canShareFile(file())).toBe(false);
  });

  it('treats a throwing check as a no', () => {
    stubNavigator({
      share: async () => {},
      canShare: () => {
        throw new Error('nope');
      },
    });
    expect(canShareFile(file())).toBe(false);
  });
});

describe('shareFile', () => {
  it('reports a completed share', async () => {
    stubNavigator({ share: async () => {}, canShare: () => true });
    expect(await shareFile(file())).toBe('shared');
  });

  // Closing the sheet is a decision, not a fault. Reporting it as a failure
  // would tell someone their deliberate cancellation went wrong.
  it('separates a cancelled share from a failed one', async () => {
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    stubNavigator({
      share: async () => {
        throw abort;
      },
      canShare: () => true,
    });
    expect(await shareFile(file())).toBe('cancelled');
  });

  it('reports a genuine failure', async () => {
    stubNavigator({
      share: async () => {
        throw new Error('something broke');
      },
      canShare: () => true,
    });
    expect(await shareFile(file())).toBe('failed');
  });

  it('says so rather than throwing when the device cannot', async () => {
    stubNavigator({});
    expect(await shareFile(file())).toBe('unsupported');
  });

  // Reported from an iPhone: with text in the payload, the share sheet's Copy
  // action put "合計 ¥9,000" on the clipboard instead of the picture.
  it('sends the image on its own, with no text to be copied instead', async () => {
    const seen: Record<string, unknown>[] = [];
    stubNavigator({
      canShare: () => true,
      share: async (data) => {
        seen.push(data as Record<string, unknown>);
      },
    });
    await shareFile(file());
    expect(Object.keys(seen[0])).toEqual(['files']);
    expect((seen[0].files as File[])[0].name).toBe('warikan-result.png');
  });
});

describe('toShareFile', () => {
  it('names the file so it arrives as something recognisable', () => {
    const shared = toShareFile(new Blob(['x'], { type: 'image/png' }));
    expect(shared.name).toBe('warikan-result.png');
    expect(shared.type).toBe('image/png');
  });
});
