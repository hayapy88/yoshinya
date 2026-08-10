export const en = {
  site: {
    brand: 'YOSHINYA',
    xUrl: 'https://x.com/yoshinya_com',
    mascotAlt: 'Yoshinyan, the Yoshinya mascot',
  },
  // The three promises shown on every tool page. Shared so no tool words
  // the product's core claim differently.
  toolBadges: {
    free: 'Free',
    noSignup: 'No sign-up',
    local: 'Processed in your browser',
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
    lead: 'Renaming files one at a time is slow, and a good naming rule is easy to get wrong by hand. Build the rule once — prefix, date, index — see every new name before you commit, then download the whole batch as a zip.',
    privacyNote:
      'Your files are not sent to a server. All processing happens in your browser.',
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
    lead:
      'View your photos and sort them by number. Create your own folders and save them all as one zip.',
    privacyNote:
      'Your images are not sent to a server. All processing happens in your browser.',
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
  fileRenamerGuide: {
    heading: 'Guide',
    sections: [
      {
        heading: 'How to use the tool',
        steps: [
          'Drop your files onto the upload area, or click to choose them. They are read in your browser and never uploaded.',
          'Drag the files into the order you want. That order becomes the numbering order for the index token.',
          'Drag tokens into the rule area to build the new name: Text, Separator, Date, Time, Index, and Dimensions.',
          'Check the preview. Every file shows its old name beside its new one, and duplicates are flagged before you download anything.',
          'Press *Confirm and download*. The renamed files download together as a single zip.',
        ],
      },
      {
        heading: 'When is it useful?',
        items: [
          'Photos straight off a camera or phone all carry names like DSC_0431.JPG that say nothing about what they show.',
          'Files for a client or a marketplace have to follow a naming convention exactly.',
          'A folder of scans or receipts needs dating and numbering before it is filed.',
          'Assets for a website need consistent, predictable names before they are uploaded.',
          'Someone sent you a batch of files whose names are a mess and you would rather not fix them one at a time.',
        ],
      },
      {
        heading: 'Privacy and security',
        body:
          'Your files are read and renamed entirely inside your browser. Nothing is uploaded to a server, no account is required, and closing or reloading the page discards everything. Because the files never leave your device, the tool can be used with confidential material in workplaces where uploading to an online service is not allowed.',
      },
    ],
    faqHeading: 'Frequently asked questions',
    faq: [
      {
        question: 'Are my files uploaded to a server?',
        answer:
          'No. The files are read and the zip is built in your browser using your own device. No file or filename is sent anywhere.',
      },
      {
        question: 'Does it change the original files?',
        answer:
          'No. The originals on your disk are left untouched. The tool produces a new zip containing renamed copies.',
      },
      {
        question: 'How many files can I rename at once?',
        answer:
          'There is no fixed limit; the practical ceiling is your browser’s memory. Hundreds of ordinary documents are fine, and very large media files are best done in smaller batches.',
      },
      {
        question: 'What happens to file extensions?',
        answer:
          'They are preserved. A rule is applied to the name only, so report.pdf becomes something like 2026-04-01_report_01.pdf.',
      },
      {
        question: 'What if two files end up with the same name?',
        answer:
          'The preview warns you and *Confirm and download* stays disabled until it is resolved. Adding an Index token gives every file a unique number.',
      },
      {
        question: 'Can I control the order of the numbering?',
        answer:
          'Yes. Drag the files into the order you want before adding an Index token — the list order is the numbering order.',
      },
    ],
    relatedHeading: 'Related tools',
  },
  imageSorterGuide: {
    heading: 'Guide',
    sections: [
      {
        heading: 'How to use the tool',
        steps: [
          'Drop your images onto the upload area. They are read in your browser and never uploaded.',
          'Create a folder for each category you want to sort into, and name them. Two are ready to start with.',
          'Press *Start sorting*. Each image is shown large, one at a time.',
          'Press a number key to file the image into that folder and move to the next unsorted image. Space repeats the previous folder, and Backspace undoes.',
          'Open *Review & download*, move anything that landed in the wrong place, then press *Download zip*.',
        ],
      },
      {
        heading: 'When is it useful?',
        items: [
          'Product photos need splitting into main shots, detail shots, and rejects before they go on a marketplace.',
          'A shoot has to be triaged into keep, hold, and discard.',
          'Property or travel photos need grouping by room, building, or city.',
          'Screenshots have piled up and need filing by feature or by report.',
          'Any pile of images that would otherwise mean opening each one and dragging it to a folder.',
        ],
      },
      {
        heading: 'Privacy and security',
        body:
          'Your images are read, grouped, and packed into a zip entirely inside your browser. Nothing is uploaded to a server, no account is required, and closing or reloading the page discards everything. Because the images never leave your device, the tool can be used with confidential or personal photos.',
      },
    ],
    faqHeading: 'Frequently asked questions',
    faq: [
      {
        question: 'Are my images uploaded to a server?',
        answer:
          'No. Every image is read and packed into the zip in your browser using your own device. No image or filename is sent anywhere.',
      },
      {
        question: 'Does the tool change or recompress my images?',
        answer:
          'No. Each image is copied into the zip byte for byte. Quality, size, and metadata are exactly as they were.',
      },
      {
        question: 'What do I get when I download?',
        answer:
          'A single zip with one folder per category you created. Filenames are kept as they were — a number is added only when two images in the same folder share a name, so neither is lost. Folders you filed nothing into are left out.',
      },
      {
        question: 'Can I sort with the keyboard only?',
        answer:
          'Yes, and it is the fastest way. Number keys 1–9 file into that folder, Space repeats the previous folder, the arrow keys move between images, and Backspace or Ctrl/⌘ + Z undoes.',
      },
      {
        question: 'What if I have more than nine folders?',
        answer:
          'Folders beyond the ninth are sorted by tapping or clicking their button; only the first nine have number-key shortcuts.',
      },
      {
        question: 'What happens to images I did not sort?',
        answer:
          'You are asked before downloading. You can leave them out, or include them in an "Unsorted" folder so nothing is lost.',
      },
    ],
    relatedHeading: 'Related tools',
  },
  pdfTitleEditorGuide: {
    heading: 'Guide',
    sections: [
      {
        heading: 'What is a PDF title?',
        body:
          'Every PDF carries a set of document properties inside the file itself, and one of them is the title. Browsers show it in the tab, PDF readers show it in the window and in the document properties dialog, and search engines may use it when the PDF appears in results. It is written when the PDF is created, which is why an exported document often ends up titled after the template, the slide deck, or the original Word file it came from.',
      },
      {
        heading: 'Filename vs PDF title',
        body:
          'These are two different things, and changing one does not change the other. That is the whole reason this tool exists.',
        terms: [
          {
            term: 'Filename',
            definition:
              'The name your operating system shows, such as proposal.pdf. Renaming the file changes only this.',
          },
          {
            term: 'PDF title',
            definition:
              'A value stored inside the PDF. It is what a browser tab displays, and it stays the same no matter how many times you rename the file.',
          },
        ],
      },
      {
        heading: 'How to use the tool',
        steps: [
          'Drop one or more PDFs onto the area above. They are read in your browser and never uploaded.',
          'The current title of each PDF appears under its filename. Type the new title you want.',
          'Optionally open “Other metadata” to edit the author, subject, and keywords, and change the download filename.',
          'With several PDFs loaded, use “Apply to every PDF” to set the same value everywhere, or to copy filenames into titles in one go.',
          'Press *Create and download PDF* for one file, or *Create all and download ZIP* for several.',
        ],
      },
      {
        heading: 'When is it useful?',
        items: [
          'A PDF you publish on your website shows the wrong name in the browser tab.',
          'A quote or invoice exported from a template still carries the template’s title.',
          'Handouts and teaching material need consistent titles before distribution.',
          'PDFs collected from customers or suppliers have inconsistent or missing document properties.',
          'You want the author field cleared before sharing a document outside your organisation.',
        ],
      },
      {
        heading: 'Privacy and security',
        body:
          'Your PDFs are opened, edited, and rebuilt entirely inside your browser. Nothing is uploaded to a server, no account is required, and closing or reloading the page discards everything. Because the files never leave your device, the tool can be used with confidential documents in workplaces where uploading to an online service is not allowed.',
      },
    ],
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
  imageCompressorPage: {
    metaTitle:
      'Compress Images in Bulk - Batch Image Compressor by Yoshinya | Free, No Sign-up',
    metaDescription:
      'Compress several images at once and compare before and after with a slider before you save. Choose JPEG, PNG or WebP, set the quality, and download one at a time or all as a ZIP. Everything runs in your browser — your images are never uploaded.',
    heading: 'Batch Image Compressor by Yoshinya',
    toolName: 'Batch Image Compressor by Yoshinya',
    toolDescription:
      'Compress multiple images, comparing each result before you save it.',
    lead: 'Ever run images through a bulk compressor and found them more degraded than you expected? Or found that the tools which let you compare before and after only take one file at a time? Batch Image Compressor loads the whole batch at once, so you can compare and adjust each image as you go.',
    privacyNote:
      'Your images are not sent to a server. All processing happens in your browser.',
  },
  imageCompressor: {
    // Input
    dropzone: 'Drop images here, or click to choose',
    supportedFormats: 'JPEG, PNG and WebP · up to 100 images',
    addMore: '+ Add images',
    rejectedHeading: 'These files were not added',
    dismiss: 'Dismiss',
    // List
    listHeading: (n: number) => (n === 1 ? '1 image' : `${n} images`),
    filterLabel: 'Filter the list',
    filters: {
      all: 'All',
      'not-downloaded': 'Not saved',
      customized: 'Adjusted',
      downloaded: 'Saved',
      error: 'Failed',
    },
    emptyFilter: 'Nothing here.',
    removeOne: (name: string) => `Remove ${name}`,
    removeAll: 'Remove all',
    removeAllConfirm: 'Remove every image?',
    stateProcessing: 'Working',
    stateDownloaded: 'Saved',
    stateCustomized: 'Adjusted',
    stateError: 'Failed',
    progress: (done: number, total: number) => `${done} of ${total} saved`,
    provisional: '(still working)',
    // Compare
    beforeLabel: 'Before',
    afterLabel: 'After',
    dividerLabel: 'Comparison position',
    dividerValue: (percent: number) =>
      `${percent}% — left of the line is the original, right is the compressed result`,
    compareHint: 'Drag to compare · drag the image to pan · hold Space to see the original',
    processing: 'Compressing…',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomFit: 'Fit',
    enterFullscreen: 'Full screen',
    exitFullscreen: 'Exit full screen',
    fullscreenHint: 'Esc to exit',
    // Sizes
    beforeSize: (size: string) => `Before: ${size}`,
    afterSize: (size: string) => `After: ${size}`,
    savedBy: (bytes: string, percent: string) => `${bytes} smaller (${percent})`,
    grewBy: (percent: string) => `${percent} larger`,
    grewNote:
      'This setting produces a bigger file than the original. Lower the quality, or keep the original file.',
    // Settings
    settingsHeading: 'Compression',
    scopeLabel: 'These settings apply to',
    scopeCommon: 'Shared settings',
    scopeImage: 'This image only',
    resetToCommon: 'Use the shared settings',
    scopeCommonNote: (n: number) =>
      `${n} adjusted image${n === 1 ? '' : 's'} will not follow this. Open More to overwrite them.`,
    formatLabel: 'Output format',
    formats: {
      original: 'Keep original format',
      jpeg: 'JPEG',
      png: 'PNG',
      webp: 'WebP',
    },
    backgroundLabel: 'Background behind transparency',
    backgroundHint: 'JPEG has no transparency, so clear areas are filled with this colour.',
    qualityLabel: 'Quality',
    losslessAt100:
      'Quality 100 encodes WebP losslessly — pixel-identical to the original, and often smaller than quality 99. Use it when nothing may be lost.',
    useLossless: 'Use 100 (lossless)',
    qualityFlatTop:
      'Above roughly 90 the picture barely improves while the file keeps growing. If you want no loss at all, use 100.',
    pngLossless:
      'PNG is lossless, so there is no quality setting. To make a PNG smaller, resize it or switch the format to WebP.',
    applyQualityToRest: (quality: number, count: number) =>
      `Apply quality ${quality} to the remaining ${count}`,
    applyRestNone: 'No later images are waiting to be saved.',
    appliedQuality: (quality: number, count: number) =>
      `Applied quality ${quality} to ${count} image${count === 1 ? '' : 's'}.`,
    applyAllToRest: (count: number) => `Apply all settings to the remaining ${count}`,
    applyAllHint:
      'Copies the format, quality and size of this image onto the later images that are still unsaved, replacing any adjustments they had.',
    appliedAll: (count: number) =>
      `Applied every setting to ${count} image${count === 1 ? '' : 's'}.`,
    notFollowed: (n: number) =>
      `${n} adjusted image${n === 1 ? '' : 's'} did not follow this change.`,
    includeThem: 'Change those too',
    moreActions: 'More',
    applyToAll: (n: number) => `Apply these settings to all ${n} images (overwrites adjustments)`,
    applyToAllConfirm: (n: number) =>
      `Apply the current settings to all ${n} images? Images you adjusted individually and images you already saved will be overwritten.`,
    appliedToAll: (n: number) => `Applied the current settings to all ${n} images.`,
    undo: 'Undo',
    resizeHeading: 'Resize',
    resizeEnable: 'Change the pixel size',
    widthLabel: 'Width',
    heightLabel: 'Height',
    keepRatio: 'Keep the aspect ratio',
    preventUpscale: 'Never enlarge beyond the original',
    distortWarning: 'These dimensions will stretch the image out of shape.',
    dimensionsPreview: (fromW: number, fromH: number, toW: number, toH: number) =>
      `${fromW}×${fromH} → ${toW}×${toH}`,
    metadataNote:
      'Re-encoding drops metadata such as the capture location. Rotation is preserved.',
    // Download
    download: 'Download',
    downloadNext: 'Download & next',
    downloadFinish: 'Download & finish',
    downloadZip: 'Download all as ZIP',
    zipping: (percent: number) => `Building ZIP… ${percent}%`,
    zipSkipped: (count: number) =>
      `${count} image${count === 1 ? ' was' : 's were'} left out because ${count === 1 ? 'it' : 'they'} could not be processed.`,
    zipFailed: (message: string) => `Failed to build the ZIP: ${message}`,
    finished: (count: number) =>
      `All ${count} images saved. You can change the settings and save again.`,
    shortcuts:
      'Shortcuts: ← → move between images · Enter downloads and moves on · Space shows the original · + − 0 zoom',
    // Errors
    errors: {
      unsupported_type: 'This format is not supported. Use JPEG, PNG or WebP.',
      empty_file: 'This file is empty.',
      file_too_large: 'This file is larger than the 30 MB limit.',
      total_too_large: 'Adding this file would exceed the 300 MB total limit.',
      too_many_files: 'You can work on up to 100 images at a time.',
      decode_failed: 'This image could not be opened. The file may be damaged.',
      encode_failed: 'This image could not be compressed.',
      format_unsupported:
        'Your browser cannot save images in this format. Choose JPEG or PNG instead.',
      out_of_memory:
        'Your browser ran out of memory. Try again with fewer or smaller images.',
    },
  },
  imageCompressorGuide: {
    heading: 'Guide',
    sections: [
      {
        heading: 'How to use the tool',
        steps: [
          'Drop your images onto the upload area. They are read in your browser and never uploaded.',
          'The first image opens in the comparison view. Drag the line across it to see the original on the left and the compressed result on the right.',
          'Adjust the quality until the result still looks right to you. The file size updates as you go.',
          'Press “Apply quality N to the remaining …” so the images after this one start from the setting you just chose.',
          'Press Download & next. The image is saved and you move to the next one that still needs attention — or take everything at once with Download all as ZIP.',
        ],
      },
      {
        heading: 'When is it useful?',
        items: [
          'Photos for a website are too heavy and the page is slow to load.',
          'A form or a marketplace refuses anything over a few megabytes.',
          'A batch of product shots has to come down in size without visibly degrading.',
          'You want to see what compression did to each picture before committing to it.',
          'The images are confidential and uploading them to an online compressor is not an option.',
        ],
      },
      {
        heading: 'Choosing a quality',
        body:
          'Quality 80 is a good starting point for photographs — most of the file disappears while the difference stays hard to see. Detailed textures, text inside an image, and flat illustrations show artefacts sooner, so compare those at 100% zoom before deciding. Below about 60 the damage is usually visible. Above about 90 the opposite happens — the picture stops improving while the file keeps growing — except at exactly 100, where WebP switches to lossless and comes out pixel-identical, often smaller than 99. PNG has no quality setting at all because it is lossless; to shrink a PNG, resize it or convert it to WebP.',
      },
      {
        heading: 'Privacy and security',
        body:
          'Your images are decoded, compressed, and packed into a ZIP entirely inside your browser. Nothing is uploaded to a server, no account is required, and closing or reloading the page discards everything. Because the images never leave your device, the tool can be used with confidential or personal photos.',
      },
    ],
    faqHeading: 'Frequently asked questions',
    faq: [
      {
        question: 'Are my images uploaded to a server?',
        answer:
          'No. Every image is decoded and re-encoded in your browser using your own device. No image or filename is sent anywhere.',
      },
      {
        question: 'Which formats can I use?',
        answer:
          'JPEG, PNG and WebP go in, and you can save as any of those or keep the original format. HEIC, AVIF, SVG, GIF and RAW are not supported.',
      },
      {
        question: 'Why is there no quality slider for PNG?',
        answer:
          'PNG compression is lossless, so there is no quality to trade away — a quality setting would do nothing. Resize the image or convert it to WebP to make a PNG smaller.',
      },
      {
        question: 'Is quality 100 different from 99?',
        answer:
          'Very. At 100 the browser encodes WebP losslessly — the result is pixel-identical to the original and is often smaller than quality 99. Between about 90 and 99 the picture barely improves while the file keeps growing, so 99 gives you roughly the loss of 80 at a much larger size. Use 100 when nothing may be lost, and 75–85 when size matters.',
      },
      {
        question: 'Why did my file get bigger?',
        answer:
          'Re-encoding an already-compressed image at a higher quality, or turning a photograph into PNG, can produce a larger file. The tool tells you when that happens rather than hiding it; lower the quality or keep the original.',
      },
      {
        question: 'Can I use a different quality for one image?',
        answer:
          'Yes. Switch the settings to “This image only”, adjust it, and the rest are left alone. That image is then marked as adjusted in the list.',
      },
      {
        question: 'What does “apply to the remaining” change?',
        answer:
          'Only images after the current one that you have not saved yet. Images before it, ones you already downloaded, and ones that failed are never touched, and the notification tells you how many were affected so you can undo it.',
      },
      {
        question: 'Is the photo metadata kept?',
        answer:
          'No. Re-encoding drops the capture location, date, and camera details. For anything you post online, that means your home address is not embedded in the file. If you sort photos by capture date, keep the originals as well. Rotation is applied to the image itself, so nothing comes out sideways.',
      },
      {
        question: 'How many images can I do at once?',
        answer:
          'Up to 100 images, 30 MB each and 300 MB in total. The real limit is your device’s memory, so very large photos are best done in smaller batches.',
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
