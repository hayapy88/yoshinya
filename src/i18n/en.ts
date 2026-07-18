export const en = {
  meta: {
    title: 'File Renamer — Batch rename files in your browser',
    description:
      'Batch-rename files entirely in your browser: reorder them, build a naming rule with prefix, date, and index tokens, then download as a zip. Your files never leave your browser.',
  },
  header: {
    tagline:
      'Rename multiple files at once with a rule you build, then download them as a zip. Your files never leave your browser. All processing happens locally.',
    languageLabel: 'Language',
  },
  steps: {
    upload: '① Upload files',
    rule: '② Build the rename rule',
    preview: '③ Preview new file names',
  },
  upload: {
    dropzone: 'Drop files here, or click to choose',
    reorderHint: 'Drag & drop to reorder (this order becomes the index order)',
    thumbSizeLabel: 'Image size',
    thumbSmaller: 'Make preview images smaller',
    thumbLarger: 'Make preview images larger',
    removeFile: (name: string) => `Remove ${name}`,
    openPreview: (name: string) => `Show a larger preview of ${name}`,
    closePreview: 'Close the preview',
  },
  tokens: {
    text: 'Text',
    separator: 'Separator',
    date: 'Date',
    time: 'Time',
    index: 'Index',
    textNumbered: (n: number) => `Text ${n}`,
    separatorNumbered: (n: number) => `Separator ${n}`,
  },
  rule: {
    hint: 'Drag tokens into the rule area below to build the file name',
    placeholder: 'Drop tokens here',
    extChip: '.ext',
    removeToken: (label: string) => `Remove ${label}`,
    textPlaceholder: 'e.g. trip',
    textError: (chars: string) =>
      `Contains characters not allowed in file names: ${chars}`,
    formatLabel: 'Format',
    dateSourceLabel: 'Date source',
    timeSourceLabel: 'Time source',
    pickDate: 'Pick a date',
    pickTime: 'Pick a time',
    useFileModified: 'Use file modified time',
    chooseDate: 'Choose a date',
    chooseTime: 'Choose a time',
    separatorOptions: {
      underscore: '_ (underscore)',
      hyphen: '- (hyphen)',
      dot: '. (dot)',
    },
    indexStyles: {
      num1: 'Numeric, 1 digit (1, 2, 3...)',
      num2: 'Numeric, 2 digits (01, 02...)',
      num3: 'Numeric, 3 digits (001, 002...)',
      alphaLower: 'Lowercase letters (a, b, c...)',
      alphaUpper: 'Uppercase letters (A, B, C...)',
    },
  },
  preview: {
    addFilesGuide: 'Add files to see the preview',
    buildRuleGuide: 'Build a rename rule to see the preview',
    duplicateNotice:
      '⚠ Duplicate file names will occur. Add an index token or adjust the rule so every name is unique.',
    originalName: 'Original name',
    newName: 'New name',
    duplicate: 'Duplicate',
  },
  download: {
    confirm: 'Confirm and download',
    zipping: 'Generating zip…',
    needFiles: 'Add files to enable the download',
    needRule: 'Build a rename rule to enable the download',
    fixTextErrors: 'Fix the errors in the text fields',
    duplicatesBlock:
      'Duplicate file names must be resolved before downloading',
    zipFailed: (message: string) => `Failed to generate the zip: ${message}`,
  },
}
