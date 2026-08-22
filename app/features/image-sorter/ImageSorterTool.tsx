import { useEffect, useReducer, useRef, useState } from 'react';
import { useLocale } from '~/i18n/locale';
import { track } from '~/lib/analytics';
import {
  initialState,
  sortingReducer,
  counts,
  foldersAreValid,
} from './lib/reducer';
import type { ImageItem, SortingFolder } from './lib/types';
import { buildZipEntries } from './lib/zip-entries';
import { createZipBlob } from './lib/zip';
import { Dropzone } from './components/Dropzone';
import { FolderManager } from './components/FolderManager';
import { SortingView } from './components/SortingView';
import { ReviewView } from './components/ReviewView';
import { ToolIntro } from '~/components/tool/ToolIntro';
import { ToolGuide } from '~/components/tool/ToolGuide';
import './image-sorter.css';

// Tagged on every analytics event so GA4 can segment by tool.
const TOOL = 'image-sorter' as const;

type Phase = 'setup' | 'sorting' | 'review';
type Toast = { message: string; onUndo?: () => void };

// Download name with the current date and time, matching the File Renamer
// (e.g. image-sorting_2026-07-27-14-30-05.zip). Time uses '-' because ':' is
// not allowed in file names on Windows.
function zipFileName(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
  const time = `${p(now.getHours())}-${p(now.getMinutes())}-${p(now.getSeconds())}`;
  return `image-sorting_${date}-${time}.zip`;
}

