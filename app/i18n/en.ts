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
    metaTitle: 'Bulk Rename Files - File Renamer by Yoshinya | Free, No Sign-up',
    metaDescription:
      'Batch-rename files entirely in your browser: reorder them, build a naming rule with prefix, date, and index tokens, then download as a zip. Your files never leave your browser.',
    heading: 'File Renamer by Yoshinya',
    toolName: 'File Renamer by Yoshinya',
    toolDescription: 'Rename multiple files directly in your browser.',
  },
  imageSorterPage: {
    metaTitle:
      'Sort Photos into Folders - Image Sorter by Yoshinya | Free, No Sign-up',
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
  pdfTitleEditorPage: {
    metaTitle:
      'Edit PDF Metadata & Author - PDF Title Editor by Yoshinya | Free, No Sign-up',
    metaDescription:
      'Edit PDF titles, authors, subjects, and keywords in your browser. Batch-process multiple PDFs without uploading your files. Free and no sign-up required.',
    heading: 'PDF Title Editor by Yoshinya',
    toolName: 'PDF Title Editor by Yoshinya',
    toolDescription:
      'Change the title stored inside a PDF, not just its filename.',
    lead: 'Does a PDF open with a title that isn’t the one you meant? This tool lets you rewrite the title, author, and other properties stored inside the PDF right here on this page, then download the updated file.',
    privacyNote:
      'Your PDFs are not sent to a server. All processing happens in your browser.',
    badgeFree: 'Free',
    badgeNoSignup: 'No sign-up',
    badgeLocal: 'Processed in your browser',
  },
  pdfTitleEditor: {
    // Input
    addHeading: '① Add PDFs',
    dropzone: 'Drop PDFs here, or click to choose',
    dropzoneHint: 'You can select several at once',
    addMore: '+ Add more PDFs',
    supportedFormats: 'Supported format: .pdf',
    rejectedHeading: 'These files were not added',
    dismiss: 'Dismiss',
    // File cards
    filesHeading: (n: number) => (n === 1 ? '② Edit 1 PDF' : `② Edit ${n} PDFs`),
    pages: (n: number) => (n === 1 ? '1 page' : `${n} pages`),
    currentTitle: 'Current title:',
    noTitle: 'No title set',
    newTitle: 'New PDF title',
    titlePlaceholder: 'e.g. 2026 Annual Report',
    outputFileName: 'Download as',
    outputFileNameHint: 'Leave blank to keep the original filename.',
    otherMetadata: 'Other metadata',
    title: 'Title',
    author: 'Author',
    subject: 'Subject',
    keywords: 'Keywords',
    keywordsPlaceholder: 'report, 2026, finance',
    keywordsHint: 'Separate keywords with commas.',
    createThisOne: 'Create this one',
    changedMarker: 'Changed',
    resetOne: 'Reset',
    removeOne: 'Remove',
    status: {
      loading: 'Reading',
      ready: 'Unchanged',
      modified: 'Modified',
      processing: 'Processing',
      completed: 'Complete',
      warning: 'Warning',
      error: 'Error',
    },
    errors: {
      not_pdf: 'Please select a PDF file.',
      empty_file: 'This file is empty.',
      corrupted: 'This PDF could not be read. The file may be corrupted.',
      encrypted: 'Password-protected PDFs are not supported.',
      signed:
        'This PDF has a digital signature. Editing is disabled because changes may invalidate the signature.',
      file_too_large: 'This file is larger than the 100 MB limit.',
      total_too_large: 'Adding this file would exceed the 500 MB total limit.',
      too_many_files: 'You can work on up to 100 PDFs at a time.',
      out_of_memory:
        'Your browser ran out of memory. Try again with fewer or smaller files.',
      write_failed: 'This PDF could not be saved.',
    },
    // Batch
    batchHeading: 'Apply to every PDF',
    titleFromFileName: 'Use filename as title',
    fileNameFromTitle: 'Use title as filename',
    batchFieldLabel: 'Field',
    batchValueLabel: 'Value',
    batchModeLabel: 'Apply to',
    batchModeAll: 'All files',
    batchModeBlank: 'Blank fields only',
    applyToCount: (n: number) =>
      n === 1 ? 'Apply to 1 file' : `Apply to ${n} files`,
    resetAll: 'Reset all changes',
    removeAll: 'Remove all',
    removeAllConfirm: 'Remove every PDF from the list?',
    // Run
    runHeading: '③ Create and download',
    createAll: 'Create all and download ZIP',
    createAndDownload: 'Create and download PDF',
    processing: (done: number, total: number) =>
      `Processing ${done} of ${total}…`,
    processed: (success: number, failed: number) =>
      failed === 0
        ? `Done — ${success} file${success === 1 ? '' : 's'} created.`
        : `${success} created, ${failed} failed. The successful files were downloaded.`,
    readingFiles: 'Reading PDFs…',
    nothingToDo: 'Nothing to create yet.',
    keptAvailable: (n: number) =>
      n === 1
        ? '1 created PDF stays available until you reload the page.'
        : `${n} created PDFs stay available until you reload the page.`,
    zipFailed: (message: string) => `Failed to create the ZIP: ${message}`,
  },
  pdfTitleEditorGuide: {
    guideHeading: 'Guide',
    whatIsTitle: {
      heading: 'What is a PDF title?',
      body:
        'Every PDF carries a set of document properties inside the file itself, and one of them is the title. Browsers show it in the tab, PDF readers show it in the window and in the document properties dialog, and search engines may use it when the PDF appears in results. It is written when the PDF is created, which is why an exported document often ends up titled after the template, the slide deck, or the original Word file it came from.',
    },
    filenameVsTitle: {
      heading: 'Filename vs PDF title',
      body:
        'These are two different things, and changing one does not change the other. That is the whole reason this tool exists.',
      filenameTerm: 'Filename',
      filenameDefinition:
        'The name your operating system shows, such as proposal.pdf. Renaming the file changes only this.',
      titleTerm: 'PDF title',
      titleDefinition:
        'A value stored inside the PDF. It is what a browser tab displays, and it stays the same no matter how many times you rename the file.',
    },
    howToUse: {
      heading: 'How to use the tool',
      steps: [
        'Drop one or more PDFs onto the area above. They are read in your browser and never uploaded.',
        'The current title of each PDF appears under its filename. Type the new title you want.',
        'Optionally open “Other metadata” to edit the author, subject, and keywords, and change the download filename.',
        'With several PDFs loaded, use “Apply to every PDF” to set the same value everywhere, or to copy filenames into titles in one go.',
        'Press create. A single PDF downloads directly; several download together as a ZIP.',
      ],
    },
    whenUseful: {
      heading: 'When is it useful?',
      cases: [
        'A PDF you publish on your website shows the wrong name in the browser tab.',
        'A quote or invoice exported from a template still carries the template’s title.',
        'Handouts and teaching material need consistent titles before distribution.',
        'PDFs collected from customers or suppliers have inconsistent or missing document properties.',
        'You want the author field cleared before sharing a document outside your organisation.',
      ],
    },
    privacy: {
      heading: 'Privacy and security',
      body:
        'Your PDFs are opened, edited, and rebuilt entirely inside your browser. Nothing is uploaded to a server, no account is required, and closing or reloading the page discards everything. Because the files never leave your device, the tool can be used with confidential documents in workplaces where uploading to an online service is not allowed.',
    },
    faqHeading: 'Frequently asked questions',
    faq: [
      {
        question: 'What is the difference between a PDF filename and title?',
        answer:
          'The filename is what your operating system shows in a folder. The title is stored inside the PDF and is what a browser tab displays. Renaming the file does not touch the title.',
      },
      {
        question: 'Why does a renamed PDF show a different name in the browser tab?',
        answer:
          'Because the browser prefers the title stored inside the document over the filename. If that title was set when the PDF was created, it survives every rename until you edit the metadata itself.',
      },
      {
        question: 'Are my PDFs uploaded to a server?',
        answer:
          'No. The PDF is read and rewritten in your browser using your device’s own memory. No file, filename, or metadata is sent anywhere.',
      },
      {
        question: 'Can I change multiple PDFs at once?',
        answer:
          'Yes. Add as many as you need, edit them individually or apply one value to all of them, then download everything as a single ZIP.',
      },
      {
        question: 'Can I edit a password-protected PDF?',
        answer:
          'No. Encrypted and password-protected PDFs are rejected. Remove the protection in the application that created the file first.',
      },
      {
        question: 'Can I edit a digitally signed PDF?',
        answer:
          'No. Saving a signed PDF would rewrite the byte offsets the signature covers and invalidate it, so editing is blocked when a signature is detected. Detection is best-effort and may occasionally flag a file that only mentions a signature.',
      },
      {
        question: 'Will the tool change the PDF content or image quality?',
        answer:
          'No. Pages, text, and images are carried over untouched and nothing is re-compressed. The saved file may differ in byte structure from the original, because the document is written out again, but what you see is unchanged.',
      },
      {
        question: 'Can I leave the PDF title blank?',
        answer:
          'Yes. Clearing the field and creating the PDF removes the stored title, and the browser falls back to showing the filename.',
      },
    ],
    relatedHeading: 'Related tools',
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
