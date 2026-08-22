import type { ImageItem, SortingFolder } from './types';
import { sanitizeFolderName, uniquifyName } from './sanitize';

export type ZipEntry = {
  path: string; // "<folder>/<filename>"
  file: File;
};

// Builds the ZIP file layout: one folder per non-empty folder, in folder order.
//
// Design choices (documented per the spec):
// - Empty folders are omitted; a ZIP of empty folders is not useful and many
//   unzip tools drop them anyway.
// - Unsorted images are never added to a folder automatically; they are only
//   included when the caller explicitly opts in (they get an "Unsorted" folder).
// - Folder folder names are sanitized and made unique so two folders can never
//   collapse onto the same folder, and file names are made unique within each
//   folder so no image is silently lost to a name clash.
export function buildZipEntries(
  images: ImageItem[],
  folders: SortingFolder[],
  options: { includeUnsorted?: boolean; unsortedFolderName?: string } = {},
): ZipEntry[] {
  const entries: ZipEntry[] = [];
  const usedFolders = new Set<string>();

  const groups: { name: string; items: ImageItem[] }[] = [...folders]
    .sort((a, b) => a.order - b.order)
    .map((folder) => ({
      name: folder.name,
      items: images.filter(
        (image) => image.folderId === folder.id && !image.error,
      ),
    }));

  if (options.includeUnsorted) {
    groups.push({
      name: options.unsortedFolderName ?? 'Unsorted',
      items: images.filter((image) => image.folderId === null && !image.error),
    });
  }

  for (const group of groups) {
    if (group.items.length === 0) {
      continue;
    }
    const folder = uniquifyName(sanitizeFolderName(group.name), usedFolders);
    const usedNames = new Set<string>();
    for (const item of group.items) {
      const fileName = uniquifyName(item.name, usedNames);
      entries.push({ path: `${folder}/${fileName}`, file: item.file });
    }
  }

  return entries;
}
