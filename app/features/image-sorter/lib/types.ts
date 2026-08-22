// A loaded image. Images reference their folder by id (never by name) so that
// renaming a folder never breaks the assignment. folderId is null when unsorted.
export type ImageItem = {
  id: string;
  file: File;
  name: string;
  mimeType: string;
  previewUrl: string;
  folderId: string | null;
  error: boolean;
};

// A destination folder. The key number shown to the user is derived from the
// folder order (1-based), not stored, so it always stays consecutive.
export type SortingFolder = {
  id: string;
  name: string;
  order: number;
};

// One undoable operation. Each entry records the previous folder of every image
// it touched, so a single sort or a bulk move can be reverted as one step.
export type HistoryEntry = {
  changes: { imageId: string; from: string | null }[];
  prevIndex: number;
};

export type SortingState = {
  images: ImageItem[];
  folders: SortingFolder[];
  // Index into images for the one-at-a-time sorting view.
  currentIndex: number;
  history: HistoryEntry[];
};

export type SortingAction =
  | { type: 'add_images'; items: ImageItem[] }
  | { type: 'remove_image'; imageId: string }
  | { type: 'mark_error'; imageId: string }
  | { type: 'add_folder'; id: string; name: string }
  | { type: 'rename_folder'; folderId: string; name: string }
  | { type: 'remove_folder'; folderId: string }
  | { type: 'sort_current'; folderId: string }
  | { type: 'set_index'; index: number }
  | { type: 'move_images'; imageIds: string[]; folderId: string | null }
  | { type: 'undo' };