function ImageSorterTool() {
  const { t } = useLocale();
  // Start with two ready-made folders so the user can sort right away. Fixed
  // ids (not random) keep the SSR and client initial state identical.
  const [state, dispatch] = useReducer(sortingReducer, undefined, () => ({
    ...initialState,
    folders: [
      { id: 'folder-1', name: t.imageSorter.newFolderName(1), order: 0 },
      { id: 'folder-2', name: t.imageSorter.newFolderName(2), order: 1 },
    ],
  }));
  const [phase, setPhase] = useState<Phase>('setup');
  const [toast, setToast] = useState<Toast | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [showUnsortedWarning, setShowUnsortedWarning] = useState(false);

  // Revoke every object URL when the tool unmounts to avoid leaks.
  const imagesRef = useRef<ImageItem[]>(state.images);
  imagesRef.current = state.images;
  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, []);

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!toast) {
      return;
    }
    const id = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const showToast = (message: string, onUndo?: () => void) =>
    setToast({ message, onUndo });

  const addImages = (files: File[], rejectedCount: number) => {
    const items: ImageItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      mimeType: file.type,
      previewUrl: URL.createObjectURL(file),
      folderId: null,
      error: false,
    }));
    if (items.length > 0) {
      dispatch({ type: 'add_images', items });
      track('files_added', { tool: TOOL, file_count: items.length });
    }
    if (rejectedCount > 0) {
      showToast(t.imageSorter.nonImageSkipped(rejectedCount));
    }
  };

  const removeImage = (imageId: string) => {
    const image = state.images.find((i) => i.id === imageId);
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
    }
    dispatch({ type: 'remove_image', imageId });
  };

  const addFolder = () => {
    dispatch({
      type: 'add_folder',
      id: crypto.randomUUID(),
      name: t.imageSorter.newFolderName(state.folders.length + 1),
    });
  };

  const requestDeleteFolder = (folder: SortingFolder) => {
    const count = state.images.filter((i) => i.folderId === folder.id).length;
    if (
      count > 0 &&
      !window.confirm(t.imageSorter.deleteFolderConfirm(folder.name, count))
    ) {
      return;
    }
    dispatch({ type: 'remove_folder', folderId: folder.id });
  };

  const startSorting = () => {
    // Begin at the first unsorted image so returning to setup and back resumes.
    const firstUnsorted = state.images.findIndex((i) => i.folderId === null);
    dispatch({
      type: 'set_index',
      index: firstUnsorted < 0 ? 0 : firstUnsorted,
    });
    setPhase('sorting');
  };

  const folderNameOf = (folderId: string) =>
    state.folders.find((b) => b.id === folderId)?.name ?? '';

  // Remembers the folder used for the most recent sort, so Space can repeat it.
  const lastFolderId = useRef<string | null>(null);

  const handleSort = (folderId: string) => {
    lastFolderId.current = folderId;
    dispatch({ type: 'sort_current', folderId });
    showToast(t.imageSorter.sortedToast(folderNameOf(folderId)), () =>
      dispatch({ type: 'undo' }),
    );
  };

  const handleRepeatLast = () => {
    const id = lastFolderId.current;
    if (id && state.folders.some((f) => f.id === id)) {
      handleSort(id);
    }
  };

  const handleUndo = () => {
    dispatch({ type: 'undo' });
    showToast(t.imageSorter.undoneToast);
  };

  const handleMove = (imageIds: string[], folderId: string | null) => {
    dispatch({ type: 'move_images', imageIds, folderId });
    const name = folderId
      ? folderNameOf(folderId)
      : t.imageSorter.unsortedLabel;
    showToast(t.imageSorter.moveDone(name, imageIds.length), () =>
      dispatch({ type: 'undo' }),
    );
  };

  const generateZip = async (includeUnsorted = false) => {
    setShowUnsortedWarning(false);
    setIsZipping(true);
    setZipError(null);
    try {
      const entries = buildZipEntries(state.images, state.folders, {
        includeUnsorted,
        unsortedFolderName: t.imageSorter.unsortedLabel,
      });
      const blob = await createZipBlob(entries);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = zipFileName(new Date());
      anchor.click();
      URL.revokeObjectURL(url);
      track('download_completed', { tool: TOOL, file_count: entries.length });
    } catch (error) {
      setZipError(
        t.imageSorter.zipFailed(
          error instanceof Error ? error.message : String(error),
        ),
      );
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownload = () => {
    if (counts(state).unsorted > 0) {
      setShowUnsortedWarning(true);
      return;
    }
    void generateZip();
  };

  return (
    <main className="is-root">
      <ToolIntro
        heading={t.imageSorterPage.heading}
        lead={t.imageSorterPage.lead}
        privacyNote={t.imageSorterPage.privacyNote}
      />

      {phase === 'setup' && (
        <>
          <section className="is-section">
            <h2>{t.imageSorterPage.steps.add}</h2>
            <Dropzone onFiles={addImages} />
            <p className="is-hint" style={{ marginTop: '0.5rem' }}>
              {t.imageSorterPage.supportedFormats}
            </p>
            {state.images.length > 0 && (
              <p className="is-added" role="status">
                {t.imageSorter.imagesAdded(state.images.length)}
              </p>
            )}
          </section>

          <section className="is-section">
            <h2>{t.imageSorterPage.steps.folders}</h2>
            <FolderManager
              state={state}
              onAdd={addFolder}
              onRename={(folderId, name) =>
                dispatch({ type: 'rename_folder', folderId, name })
              }
              onRequestDelete={requestDeleteFolder}
            />
          </section>

          <div className="is-actions">
            <button
              type="button"
              className="is-btn"
              onClick={startSorting}
              disabled={!foldersAreValid(state)}
            >
              {t.imageSorter.startSorting}
            </button>
            {state.images.length === 0 && (
              <span className="is-hint">{t.imageSorter.needImages}</span>
            )}
            {state.images.length > 0 && state.folders.length === 0 && (
              <span className="is-hint">{t.imageSorter.needFolders}</span>
            )}
          </div>
        </>
      )}

      {phase === 'sorting' && (
        <section
          className="is-section"
          aria-label={t.imageSorterPage.steps.sort}
        >
          <SortingView
            state={state}
            onSort={handleSort}
            onRepeatLast={handleRepeatLast}
            onNav={(delta) =>
              dispatch({ type: 'set_index', index: state.currentIndex + delta })
            }
            onUndo={handleUndo}
            onReview={() => setPhase('review')}
            onSkipCurrent={removeImage}
            onImageError={(imageId) =>
              dispatch({ type: 'mark_error', imageId })
            }
          />
          <div className="is-actions">
            <button
              type="button"
              className="is-btn is-btn-secondary"
              onClick={() => setPhase('setup')}
            >
              ← {t.imageSorterPage.steps.folders}
            </button>
          </div>
        </section>
      )}

      {phase === 'review' && (
        <section className="is-section">
          <ReviewView
            state={state}
            onMove={handleMove}
            onBackToSorting={() => setPhase('sorting')}
            onDownload={handleDownload}
            isZipping={isZipping}
            zipError={zipError}
          />
          {showUnsortedWarning && (
            <div
              className="is-warn"
              role="alertdialog"
              aria-label={t.imageSorter.unsortedWarningTitle}
            >
              <h3>{t.imageSorter.unsortedWarningTitle}</h3>
              <p>{t.imageSorter.unsortedWarning(counts(state).unsorted)}</p>
              {/* The two download choices are the actions of this dialog.
                  "Review unsorted" cancels the download, so it is a plain link
                  rather than a button, to signal the different kind of action. */}
              <div className="is-warn-downloads">
                <button
                  type="button"
                  className="is-btn"
                  onClick={() => void generateZip(true)}
                >
                  {t.imageSorter.downloadWithUnsorted}
                </button>
                <button
                  type="button"
                  className="is-btn is-btn-secondary"
                  onClick={() => void generateZip(false)}
                >
                  {t.imageSorter.downloadAnyway}
                </button>
              </div>
              <button
                type="button"
                className="is-linkbtn"
                onClick={() => setShowUnsortedWarning(false)}
              >
                ← {t.imageSorter.reviewUnsorted}
              </button>
            </div>
          )}
        </section>
      )}

      {toast && (
        <div className="is-toast" role="status">
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button
              type="button"
              onClick={() => {
                toast.onUndo?.();
                setToast(null);
              }}
            >
              {t.imageSorter.undo}
            </button>
          )}
        </div>
      )}

      <ToolGuide guide={t.imageSorterGuide} current="image-sorter" />
    </main>
  );
}

export default ImageSorterTool;
