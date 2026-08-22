export type OutputFormat = 'original' | 'jpeg' | 'png' | 'webp'

// The formats a browser canvas can reliably encode. AVIF is out of scope.
export type EncodableFormat = Exclude<OutputFormat, 'original'>

export type CompressionSettings = {
  outputFormat: OutputFormat
  quality: number
  resizeEnabled: boolean
  width: number | null
  height: number | null
  keepAspectRatio: boolean
  preventUpscale: boolean
  jpegBackground: string
  /**
   * PNG's own compression is lossless and already applied, so the only way to
   * make a PNG smaller is to store fewer colours. On by default: a compressor
   * that reliably enlarges the file is the bug this exists to fix, and 256
   * colours is the mildest setting there is.
   */
  pngReduce: boolean
  pngColors: number
  pngDither: boolean
}

export type ProcessingState = 'queued' | 'processing' | 'ready' | 'error'

export type ImageErrorCode =
  | 'unsupported_type'
  | 'empty_file'
  | 'file_too_large'
  | 'total_too_large'
  | 'too_many_files'
  | 'decode_failed'
  | 'encode_failed'
  | 'format_unsupported'
  | 'out_of_memory'

export type ImageItem = {
  id: string
  sourceFile: File
  sourceUrl: string
  sourceType: string
  sourceWidth: number | null
  sourceHeight: number | null
  outputBlob: Blob | null
  outputUrl: string | null
  outputWidth: number | null
  outputHeight: number | null
  // null means "follows the common settings". A partial override keeps the
  // fields the user did not touch tracking the common settings.
  settingsOverride: Partial<CompressionSettings> | null
  processingState: ProcessingState
  // Independent of processingState: an image can be downloaded and then edited
  // again, so this cannot be folded into a single status.
  downloaded: boolean
  errorCode: ImageErrorCode | null
}

// Restores what a bulk apply overwrote. Holds settings, never blobs — the
// outputs are regenerated from the restored settings.
export type BulkApplySnapshot = {
  kind: 'quality' | 'all-settings'
  value: number
  targetImageIds: string[]
  previousOverrides: Record<string, Partial<CompressionSettings> | null>
} | null

export type RejectedFile = {
  id: string
  name: string
  errorCode: ImageErrorCode
}

export type ListFilter =
  'all' | 'not-downloaded' | 'customized' | 'downloaded' | 'error'

// Only formats the browser is asked to decode. HEIC, SVG, GIF and RAW are out
// of scope for the MVP.
export const SUPPORTED_INPUT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const DEFAULT_SETTINGS: CompressionSettings = {
  outputFormat: 'original',
  quality: 80,
  resizeEnabled: false,
  width: null,
  height: null,
  keepAspectRatio: true,
  preventUpscale: true,
  jpegBackground: '#ffffff',
  pngReduce: true,
  pngColors: 256,
  pngDither: true,
}

// Starting points, to be revisited against real devices. Exceeding one of these
// rejects the individual file rather than failing the whole drop.
export const LIMITS = {
  maxFiles: 100,
  maxFileBytes: 30 * 1024 * 1024,
  maxTotalBytes: 300 * 1024 * 1024,
  // Encoding is memory-hungry; a couple at a time keeps a large batch from
  // exhausting the tab while still using the time spent waiting on decode.
  concurrency: 2,
  // Settings move continuously (sliders), so re-encoding waits for a pause.
  settingsDebounceMs: 250,
} as const
