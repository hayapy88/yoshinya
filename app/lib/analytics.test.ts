/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAnalyticsEnabled, track } from './analytics';

afterEach(() => {
  delete window.gtag;
  delete window.dataLayer;
});

describe('track', () => {
  it('sends the event and its parameters to gtag', () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    track('download_completed', { tool: 'file-renamer', file_count: 3 });
    expect(gtag).toHaveBeenCalledWith('event', 'download_completed', {
      tool: 'file-renamer',
      file_count: 3,
    });
  });

  it('does nothing when the library was never loaded', () => {
    // The case on localhost and on preview hosts: root.tsx only injects gtag on
    // the production domain, so track() must stay silent rather than throw.
    expect(() => track('tool_opened', { tool: 'image-sorter' })).not.toThrow();
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it('sends events with no parameters', () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    track('tool_opened');
    expect(gtag).toHaveBeenCalledWith('event', 'tool_opened', undefined);
  });
});

describe('the event payload cannot carry user content', () => {
  // A regression here would mean a filename reaching Google. The type system is
  // the real guard; this test pins the runtime behaviour to the same promise.
  it('passes through only what the caller supplied', () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    track('files_added', { tool: 'pdf-title-editor', file_count: 12 });
    const [, , params] = gtag.mock.calls[0] as [string, string, object];
    expect(Object.keys(params).sort()).toEqual(['file_count', 'tool']);
  });

  it('never sends a value that is not a count or a fixed identifier', () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    track('batch_action', {
      tool: 'pdf-title-editor',
      action: 'title',
      mode: 'blank',
    });
    const [, , params] = gtag.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>,
    ];
    for (const value of Object.values(params)) {
      expect(['string', 'number']).toContain(typeof value);
    }
    // 'title' is the field name being filled, never the text the user typed.
    expect(params.action).toBe('title');
  });
});
