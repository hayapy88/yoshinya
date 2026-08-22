export type DateFormat = 'yyyy-mm-dd' | 'yyyymmdd' | 'yyyy-mm' | 'yyyymm';
export type TimeFormat = 'hh-mm-ss' | 'hh-mm';
// Time separators use '-' instead of ':' (':' is not allowed in Windows file names).

export type DateTimeSource = 'fixed' | 'fileModified';
// fixed: a date/time the user picked (shared by all files)
// fileModified: each file's last-modified time (differs per file)

export type IndexStyle =
  | { type: 'numeric'; padding: 1 | 2 | 3 } // 1 / 01 / 001
  | { type: 'alpha'; letterCase: 'lower' | 'upper' }; // a, b, ... / A, B, ...

// Image pixel dimensions. 'wxh' -> 1920x1080, 'w' -> 1920, 'h' -> 1080.
export type DimensionsFormat = 'wxh' | 'w' | 'h';

export type RenameToken =
  | { id: string; kind: 'text'; value: string }
  | { id: string; kind: 'separator'; char: string } // default '_'
  | {
      id: string;
      kind: 'date';
      format: DateFormat;
      source: DateTimeSource;
      fixedDate?: string; // when source='fixed': ISO string 'yyyy-mm-dd'
    }
  | {
      id: string;
      kind: 'time';
      format: TimeFormat;
      source: DateTimeSource;
      fixedTime?: string; // when source='fixed': 'hh:mm' or 'hh:mm:ss'
    }
  | { id: string; kind: 'index'; style: IndexStyle; start: number } // start defaults to 1
  | { id: string; kind: 'dimensions'; format: DimensionsFormat };

export type RenameInput = {
  originalName: string;
  lastModified: number; // File.lastModified (epoch ms) passed as-is
  // Image pixel dimensions, when the file is an image and they have loaded.
  // Undefined for non-images or before dimensions are known.
  width?: number;
  height?: number;
};

export type RenameResult = {
  originalName: string;
  newName: string; // including the extension
  isDuplicate: boolean; // true when the same name appears in the results
};
