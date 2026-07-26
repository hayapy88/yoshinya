export const en = {
  site: {
    brand: 'YOSHINYA',
    xUrl: 'https://x.com/yoshinya_com',
    mascotAlt: 'Yoshinyan, the Yoshinya mascot',
  },
  nav: {
    languageLabel: 'Language',
    switchLocale: '日本語',
    switchLocaleTitle: 'このページを日本語で表示',
  },
  home: {
    metaTitle: 'YOSHINYA | A New Handy Tool Every Week',
    metaDescription:
      'A little hassle? Leave it to Yoshinya! A handy tool that solves a small everyday hassle, released every week — free, private, and processed entirely on your device.',
    kicker: 'A new handy tool every week',
    primary: 'A little hassle? Leave it to Yoshinya!',
    supporting:
      'A handy tool that solves a small everyday hassle, released every week.',
    toolsHeading: 'Tools',
    cta: 'Try it for free',
    privacyNote:
      'Every tool runs right in your browser. Files are processed on your device and never sent to an external server.',
  },
  fileRenamerPage: {
    metaTitle: 'Free Bulk File Renamer Online | YOSHINYA',
    metaDescription:
      'Batch-rename files entirely in your browser: reorder them, build a naming rule with prefix, date, and index tokens, then download as a zip. Your files never leave your browser.',
    heading: 'File Renamer by Yoshinya',
    toolName: 'File Renamer by Yoshinya',
    toolDescription: 'Rename multiple files directly in your browser.',
  },
  imageSorterPage: {
    metaTitle: 'Free Image Sorter Online — Sort Photos into Folders | YOSHINYA',
    metaDescription:
      'Sort images into folders fast: view each photo big, press a number to drop it in a folder, then download one organized zip. Everything runs in your browser — your images are never uploaded.',
    heading: 'Image Sorter by Yoshinya',
    toolName: 'Image Sorter by Yoshinya',
    toolDescription:
      'View each image and sort it into a folder by number, then download folders as a zip.',
    intro:
      'View your photos and sort them by number. Create your own folders and save them all as one zip.',
    privacyNote:
      'Images are processed in your browser and never sent to any server.',
    steps: {
      add: '① Add images',
      folders: '② Create folders',
      sort: '③ Sort by number',
    },
    supportedFormats: 'Supported: JPEG, PNG, WebP, GIF, and other images',
  },
  imageSorter: {
    dropzone: 'Drop images here, or click to choose',
    nonImageSkipped: (count: number) =>
      count === 1
        ? '1 non-image file was skipped.'
        : `${count} non-image files were skipped.`,
    imageCount: (n: number) => (n === 1 ? '1 image' : `${n} images`),
    imagesAdded: (n: number) =>
      n === 1 ? '1 image added' : `${n} images added`,
    removeImage: (name: string) => `Remove ${name}`,
    // Folders
    foldersHeading: 'Folders',
    foldersHint:
      'Create a folder for each category you want to sort into. You can rename folders.',
    addFolder: 'Add folder',
    newFolderName: (n: number) => `Folder ${n}`,
    folderNamePlaceholder: 'Folder name',
    renameFolder: (name: string) => `Rename ${name}`,
    deleteFolder: (name: string) => `Delete ${name}`,
    folderNameEmpty: 'Enter a folder name.',
    folderNameDuplicate: 'A folder with this name already exists.',
    deleteFolderConfirm: (name: string, n: number) =>
      `Delete "${name}"? Its ${n} image${n === 1 ? '' : 's'} will move back to unsorted.`,
    startSorting: 'Start sorting',
    needImages: 'Add images to start.',
    needFolders: 'Create at least one folder to start.',
    // Sorting view
    position: (current: number, total: number) => `${current} / ${total}`,
    sortedCount: (n: number) => `Sorted ${n}`,
    remainingCount: (n: number) => `Remaining ${n}`,
    inFolder: (name: string) => `In: ${name}`,
    unsortedLabel: 'Unsorted',
    keyboardHeading: 'Keyboard shortcuts',
    keyNumber: 'Number keys 1–9 — sort into that folder',
    keySpace: 'Space — sort into the same folder as the previous image',
    keyArrows: '← / → — previous / next image',
    keyUndo: 'Backspace or Ctrl/⌘ + Z — undo the last action',
    overNineHint: 'Folders 10 and up: tap the button (no number key).',
    prev: 'Previous',
    next: 'Next',
    undo: 'Undo',
    undoneToast: 'Undone.',
    sortedToast: (name: string) => `Moved to ${name}.`,
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetZoom: 'Reset zoom',
    imageLoadError: 'This image could not be loaded.',
    skipImage: 'Skip this image',
    allSorted: 'All images are sorted.',
    goToReview: 'Review & download',
    backToSorting: 'Back to sorting',
    // Review
    reviewHeading: 'Review',
    filterAll: 'All',
    filterUnsorted: 'Unsorted',
    selectedCount: (n: number) => `${n} selected`,
    selectAll: 'Select all',
    clearSelection: 'Clear selection',
    move: 'Move',
    dragHint: 'Tip: drag selected images onto a folder to move them.',
    moveTo: 'Move to…',
    moveToUnsorted: 'Move to unsorted',
    moveDone: (name: string, n: number) =>
      `Moved ${n} image${n === 1 ? '' : 's'} to ${name}.`,
    emptyFilter: 'No images here yet.',
    // Download
    download: 'Download zip',
    zipping: 'Preparing zip…',
    unsortedWarningTitle: 'Some images are still unsorted',
    unsortedWarning: (n: number) =>
      `${n} image${n === 1 ? '' : 's'} ${n === 1 ? 'is' : 'are'} not sorted into any folder yet. Choose how to download:`,
    downloadAnyway: 'Download without them',
    downloadWithUnsorted: 'Download with an "Unsorted" folder',
    reviewUnsorted: 'Review unsorted',
    noSortedImages: 'Sort at least one image before downloading.',
    zipFailed: (message: string) => `Failed to create the zip: ${message}`,
  },
  footer: {
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    followX: 'Follow on X',
    copyright: (year: number) => `© ${year} YOSHINYA`,
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
    dimensions: 'Dimensions',
    textNumbered: (n: number) => `Text ${n}`,
    separatorNumbered: (n: number) => `Separator ${n}`,
  },
  rule: {
    hint: 'Drag tokens into the rule area below to build the file name',
    placeholder: 'Drop tokens here',
    dropSlotLabel: 'Insertion point',
    extChip: '.ext',
    removeToken: (label: string) => `Remove ${label}`,
    textPlaceholder: 'e.g. campaign',
    textError: (chars: string) =>
      `Contains characters not allowed in file names: ${chars}`,
    formatLabel: 'Format',
    dimensionsFormats: {
      wxh: 'Width × Height (e.g. 1920x1080)',
      w: 'Width only (e.g. 1920)',
      h: 'Height only (e.g. 1080)',
    },
    dimensionsHint:
      'Applies to image files only; other files get no dimensions.',
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
