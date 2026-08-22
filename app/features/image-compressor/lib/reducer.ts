import { withOverride } from './settings';
import {
  DEFAULT_SETTINGS,
  type BulkApplySnapshot,
  type CompressionSettings,
  type ImageErrorCode,
  type ImageItem,
  type ListFilter,
  type RejectedFile,
} from './types';

export type SettingsScope = 'common' | 'image';

export type CompressorState = {
  items: ImageItem[];
  rejected: RejectedFile[];
  common: CompressionSettings;
  currentIndex: number;
  filter: ListFilter;
  /** Whether the settings panel edits the shared settings or only this image. */
  scope: SettingsScope;
  /** Only the most recent bulk apply can be undone. */
  undo: BulkApplySnapshot;
  isZipping: boolean;
};

export const initialState: CompressorState = {
  items: [],
  rejected: [],
  common: { ...DEFAULT_SETTINGS },
  currentIndex: 0,
  filter: 'all',
  scope: 'common',
  undo: null,
  isZipping: false,
};

export type CompressorAction =
  | { type: 'add_files'; items: ImageItem[]; rejected: RejectedFile[] }
  | { type: 'dismiss_rejected'; id: string }
  | { type: 'encode_started'; id: string }
  | {
      type: 'encode_succeeded';
      id: string;
      blob: Blob;
      url: string;
      width: number;
      height: number;
      sourceWidth: number;
      sourceHeight: number;
    }
  | { type: 'encode_failed'; id: string; code: ImageErrorCode }
  | { type: 'select_index'; index: number }
  | { type: 'set_scope'; scope: SettingsScope }
  | { type: 'set_common'; patch: Partial<CompressionSettings> }
  | { type: 'set_current_override'; patch: Partial<CompressionSettings> }
  | { type: 'reset_current_to_common' }
  | {
      type: 'bulk_apply';
      kind: 'quality' | 'all-settings';
      targetIds: string[];
    }
  | { type: 'undo_bulk' }
  | { type: 'apply_to_all' }
  | {
      type: 'release_overrides';
      ids: string[];
      keys: (keyof CompressionSettings)[];
    }
  | { type: 'mark_downloaded'; ids: string[] }
  | { type: 'remove_item'; id: string }
  | { type: 'remove_all' }
  | { type: 'set_filter'; filter: ListFilter }
  | { type: 'set_zipping'; value: boolean };

/**
 * Whether a different setting could plausibly clear this error, which decides
 * both whether the panel stays usable and whether an edit retries the image.
 *
 * A format the browser cannot encode is the case this exists for: the message
 * names another format, so refusing to act on that choice strands the user.
 * Encoding and allocation failures are worth one more attempt at a smaller
 * size. A file that would not decode is not — nothing in the panel changes how
 * it is read, so retrying only flickers through 'processing' back to here.
 */
export function isRecoverableError(code: ImageErrorCode | null): boolean {
  return (
    code === 'format_unsupported' ||
    code === 'encode_failed' ||
    code === 'out_of_memory'
  );
}

/**
 * Settings changed, so the encoded output is stale — but it stays on screen
 * until the replacement arrives.
 *
 * Clearing it made the whole After side and the divider vanish for the length
 * of a re-encode, which while zoomed in reads as the image jumping. Holding the
 * previous result gives continuous feedback and swaps it in place instead.
 * Downloads are gated on processingState, so a stale blob can never be saved.
 */
function invalidate(item: ImageItem): ImageItem {
  if (item.processingState === 'error' && !isRecoverableError(item.errorCode)) {
    return item;
  }
  // The code is cleared with the state: leaving it set would keep the previous
  // message on screen through the retry and past a success.
  return { ...item, processingState: 'queued', errorCode: null };
}

function mapItems(
  state: CompressorState,
  ids: Set<string>,
  update: (item: ImageItem) => ImageItem,
): ImageItem[] {
  return state.items.map((item) => (ids.has(item.id) ? update(item) : item));
}

export function compressorReducer(
  state: CompressorState,
  action: CompressorAction,
): CompressorState {
  switch (action.type) {
    case 'add_files': {
      const items = [...state.items, ...action.items];
      return {
        ...state,
        items,
        rejected: [...state.rejected, ...action.rejected],
        // Adding images invalidates an undo whose targets no longer describe
        // the list the user is looking at.
        undo: null,
      };
    }

    case 'dismiss_rejected':
      return {
        ...state,
        rejected: state.rejected.filter((file) => file.id !== action.id),
      };

    case 'encode_started':
      return {
        ...state,
        items: mapItems(state, new Set([action.id]), (item) => ({
          ...item,
          processingState: 'processing',
        })),
      };

    case 'encode_succeeded':
      return {
        ...state,
        items: mapItems(state, new Set([action.id]), (item) => ({
          ...item,
          outputBlob: action.blob,
          outputUrl: action.url,
          outputWidth: action.width,
          outputHeight: action.height,
          sourceWidth: action.sourceWidth,
          sourceHeight: action.sourceHeight,
          processingState: 'ready',
          errorCode: null,
        })),
      };

    case 'encode_failed':
      return {
        ...state,
        items: mapItems(state, new Set([action.id]), (item) => ({
          ...item,
          processingState: 'error',
          errorCode: action.code,
          outputBlob: null,
          outputUrl: null,
        })),
      };

    case 'select_index':
      return {
        ...state,
        currentIndex: Math.min(
          Math.max(0, action.index),
          Math.max(0, state.items.length - 1),
        ),
      };

    case 'set_scope':
      return { ...state, scope: action.scope };

    case 'set_common': {
      const common = { ...state.common, ...action.patch };
      // Every image whose own settings do not pin the changed fields is
      // affected, so all of them are re-encoded except those that overrode
      // exactly what changed.
      const changed = Object.keys(
        action.patch,
      ) as (keyof CompressionSettings)[];
      const affected = new Set(
        state.items
          .filter((item) =>
            changed.some(
              (key) => (item.settingsOverride ?? {})[key] === undefined,
            ),
          )
          .map((item) => item.id),
      );
      // An override whose value the common setting has just caught up to is no
      // longer a difference, so it is dropped. Editing an image already applies
      // this rule; applying it only there left an image marked as adjusted while
      // identical to the common settings. Pruning cannot change any effective
      // value — it only removes keys that now equal the common one — so nothing
      // needs re-encoding because of it.
      const pruned = state.items.map((item) =>
        item.settingsOverride === null
          ? item
          : {
              ...item,
              settingsOverride: withOverride(common, item.settingsOverride, {}),
            },
      );
      return {
        ...state,
        common,
        items: pruned.map((item) =>
          affected.has(item.id) ? invalidate(item) : item,
        ),
      };
    }

    case 'set_current_override': {
      const current = state.items[state.currentIndex];
      if (!current) {
        return state;
      }
      return {
        ...state,
        items: mapItems(state, new Set([current.id]), (item) =>
          invalidate({
            ...item,
            settingsOverride: withOverride(
              state.common,
              item.settingsOverride,
              action.patch,
            ),
          }),
        ),
      };
    }

    case 'reset_current_to_common': {
      const current = state.items[state.currentIndex];
      if (!current || current.settingsOverride === null) {
        return state;
      }
      return {
        ...state,
        items: mapItems(state, new Set([current.id]), (item) =>
          invalidate({ ...item, settingsOverride: null }),
        ),
      };
    }

    case 'bulk_apply': {
      const current = state.items[state.currentIndex];
      if (!current || action.targetIds.length === 0) {
        return state;
      }
      const targets = new Set(action.targetIds);
      const source = { ...state.common, ...(current.settingsOverride ?? {}) };

      // Captured before the change so undo restores exactly what each image had,
      // including whether it had any override at all.
      const previousOverrides: Record<
        string,
        Partial<CompressionSettings> | null
      > = {};
      for (const item of state.items) {
        if (targets.has(item.id)) {
          previousOverrides[item.id] = item.settingsOverride;
        }
      }

      const patch: Partial<CompressionSettings> =
        action.kind === 'quality' ? { quality: source.quality } : { ...source };

      return {
        ...state,
        items: mapItems(state, targets, (item) =>
          invalidate({
            ...item,
            settingsOverride:
              action.kind === 'quality'
                ? withOverride(state.common, item.settingsOverride, patch)
                : withOverride(state.common, null, patch),
          }),
        ),
        undo: {
          kind: action.kind,
          value: source.quality,
          targetImageIds: action.targetIds,
          previousOverrides,
        },
      };
    }

    // Releases only the fields named, on only the images named, so an image
    // pinned on quality still keeps that pin when its format is released.
    case 'release_overrides': {
      const ids = new Set(action.ids);
      return {
        ...state,
        items: mapItems(state, ids, (item) => {
          if (item.settingsOverride === null) {
            return item;
          }
          const next = { ...item.settingsOverride };
          for (const key of action.keys) {
            delete next[key];
          }
          return invalidate({
            ...item,
            settingsOverride: Object.keys(next).length === 0 ? null : next,
          });
        }),
      };
    }

    // The one action that genuinely reaches every image, including earlier
    // ones, downloaded ones, and ones the user adjusted individually. Kept out
    // of the main flow and behind a confirmation for exactly that reason.
    case 'apply_to_all': {
      const current = state.items[state.currentIndex];
      if (!current) {
        return state;
      }
      const common = { ...state.common, ...(current.settingsOverride ?? {}) };
      return {
        ...state,
        common,
        // Clearing every override is what makes this different from the shared
        // settings: nothing is left pinned to disagree with it.
        items: state.items.map((item) =>
          invalidate({ ...item, settingsOverride: null }),
        ),
        undo: null,
      };
    }

    case 'undo_bulk': {
      const snapshot = state.undo;
      if (!snapshot) {
        return state;
      }
      const targets = new Set(snapshot.targetImageIds);
      return {
        ...state,
        items: mapItems(state, targets, (item) =>
          invalidate({
            ...item,
            settingsOverride: snapshot.previousOverrides[item.id] ?? null,
          }),
        ),
        undo: null,
      };
    }

    case 'mark_downloaded': {
      const ids = new Set(action.ids);
      return {
        ...state,
        items: mapItems(state, ids, (item) => ({ ...item, downloaded: true })),
      };
    }

    case 'remove_item': {
      const index = state.items.findIndex((item) => item.id === action.id);
      if (index < 0) {
        return state;
      }
      const items = state.items.filter((item) => item.id !== action.id);
      return {
        ...state,
        items,
        currentIndex: Math.min(
          state.currentIndex > index
            ? state.currentIndex - 1
            : state.currentIndex,
          Math.max(0, items.length - 1),
        ),
        undo: null,
      };
    }

    case 'remove_all':
      return { ...initialState, common: state.common };

    case 'set_filter':
      return { ...state, filter: action.filter };

    case 'set_zipping':
      return { ...state, isZipping: action.value };

    default:
      return state;
  }
}

export function currentItem(state: CompressorState): ImageItem | undefined {
  return state.items[state.currentIndex];
}

export function downloadableItems(state: CompressorState): ImageItem[] {
  return state.items.filter(
    (item) => item.processingState === 'ready' && item.outputBlob !== null,
  );
}

export function pendingCount(state: CompressorState): number {
  return state.items.filter(
    (item) =>
      item.processingState === 'queued' ||
      item.processingState === 'processing',
  ).length;
}

export function allDownloaded(state: CompressorState): boolean {
  const usable = state.items.filter((item) => item.processingState !== 'error');
  return usable.length > 0 && usable.every((item) => item.downloaded);
}
