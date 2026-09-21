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
    metaTitle: 'YOSHINYA (よしにゃ) | Free Browser-Based Handy Tools',
    metaDescription:
      'YOSHINYA (よしにゃ) is a collection of free browser-based tools — file renaming, PDF merging, image compression and more — that solve small everyday hassles. A new tool every week. No sign-up, and your files are processed on your device, never sent to a server.',
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
    metaTitle:
      'Bulk Rename Files - File Renamer by Yoshinya | Free, No Sign-up',
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
    lead: 'View your photos and sort them by number. Create your own folders and save them all as one zip.',
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
    filesHeading: (n: number) =>
      n === 1 ? '② Edit 1 PDF' : `② Edit ${n} PDFs`,
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
  csvEncodingFixerGuide: {
    heading: 'Guide',
    sections: [
      {
        heading: 'How to use the tool',
        steps: [
          'Drop your CSV onto the upload area, or click to choose it.',
          'Press *Download the fixed file*. That is the whole process.',
          'Open the downloaded file in Excel. The garbled text is gone.',
        ],
      },
      {
        heading: 'When is it useful?',
        items: [
          'A CSV exported from a CMS such as Webflow opens with the Japanese turned to nonsense.',
          'A CSV exported from an accounting or e-commerce system is meaningless characters in Excel.',
          'A colleague sends a CSV that opens on their machine but not on yours.',
          'Something you are importing into wants UTF-8 and you cannot tell what you have.',
        ],
      },
      {
        heading: 'Why does this happen?',
        body: 'Nothing inside a CSV records which encoding it uses, so every program has to guess. Google Sheets looks at the contents before deciding. Excel, when you double-click a .csv, does not look — it goes by your computer\u2019s settings, which on a Japanese Windows machine means an older Japanese format. When the guess is wrong, the text comes out as nonsense. The file is not damaged, so marking it or converting it puts things right.',
      },
      {
        heading: 'What this tool cannot do',
        body: 'A file that was saved after being read wrongly has already lost its original characters, and nothing can bring them back — ask for the export to be run again. It also does not convert to Shift_JIS.',
      },
      {
        heading: 'Privacy and security',
        body: 'Reading and converting both happen inside your browser. There is no upload, no account, and closing the page discards everything. Because the files never leave your device, the tool can be used with customer lists and other confidential exports.',
      },
    ],
    faqHeading: 'Frequently asked questions',
    faq: [
      {
        question: 'Are my files uploaded to a server?',
        answer:
          'No. Everything happens in your browser. Neither the contents nor the file name is sent anywhere.',
      },
      {
        question: 'Will this change my data?',
        answer:
          'No. Your original file is left alone and a fixed copy is downloaded separately. The text itself is unchanged.',
      },
      {
        question: 'Why is the downloaded file named differently?',
        answer:
          'The copy looks identical to the original, so _utf8 is added to keep the two apart.',
      },
      {
        question: 'My Excel file (.xlsx) is garbled. Will this fix it?',
        answer:
          'No. An .xlsx cannot have this problem, so if one is garbled it was already broken when it was saved. It has to be produced again from the source.',
      },
      {
        question: 'I fixed it, but Excel still will not open it.',
        answer:
          'The file may simply be too big. A CSV of several megabytes containing long passages of text can defeat Excel whatever its encoding. Try Google Sheets, or Excel\u2019s Data > From Text/CSV.',
      },
      {
        question: 'How many files can I do at once?',
        answer:
          'Up to 50 files, 50 MB each. A batch finishes almost instantly.',
      },
    ],
    relatedHeading: 'Related tools',
  },
  splitBillGuide: {
    heading: 'Guide',
    sections: [
      {
        heading: 'How to use the tool',
        steps: [
          'Add everyone who was there, and give each a share: 1 for a normal share, 0.5 for half, 0 for someone who is not paying.',
          'Add each payment — who paid, what for, and how much.',
          'Press *Work out the split*.',
          'Read who pays whom, then copy the result to send to the group.',
        ],
      },
      {
        heading: 'When is it useful?',
        items: [
          'Several people paid for different things and nobody knows where they stand.',
          'Someone arrived late or left early and should not carry a full share.',
          'One person drank nothing, or ate nothing, and it feels wrong to charge them the same.',
          'A trip where the hotel, the car and the food were each put on a different card.',
          'A group order where one person paid the lot and needs the rest sorted out.',
        ],
      },
      {
        heading: 'What the share means',
        body: 'The share is relative, not a percentage. If four people carry 1 and one carries 0.5, the total is divided into 4.5 parts: a full share is one part and the half share is half a part. So the shares never need to add up to anything in particular — you set what feels right, and the arithmetic follows. A share of 0 means the person pays nothing, though they can still have paid for something and be repaid in full.',
      },
      {
        heading: 'The awkward penny',
        body: 'Three people splitting 1,000 yen cannot each pay the same whole yen. Rather than rounding each share and leaving the column a yen short, the tool gives the leftover to whoever was cut hardest by the rounding. The shares always add up to exactly what was spent, and after everyone has paid what the result says, every balance is zero.',
      },
      {
        heading: 'Privacy and security',
        body: 'Names, amounts and the result stay in your browser. Nothing is sent to a server and no account is needed. What you type is kept on your own device so you can come back to it, and *Start over* erases that too.',
      },
    ],
    faqHeading: 'Frequently asked questions',
    faq: [
      {
        question: 'Are the names and amounts sent anywhere?',
        answer:
          'No. Everything is worked out in your browser. Nothing you type is sent to a server, and the analytics record only that a calculation happened and roughly how many people were involved.',
      },
      {
        question: 'Can someone pay for something without owing anything?',
        answer:
          'Yes. Give them a share of 0 and record what they paid. They will be owed all of it back.',
      },
      {
        question: 'Does the result always add up?',
        answer:
          'Yes. The shares are worked out to the smallest unit of the currency, so they total exactly what was spent, and following the settlements leaves everyone at zero.',
      },
      {
        question: 'Can I mix currencies in one event?',
        answer:
          'Not at present. One event uses one currency, and changing it does not convert the amounts — only the symbol and the number of decimals change.',
      },
      {
        question: 'Is what I typed still here if I come back?',
        answer:
          'Yes, on the same device and browser. It is stored locally, never on a server, and *Start over* clears it.',
      },
      {
        question: 'How many people and payments can I add?',
        answer: 'Up to 20 people and 100 payments.',
      },
    ],
    relatedHeading: 'Related tools',
  },
  iconGeneratorGuide: {
    heading: 'Guide',
    sections: [
      {
        heading: 'How to use the tool',
        steps: [
          'Set the colour, the line thickness and the size. Every icon on the page updates as you change them.',
          'Tick the icons you want. *Select all* takes the lot.',
          'For a single icon, press *Copy SVG* to put the code on your clipboard, or use the SVG and PNG buttons on the card.',
          'For several at once, choose SVG, PNG or both, pick the PNG sizes you need, and press the download button under *③ Download them*.',
        ],
      },
      {
        heading: 'When is it useful?',
        items: [
          'A deck or a document needs a row of icons in the same colour and the same weight.',
          'The icons you have are black and the brand is not.',
          'You need the same icon at 32, 128 and 512 pixels and you would rather not export it three times.',
          'A design has icons in a heavier line than the set you downloaded.',
          'You want the SVG code itself, to paste straight into a component.',
        ],
      },
      {
        heading: 'SVG or PNG?',
        terms: [
          {
            term: 'SVG',
            definition:
              'A drawing rather than a picture, so one file is sharp at any size. This is the one to use on a website or in a design tool, and it is why the SVG export has no size to choose.',
          },
          {
            term: 'PNG',
            definition:
              'A fixed grid of pixels. Use it where SVG is not accepted — some presentation software, some marketplaces, an app icon — and choose the sizes you actually need, because a PNG enlarged past its own size goes soft.',
          },
        ],
      },
      {
        heading: 'Why the line gets thicker as the icon grows',
        body: 'The line thickness is measured inside the icon, not in pixels on your screen, so making the icon bigger makes its line bigger by the same proportion — exactly as if you had drawn it larger. That is what keeps a set of icons looking like one set at every size. If you want a large icon with a fine line, lower the line thickness and the change applies everywhere at once.',
      },
      {
        heading: 'Where the icons come from',
        body: 'The icons are Lucide (lucide.dev), used under the ISC License; some of them began in the Feather project and carry the MIT License. Yoshinya credits both, which is all those licences ask of us. Nothing is asked of you: what you download here can be used commercially, changed however you like, and needs no credit of any kind.',
      },
      {
        heading: 'Privacy and security',
        body: 'The only things you enter are a colour and a search word, and neither is sent anywhere — the icons are drawn, converted to PNG and packed into a ZIP inside your browser. Your settings are remembered on this device alone, and clearing your browser data removes them.',
      },
    ],
    faqHeading: 'Frequently asked questions',
    faq: [
      {
        question: 'Can I use these icons in commercial work?',
        answer:
          'Yes. They are Lucide icons under the ISC License: commercial use, modification and redistribution are all permitted, and no credit is required from you.',
      },
      {
        question: 'Do I have to credit Yoshinya or Lucide?',
        answer:
          'No. The licence obliges whoever distributes the icons — that is this site, and the credit is on this page. Nothing has to appear in your own work.',
      },
      {
        question: 'Is anything I do here sent to a server?',
        answer:
          'No. The colour you pick, the words you search for and the files you download all stay in your browser. The analytics record only that a download happened and how many files it contained.',
      },
      {
        question: 'Why does the line get thicker when I make the icon bigger?',
        answer:
          'Because the whole icon is scaled, line included, which is what keeps icons of different sizes looking like one set. Lower the line thickness if you want a large icon with a fine line.',
      },
      {
        question: 'Can I get a favicon or an .ico file?',
        answer:
          'Not yet. You can export PNGs at 16, 32 and other sizes here, which covers most of what a favicon needs, but the .ico file and the manifest are a separate job and will get their own tool.',
      },
      {
        question: 'How many icons can I download at once?',
        answer:
          'All of them, at every PNG size at the same time. The ZIP is built in your browser, so the only limit is your own machine.',
      },
      {
        question: 'Are my settings still here when I come back?',
        answer:
          'Yes, on the same device and browser. The colour, thickness, size and background are stored locally and never on a server. Which icons you had selected is not kept.',
      },
    ],
    relatedHeading: 'Related tools',
  },
  pdfMergerGuide: {
    heading: 'Guide',
    sections: [
      {
        heading: 'How to use the tool',
        steps: [
          'Drop your PDFs onto the upload area, or click to choose them.',
          'Drag the cards into the order you want. *Name order* and *Reverse* are there if that is quicker.',
          'To use only part of a file, type the pages into *Pages to use*. Leave it empty for the whole document.',
          'Press *Merge and download*.',
        ],
      },
      {
        heading: 'When is it useful?',
        items: [
          'Invoices and receipts that have to go out as one file at the end of the month.',
          'A scanner that saved every sheet as its own PDF, and now the document has to be put back together.',
          'A submission where only a few pages of each form are actually wanted.',
          'A report split into chapters that needs to be one file before it is handed round.',
          'Anything confidential, where uploading a document to a website is not an option.',
        ],
      },
      {
        heading: 'Choosing which pages to use',
        body: 'Leave *Pages to use* empty and the whole document goes in. Otherwise, type the page numbers as you would say them: 3 for a single page, 1-5 for a run, 2,5,7 for a few, 4- for everything from page 4 onwards, and -3 for the first three. Two things happen exactly as written rather than being tidied up: 1,1,2 really does put page 1 in twice, and 3,1 really does put page 3 before page 1. Writing the pages backwards, as in 5-2, reverses them. Under the box you will see how many pages your entry works out to, so a mistake shows up before you download anything.',
      },
      {
        heading: 'PDFs that cannot be merged',
        body: 'A password-protected PDF cannot be opened without its password, and a file that will not parse cannot be read at all; both are marked and left out, and the rest still merge. A signed PDF is different — it merges, but the signature does not survive, because the result is a new document and no signature can cover pages it never signed. Fillable forms lose their fields for the same reason: what is copied is the page, not the form. Both are flagged on the card before you merge.',
      },
      {
        heading: 'Privacy and security',
        body: 'Your PDFs stay inside your browser and are not sent to a server, which is what makes this safe to use with contracts, invoices and medical records. There is no upload, no account, and nothing is stored: closing the page discards everything. Your original files are never modified — the merged document is a new file you download.',
      },
    ],
    faqHeading: 'Frequently asked questions',
    faq: [
      {
        question: 'Are my PDFs uploaded to a server?',
        answer:
          'No. They are read and merged inside your browser. Neither the contents nor the file names are sent anywhere, so a confidential document never leaves your device.',
      },
      {
        question: 'How many files can I merge at once?',
        answer:
          'Up to 100 files, 100 MB each and 500 MB in total. There is no daily limit and no sign-up.',
      },
      {
        question: 'Will a digital signature still be valid afterwards?',
        answer:
          'No. Merging always produces a new document, and a signature only covers the file it was applied to. If the signature has to survive, the signed PDF has to stay as it is.',
      },
      {
        question: 'What happens to a fillable form?',
        answer:
          'The pages come across but the fields do not, so the merged file is no longer fillable. Fill the form in and save it first if the answers need to be kept.',
      },
      {
        question: 'Can I merge a password-protected PDF?',
        answer:
          'Not at the moment. Remove the password in the application you normally open it with, then merge the unprotected copy.',
      },
      {
        question: 'Can I put the pages in any order I like?',
        answer:
          'Yes. The files merge in the order of the list, and within a file the pages merge in the order you typed them, so 3,1 puts page 3 first.',
      },
      {
        question: 'Are my original files changed?',
        answer:
          'No. They are only read. The merged document is downloaded as a separate new file.',
      },
      {
        question: 'Can I reorder or delete pages inside one PDF?',
        answer:
          'Not with this tool — merging works across files, and within a file it only takes the pages you name. PDF Page Organizer by Yoshinya is the one for that: it shows a thumbnail of every page, and pages can be moved, turned, deleted, or cut into separate files.',
      },
    ],
    relatedHeading: 'Related tools',
  },
  pdfPageOrganizerGuide: {
    heading: 'Guide',
    sections: [
      {
        heading: 'How to use the tool',
        steps: [
          'Drop one PDF onto the upload area, or click to choose it. Every page appears as a thumbnail.',
          'Click the pages you want to work on. Shift-click picks a run of them, and *Select all* takes the lot.',
          'Turn them with *Rotate right* or *Rotate left*, drop them with *Delete selected*, or drag a page to move it.',
          'Choose whether to save one PDF or several, name the file, and press the download button.',
        ],
      },
      {
        heading: 'When is it useful?',
        items: [
          'A scan came out with some pages sideways or upside down.',
          'Blank sheets and duplicates are mixed into a document that has to be sent on.',
          'Only part of a form is wanted, and the rest should not be shared.',
          'One PDF holds forty invoices that have to become forty files.',
          'Anything confidential, where uploading a document to a website is not an option.',
        ],
      },
      {
        heading: 'Splitting one PDF into several',
        body: 'Pick *Save as separate files (zip)* and then choose how the cuts are made. With *Cut where I say*, pressing *Cut before this page* on a card starts a new file at that page — the usual choice when the parts are different lengths. *Every N pages* divides the document into equal runs, and a size of 1 gives you a file per page. *Cut at the selected pages* uses your selection instead, which is the quickest way through a scan of forty invoices: select the first page of each one. Before anything is downloaded you are told how many files there will be and which pages go into each, and the files arrive as a zip named after your document, numbered so they stay in order.',
      },
      {
        heading: 'Turning pages and taking them out',
        body: 'A rotation is added to the way the page already sits, so a page scanned sideways and a page scanned upright both end up where you expect after one press. Deleting removes pages from the list only — your own file is never touched — and *Keep selected only* does the opposite, throwing away everything you did not pick, which is faster when you only want three pages out of ninety. Nothing is final until you download: *Undo* steps back through the last fifty changes, and *Redo* puts them back.',
      },
      {
        heading: 'PDFs that cannot be opened',
        body: 'A password-protected PDF cannot be opened without its password, and a file that will not parse cannot be read at all. Both are refused with a reason rather than a blank page. A document longer than 1,000 pages is also turned away, because that many thumbnails is more than a browser tab can hold. A signed PDF opens and edits, but the signature does not survive, because what you download is a new document and no signature can cover pages it never signed. Fillable forms lose their fields for the same reason. Both are flagged when the file opens. If one page will not draw, its card shows its number instead of a picture and everything else still works — the thumbnail is a preview, not the document.',
      },
      {
        heading: 'Privacy and security',
        body: 'Your PDF stays inside your browser and is not sent to a server, which is what makes this safe to use with contracts, invoices and medical records. There is no upload, no account, and nothing is stored: closing the page discards everything. Even the font and image data the page previews need comes from this site rather than an outside service, so opening a document tells nobody anything. Your original file is never modified — what you download is a new file.',
      },
    ],
    faqHeading: 'Frequently asked questions',
    faq: [
      {
        question: 'Is my PDF uploaded to a server?',
        answer:
          'No. It is read, drawn and rewritten inside your browser. Neither the contents nor the file name is sent anywhere, so a confidential document never leaves your device.',
      },
      {
        question: 'Can I organize several PDFs at once?',
        answer:
          'Not here — this tool works on one document at a time, because the page grid is the working area. To put several files together, use PDF Merger by Yoshinya, which can also take just the pages you name from each file.',
      },
      {
        question: 'What are the split files called?',
        answer:
          'They take the name you chose with a number on the end, padded so they sort correctly: report-01.pdf to report-12.pdf. They download together as report-split.zip.',
      },
      {
        question: 'Will a digital signature still be valid afterwards?',
        answer:
          'No. Editing pages always produces a new document, and a signature only covers the file it was applied to. If the signature has to survive, the signed PDF has to stay as it is.',
      },
      {
        question: 'What happens to a fillable form?',
        answer:
          'The pages come across but the fields do not, so the saved file is no longer fillable. Fill the form in and save it first if the answers need to be kept.',
      },
      {
        question: 'How many pages can it handle?',
        answer:
          'Up to 1,000 pages, in a file of up to 100 MB. Thumbnails are drawn as you scroll rather than all at once, so a long document opens quickly.',
      },
      {
        question: 'Do bookmarks survive?',
        answer:
          'No. The outline is not carried over, which is deliberate: once pages are moved or removed, a bookmark that still pointed at "page 12" would take the reader somewhere it was never meant to.',
      },
      {
        question: 'Is my original file changed?',
        answer:
          'No. It is only read. What you download is a separate new file, so the original stays exactly as it was until you replace it yourself.',
      },
    ],
    relatedHeading: 'Related tools',
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
        body: 'Your files are read and renamed entirely inside your browser. Nothing is uploaded to a server, no account is required, and closing or reloading the page discards everything. Because the files never leave your device, the tool can be used with confidential material in workplaces where uploading to an online service is not allowed.',
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
        body: 'Your images are read, grouped, and packed into a zip entirely inside your browser. Nothing is uploaded to a server, no account is required, and closing or reloading the page discards everything. Because the images never leave your device, the tool can be used with confidential or personal photos.',
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
        heading: 'What is a PDF title?',
        body: 'Every PDF carries a set of document properties inside the file itself, and one of them is the title. Browsers show it in the tab, PDF readers show it in the window and in the document properties dialog, and search engines may use it when the PDF appears in results. It is written when the PDF is created, which is why an exported document often ends up titled after the template, the slide deck, or the original Word file it came from.',
      },
      {
        heading: 'Filename vs PDF title',
        body: 'These are two different things, and changing one does not change the other. That is the whole reason this tool exists.',
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
        heading: 'Privacy and security',
        body: 'Your PDFs are opened, edited, and rebuilt entirely inside your browser. Nothing is uploaded to a server, no account is required, and closing or reloading the page discards everything. Because the files never leave your device, the tool can be used with confidential documents in workplaces where uploading to an online service is not allowed.',
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
        question:
          'Why does a renamed PDF show a different name in the browser tab?',
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
  csvEncodingFixerPage: {
    metaTitle:
      'Fix Garbled CSV in Excel - CSV Encoding Fixer by Yoshinya | Free, No Sign-up',
    metaDescription:
      'A CSV that turns to garbage in Excel is not broken. Drop it in and download the copy — it will open correctly in Excel. Free, no sign-up, and your files never leave your browser.',
    heading: 'CSV Encoding Fixer by Yoshinya',
    toolName: 'CSV Encoding Fixer by Yoshinya',
    toolDescription:
      'Works out what encoding a CSV really uses and saves a copy Excel opens correctly.',
    lead: 'Opened a CSV in Excel and found rows of meaningless characters? This tool fixes that, easily. Add the file, download the copy — that is all there is to it. Everything happens inside your browser and nothing is uploaded, so there is nothing to worry about, even with confidential exports.',
    privacyNote:
      'Your files are not sent to a server. All processing happens in your browser.',
  },
  csvEncodingFixer: {
    // Input
    addHeading: '\u2460 Add CSV files',
    dropzone: 'Drop CSV files here, or click to choose',
    dropzoneHint: 'Several at once is fine',
    supportedFormats: 'Supported: .csv, .tsv, .txt',
    addMore: '+ Add files',
    rejectedHeading: 'Files that could not be added',
    dismiss: 'Dismiss',
    // Results
    filesHeading: (n: number) =>
      `\u2461 ${n} file${n === 1 ? '' : 's'} checked`,
    detectedLabel: 'What this file really is',
    encodings: {
      'utf-8': 'UTF-8',
      'utf-16le': 'UTF-16 (little endian)',
      'utf-16be': 'UTF-16 (big endian)',
      shift_jis: 'Shift_JIS',
      'euc-jp': 'EUC-JP',
    },
    // The three verdicts. Each says what is wrong and what the download will do,
    // because a tool that silently "fixes" a file teaches the user nothing.
    verdictBomOnly:
      'This one can be fixed. Download it below and Excel will open it correctly.',
    // Kept, but demoted: the person in front of a garbled file wants it fixed,
    // not taught. Anyone who does want to know can read on.
    verdictBomOnlyWhy:
      'The file itself is fine. Excel just needs a marker at the start before it will read it properly, so the download adds one. Your data is unchanged.',
    verdictConvert: () =>
      'This one can be fixed. Download it below and Excel will open it correctly.',
    verdictConvertWhy: (from: string) =>
      `The file itself is fine. It is written in ${from}, an older format today's software no longer expects, so the download converts it.`,
    verdictAlreadyFine:
      'Nothing to fix here — Excel will open this one as it is.',
    verdictAlreadyFineWhy:
      'It is already UTF-8 and already carries the marker Excel looks for.',
    damagedWarning:
      'Some characters in this file could not be read under any encoding, which means they were already lost before the file reached here. Converting cannot bring them back — you would need the original export.',
    // Shown when the file is too heavy for Excel regardless of encoding. Naming
    // the real numbers matters: the user has just been told the file is fixed,
    // and needs to know why Excel still will not open it.
    excelHeavyWarning: (mb: string) =>
      `This file is ${mb} MB and contains very long lines of text. Excel often cannot open files like this — it may hang or stop responding. That is separate from the encoding and fixing it will not change it. Google Sheets handles these files, and in Excel you can try Data > From Text/CSV rather than opening the file directly.`,
    previewHeading: 'Check the contents',
    whyHeading: 'More about this file',
    // Actions
    download: 'Download the fixed file',
    downloadAll: (n: number) => `Download all ${n}`,
    removeOne: 'Remove',
    removeAll: 'Remove all',
    noChangeNeeded: 'No change needed',
    errors: {
      empty_file: 'This file is empty.',
      file_too_large: 'This file is over the 50 MB limit.',
      too_many_files: 'You can check up to 50 files at a time.',
    },
  },
  splitBillPage: {
    metaTitle: 'Settle Shared Expenses - Split Bill by Yoshinya | Free, No Sign-up',
    metaDescription:
      'Split expenses several people paid for, with a share for each person — a full share, half, or none. See who should pay whom, copy the result, or share it as an image. Free, no sign-up, and nothing leaves your browser.',
    heading: 'Split Bill by Yoshinya',
    toolName: 'Split Bill by Yoshinya',
    toolDescription:
      'Works out who owes whom when several people paid and not everyone owes the same share.',
    lead: 'A house party or a barbecue, with several people bringing food and drink — and then the part nobody enjoys: working out who owes what.\nThis nets what everyone paid against what they actually used, and lets you set the share per person or per item, so one glass of wine costs what one glass should.',
    privacyNote:
      'Your names and amounts are not sent to a server. All processing happens in your browser.',
  },
  splitBill: {
    defaultTitle: 'Split Bill Result',
    // Steps
    eventHeading: '\u2460 The occasion',
    participantsHeading: '\u2461 Who was there',
    expensesHeading: '\u2462 Who paid for what',
    resultHeading: '\u2463 The result',
    // Event
    eventName: 'Name',
    eventNamePlaceholder: 'e.g. Wine night',
    eventNameOptional: 'optional',
    eventDate: 'Date',
    currency: 'Currency',
    currencies: {
      yen: 'Yen',
      dollar: 'Dollar',
      euro: 'Euro',
      pound: 'Pound',
      won: 'Won',
    },
    // Participants
    participantName: 'Name',
    participantNamePlaceholder: 'e.g. Alex',
    weight: 'Share',
    weightHint:
      '1 is a normal share. 0.5 pays half of what a normal share pays, 2 pays double, and 0 pays nothing.',
    weightExamples:
      'Came for all of it: 1 / Came late: 0.5 / Looked in: 0.2 / Not paying: 0',
    addParticipant: '+ Add someone',
    removeParticipant: 'Remove',
    removeWithExpenses: (name: string, count: number) =>
      `${name} paid for ${count} ${count === 1 ? 'thing' : 'things'}. Remove those too?`,
    removeKeepExpenses: 'Keep them, unassigned',
    removeWithExpensesConfirm: 'Remove them as well',
    cancel: 'Cancel',
    // Expenses
    payer: 'Paid by',
    payerPlaceholder: 'Choose',
    description: 'What for',
    descriptionPlaceholder: 'e.g. Wine',
    // Per-expense sharing. Named after the question it answers rather than the
    // mechanism: nobody thinks of themselves as being in an expense's subset.
    sharedByLabel: 'Split between',
    sharedByEveryone: 'Everyone',
    sharedBySome: (n: number, total: number) => `${n} of ${total}`,
    sharedByNobody: 'Nobody',
    sharedByEdit: 'Change',
    sharedByAll: 'Select everyone',
    sharedByNone: 'Clear',
    sharedByDone: 'Done',
    sharedByHint:
      'Set who shares this particular cost, and how much of it each carries. Untick whoever did not have any; put 0.5 against someone who had one glass. Left alone, everyone carries their usual share.',
    amount: 'Amount',
    addExpense: '+ Add a payment',
    removeExpense: 'Remove',
    // Actions
    calculate: 'Work out the split',
    // Result
    total: 'Total',
    participantCount: (n: number) => `${n} people`,
    expenseCount: (n: number) => `${n} payments`,
    settlementsHeading: 'Who pays whom',
    nothingToSettle: 'Nothing left to settle.',
    breakdownHeading: 'Shares and payments',
    colName: 'Name',
    colWeight: 'Share',
    weightAdjustedMark: '*',
    weightAdjustedNote:
      '* Some costs use a share set for that cost alone, so this column does not explain the whole amount. The per-person breakdown below does.',
    colBurden: 'Owes',
    colPaid: 'Paid',
    colBalance: 'Balance',
    receive: 'Receives',
    pay: 'Pays',
    settled: 'Settled',
    // The workings, for the question the settlement list cannot answer on its
    // own: why the person who bought the wine is owed less than they paid.
    workingHeading: 'How this was worked out',
    workingStep1: 'What each payment left people owing',
    workingStep2: 'Added up between each pair of people',
    workingStepNet: 'What that leaves each person',
    workingNetPositionNote:
      'Owing in one direction and being owed in another cancel out. What is left is what the payments below are built from — so someone who owes 500 but is owed 1,500 ends up receiving 1,000, not paying anything.',
    workingPays: (amount: string) => `owes ${amount}`,
    workingReceives: (amount: string) => `is owed ${amount}`,
    workingColourNote:
      'Each person keeps the same colour throughout, so a name can be followed from one step to the next.',
    workingStep3: 'Combined, so there are fewer payments to make',
    workingEach: (name: string, amount: string) => `${name}: ${amount}`,
    workingPaidBy: (name: string) => `paid by ${name}`,
    workingNetNote:
      'Someone who paid for something they also shared is only owed the rest of it — and they may owe someone else in turn. Adding those up in both directions is where these numbers come from.',
    workingCombineNote:
      'The largest amount owed is set against the largest amount due, and so on until nothing is outstanding.',
    workingStepWhy: (from: string, owes: string, to: string, due: string) =>
      `${from} still owes ${owes}; ${to} is still due ${due}.`,
    workingStepLeft: (name: string, amount: string) =>
      `${name} is still due ${amount}.`,
    workingStepStillOwes: (name: string, amount: string) =>
      `${name} still owes ${amount}.`,
    workingNothing: 'Nobody ended up owing anybody.',
    statementsHeading: 'What each person owes, item by item',
    statementsHint:
      'Every cost is listed for everyone, including the ones they carry none of — so a share can be checked item by item.',
    statementNotShared: 'not yours',
    statementSplitAmong: (n: number) => `split ${n} ways`,
    // Shown instead when the weights differ, because "split 3 ways" reads as
    // equal thirds and the amount would not follow from it.
    statementWeighted: (weight: number, total: number) =>
      `${weight} of ${total} shares`,
    statementBurdenTotal: 'Owes in total',
    statementPaidTotal: 'Paid',
    detailsHeading: 'Every payment',
    // Text and image
    copyResult: 'Copy the result',
    copied: 'Copied the result.',
    copyFailed: 'Could not copy. Select the text below and copy it yourself.',
    createImage: 'Make an image',
    imageVariantSimple: 'Just the payments',
    imageVariantDetailed: 'With the full breakdown',
    imageVariantItems: 'With what each person had',
    imageBuilding: 'Making the image…',
    imagePreviewHeading: 'Image preview',
    downloadImage: 'Download the image',
    shareImage: 'Share the image',
    close: 'Close',
    imageFailed: 'Could not make the image. Please try again.',
    imageTooLong:
      'There is too much here for one image. Try a shorter version, or copy the result as text.',
    imageShared: 'Shared.',
    shareFailedDownload:
      'Sharing did not work. You can download the image instead.',
    shareUnsupported:
      'This device cannot share the image directly. Download it and share it from there.',
    // Housekeeping
    deleteData: 'Delete what is saved',
    dataDeleted: 'Deleted. Nothing is left on this device.',
    resetConfirm:
      'Clear the form and delete what is saved on this device? This cannot be undone.',
    storageNote:
      'What you type is kept on this device so you can come back to it, and is deleted automatically after 30 days. It is never sent to Yoshinya.',
    resultPrivacyNote:
      'Names, amounts and the result stay in your browser. Nothing is sent or stored on a server.',
    footer: 'Split Bill by Yoshinya | yoshinya.com',
    errors: {
      name_required: 'Enter a name.',
      name_duplicate: 'Two people have the same name.',
      name_too_long: 'That name is too long.',
      weight_invalid: 'A share must be between 0 and 10.',
      all_weights_zero: 'At least one person needs a share above 0.',
      payer_required: 'Choose who paid.',
      amount_invalid: 'Enter an amount above 0.',
      no_sharers: 'Choose at least one person to share this cost.',
      no_expenses: 'Add at least one payment.',
      too_few_participants: 'Add at least two people.',
    },
  },
  iconGeneratorPage: {
    metaTitle:
      'Recolor and Resize SVG - Icon Generator by Yoshinya | Free, No Sign-up',
    metaDescription:
      'Pick the icons you need, set one colour, line thickness and size for all of them, then copy the SVG or download the lot as SVG and PNG in a ZIP. Free, no sign-up, and everything is generated in your browser.',
    heading: 'Icon Generator by Yoshinya',
    toolName: 'Icon Generator by Yoshinya',
    toolDescription:
      'Recolours and resizes a set of icons together, then exports them as SVG or PNG.',
    lead: 'Downloading icons one at a time, then opening each file to change the colour, is a strange amount of work for something so small. Choose the icons here, set the colour, thickness and size once, and take them all away together — as SVG code on your clipboard, or as a ZIP of SVGs and PNGs at every size you need.',
    privacyNote:
      'Nothing you enter is sent to a server. All processing happens in your browser.',
  },
  iconGenerator: {
    // Step 1 — appearance
    styleHeading: '① Choose how it looks',
    previewLabel: 'Preview',
    color: 'Colour',
    colorPicker: (label: string) => `${label} picker`,
    colorInvalid: 'Enter a colour like #1a2b3c.',
    strokeWidth: 'Line thickness',
    // Said next to the control rather than buried in the guide: it is the one
    // behaviour people expect to work the other way round.
    strokeWidthHint: 'The line scales with the icon, so a bigger icon has a bigger line.',
    size: 'Size',
    background: 'Background',
    backgrounds: {
      none: 'None',
      circle: 'Circle',
      rounded: 'Rounded square',
      square: 'Square',
    },
    backgroundColor: 'Background colour',
    padding: 'Space around the icon',
    resetStyle: 'Back to the defaults',
    // Step 2 — choosing
    pickHeading: '② Choose the icons',
    searchLabel: 'Search',
    searchPlaceholder: 'e.g. mail, folder, warning',
    categories: {
      all: 'All',
      basic: 'Everyday',
      action: 'Actions',
      arrow: 'Arrows',
      file: 'Files',
      contact: 'Contact',
      business: 'Business',
      money: 'Money',
      place: 'Places',
      transport: 'Transport',
      device: 'Devices and IT',
    },
    resultCount: (n: number) => (n === 1 ? '1 icon' : `${n} icons`),
    noResults: 'No icon matches that.',
    clearSearch: 'Clear the search',
    selectAll: 'Select all',
    clearSelection: 'Clear the selection',
    selectedCount: (n: number) =>
      n === 1 ? '1 icon selected' : `${n} icons selected`,
    selectIcon: (name: string) => `Select ${name}`,
    copySvg: 'Copy SVG',
    copied: 'Copied',
    copyFailed: 'Could not copy. Your browser blocked the clipboard.',
    downloadSvgOne: 'SVG',
    downloadPngOne: 'PNG',
    // Step 3 — export
    exportHeading: '③ Download them',
    formatLabel: 'Format',
    formatSvg: 'SVG',
    formatPng: 'PNG',
    // Explains an absence: someone who has just chosen six PNG sizes will look
    // for the same row under SVG and wonder what they have missed.
    svgSizeNote: 'One SVG file is sharp at every size, so there is nothing to choose.',
    pngSizesLabel: 'PNG sizes',
    downloadZip: (n: number) =>
      n === 1 ? 'Download 1 file as a ZIP' : `Download ${n} files as a ZIP`,
    downloadZipEmpty: 'Download as a ZIP',
    zipping: 'Making the ZIP…',
    zipFailed: (message: string) => `Failed to make the ZIP: ${message}`,
    pngFailed: 'Could not make the PNG. Please try again.',
    needSelection: 'Tick at least one icon above.',
    needFormat: 'Choose SVG, PNG, or both.',
    credit: 'Icons: Lucide (ISC License)',
  },
  // Shown under each icon, and searched alongside the English name so that the
  // word someone actually thinks of finds the icon.
  iconLabels: {
    house: { name: 'Home', keywords: 'house building residence top' },
    search: { name: 'Search', keywords: 'find magnifier lookup zoom' },
    settings: { name: 'Settings', keywords: 'gear cog preferences options' },
    user: { name: 'User', keywords: 'person account profile member' },
    bell: { name: 'Notification', keywords: 'bell alarm alert ring' },
    heart: { name: 'Heart', keywords: 'like favourite love' },
    star: { name: 'Star', keywords: 'favourite rating review' },
    bookmark: { name: 'Bookmark', keywords: 'save read later tag' },
    menu: { name: 'Menu', keywords: 'hamburger navigation lines' },
    'layout-grid': { name: 'Grid', keywords: 'tiles dashboard blocks layout' },
    list: { name: 'List', keywords: 'items bullets index menu rows' },
    sun: { name: 'Light mode', keywords: 'sun day bright weather' },
    moon: { name: 'Dark mode', keywords: 'moon night sleep' },
    plus: { name: 'Add', keywords: 'plus new create' },
    minus: { name: 'Subtract', keywords: 'minus less decrease' },
    equal: { name: 'Equals', keywords: 'equal same result maths' },
    check: { name: 'Done', keywords: 'check tick confirm ok yes' },
    x: { name: 'Close', keywords: 'cross cancel dismiss no' },
    'circle-check': {
      name: 'Success',
      keywords: 'check circle complete approved done',
    },
    'circle-x': { name: 'Error', keywords: 'cross circle failed rejected' },
    pencil: { name: 'Edit', keywords: 'pencil write change' },
    'trash-2': { name: 'Delete', keywords: 'trash bin remove discard' },
    download: { name: 'Download', keywords: 'save get' },
    upload: { name: 'Upload', keywords: 'send submit' },
    'refresh-cw': { name: 'Reload', keywords: 'refresh sync update retry' },
    copy: { name: 'Copy', keywords: 'duplicate clone clipboard' },
    filter: { name: 'Filter', keywords: 'funnel narrow sort refine' },
    eye: { name: 'View', keywords: 'see preview visible watch show' },
    'eye-off': { name: 'Hide', keywords: 'hidden invisible private conceal' },
    link: { name: 'Link', keywords: 'chain url anchor connect' },
    'log-in': { name: 'Sign in', keywords: 'login enter account access' },
    'log-out': { name: 'Sign out', keywords: 'logout exit leave quit' },
    'arrow-up': { name: 'Arrow up', keywords: 'top rise' },
    'arrow-down': { name: 'Arrow down', keywords: 'bottom fall' },
    'arrow-left': { name: 'Arrow left', keywords: 'back previous' },
    'arrow-right': { name: 'Arrow right', keywords: 'next forward' },
    'arrow-left-right': {
      name: 'Left and right',
      keywords: 'both ways swap exchange horizontal transfer',
    },
    'arrow-up-down': {
      name: 'Up and down',
      keywords: 'both ways sort vertical swap',
    },
    'chevron-up': { name: 'Chevron up', keywords: 'collapse close accordion' },
    'chevron-down': {
      name: 'Chevron down',
      keywords: 'expand dropdown open accordion',
    },
    'chevron-left': { name: 'Chevron left', keywords: 'back previous' },
    'chevron-right': { name: 'Chevron right', keywords: 'next more detail' },
    'external-link': {
      name: 'External link',
      keywords: 'open new window outside',
    },
    move: { name: 'Move', keywords: 'drag reposition' },
    file: { name: 'File', keywords: 'document blank page' },
    'file-text': { name: 'Document', keywords: 'text page article' },
    'file-down': {
      name: 'Download file',
      keywords: 'document save brochure material pdf',
    },
    folder: { name: 'Folder', keywords: 'directory files' },
    'folder-open': { name: 'Open folder', keywords: 'directory browse opened' },
    image: { name: 'Image', keywords: 'photo picture' },
    camera: { name: 'Camera', keywords: 'photo shoot snapshot' },
    paperclip: { name: 'Attachment', keywords: 'clip attach' },
    clipboard: { name: 'Clipboard', keywords: 'copy paste board' },
    printer: { name: 'Print', keywords: 'printer paper output' },
    archive: { name: 'Archive', keywords: 'box store keep' },
    database: { name: 'Database', keywords: 'storage data records sql' },
    package: { name: 'Package', keywords: 'box parcel shipping product' },
    mail: { name: 'Mail', keywords: 'email envelope message' },
    phone: { name: 'Phone', keywords: 'call telephone contact' },
    'message-circle': {
      name: 'Message',
      keywords: 'chat comment bubble talk',
    },
    send: { name: 'Send', keywords: 'paper plane submit' },
    users: { name: 'People', keywords: 'group team members' },
    calendar: { name: 'Calendar', keywords: 'date schedule event' },
    clock: { name: 'Time', keywords: 'clock hour schedule' },
    'map-pin': { name: 'Location', keywords: 'map place address pin' },
    globe: { name: 'Globe', keywords: 'world language international web' },
    headset: {
      name: 'Support',
      keywords: 'customer service helpdesk call centre agent',
    },
    video: { name: 'Video', keywords: 'camera meeting film record' },
    'share-2': { name: 'Share', keywords: 'network social send' },
    briefcase: { name: 'Business', keywords: 'work job case corporate' },
    'building-2': { name: 'Company', keywords: 'office corporate headquarters' },
    'trending-up': {
      name: 'Growth',
      keywords: 'increase rise chart trend up',
    },
    'chart-column': {
      name: 'Bar chart',
      keywords: 'statistics analytics graph report',
    },
    'chart-pie': { name: 'Pie chart', keywords: 'statistics share breakdown' },
    award: { name: 'Award', keywords: 'prize medal certified quality' },
    handshake: {
      name: 'Partnership',
      keywords: 'deal agreement alliance trust',
    },
    lightbulb: { name: 'Idea', keywords: 'bulb insight tip innovation' },
    megaphone: {
      name: 'Announcement',
      keywords: 'news notice marketing promotion broadcast',
    },
    lock: { name: 'Lock', keywords: 'secure private closed' },
    key: { name: 'Key', keywords: 'password access login' },
    'shield-check': {
      name: 'Security',
      keywords: 'shield protected safe verified',
    },
    info: { name: 'Information', keywords: 'detail note about' },
    'triangle-alert': { name: 'Warning', keywords: 'alert caution danger' },
    'circle-help': { name: 'Help', keywords: 'question support faq' },
    zap: { name: 'Fast', keywords: 'lightning bolt power energy' },
    'japanese-yen': { name: 'Yen', keywords: 'money currency price japan' },
    'dollar-sign': { name: 'Dollar', keywords: 'money currency price usd' },
    euro: { name: 'Euro', keywords: 'money currency price eur' },
    'credit-card': { name: 'Payment', keywords: 'card credit pay checkout' },
    wallet: { name: 'Wallet', keywords: 'purse money balance' },
    banknote: { name: 'Cash', keywords: 'note bill money currency' },
    coins: { name: 'Coins', keywords: 'money change savings cost' },
    'piggy-bank': { name: 'Savings', keywords: 'save deposit budget' },
    receipt: { name: 'Receipt', keywords: 'invoice bill expense' },
    calculator: { name: 'Calculator', keywords: 'maths sum count estimate' },
    percent: { name: 'Percent', keywords: 'discount rate sale interest' },
    'shopping-cart': { name: 'Cart', keywords: 'shop buy basket ecommerce' },
    landmark: { name: 'Bank', keywords: 'government institution museum civic' },
    'graduation-cap': {
      name: 'Education',
      keywords: 'school university student graduate learning',
    },
    school: { name: 'School', keywords: 'education class building study' },
    hospital: { name: 'Hospital', keywords: 'clinic medical health care' },
    store: { name: 'Shop', keywords: 'store retail shopfront market' },
    building: { name: 'Building', keywords: 'office block property' },
    factory: { name: 'Factory', keywords: 'plant manufacturing industry' },
    warehouse: { name: 'Warehouse', keywords: 'storage logistics depot' },
    hotel: { name: 'Hotel', keywords: 'accommodation stay travel lodging' },
    utensils: { name: 'Restaurant', keywords: 'food dining eat cutlery' },
    car: { name: 'Car', keywords: 'vehicle drive automobile' },
    bus: { name: 'Bus', keywords: 'vehicle transit coach' },
    'train-front': { name: 'Train', keywords: 'railway station commute' },
    plane: { name: 'Plane', keywords: 'flight airport travel airline' },
    bike: { name: 'Bicycle', keywords: 'cycle ride bike' },
    ship: { name: 'Ship', keywords: 'boat sea freight port' },
    truck: { name: 'Truck', keywords: 'delivery shipping lorry freight' },
    fuel: { name: 'Fuel', keywords: 'petrol gas station energy' },
    map: { name: 'Map', keywords: 'route directions area' },
    navigation: { name: 'Navigation', keywords: 'direction gps route compass' },
    smartphone: { name: 'Smartphone', keywords: 'mobile phone device app' },
    tablet: { name: 'Tablet', keywords: 'ipad device screen mobile' },
    laptop: { name: 'Laptop', keywords: 'computer notebook pc device' },
    monitor: { name: 'Desktop', keywords: 'screen display computer pc' },
    wifi: { name: 'Wi-Fi', keywords: 'network wireless internet signal' },
    cloud: { name: 'Cloud', keywords: 'online storage saas server' },
    server: { name: 'Server', keywords: 'hosting infrastructure rack' },
    cpu: { name: 'Processor', keywords: 'chip hardware cpu ai' },
    code: { name: 'Code', keywords: 'development programming developer' },
    bot: { name: 'Bot', keywords: 'ai robot chatbot automation' },
    'mouse-pointer-click': {
      name: 'Click',
      keywords: 'cursor pointer tap select action',
    },
  },
  pdfMergerPage: {
    metaTitle:
      'Combine Files Into One - PDF Merger by Yoshinya | Free, No Sign-up',
    metaDescription:
      'Put several PDFs together in the order you choose, and take only the pages you need. Up to 100 files at once, free, no sign-up, and nothing is ever uploaded — your PDFs stay in your browser.',
    heading: 'PDF Merger by Yoshinya',
    toolName: 'PDF Merger by Yoshinya',
    toolDescription:
      'Puts several PDFs into one file, in your order, using only the pages you pick.',
    lead: 'Invoices and receipts that have to go out as one file at month end, a scanner that saved every sheet separately, a submission that wants only some pages of each form — merging PDFs is the chore every free service asks you to upload for. PDF Merger by Yoshinya puts up to 100 files together in the order you choose, taking only the pages you name from each. Your PDFs are never sent to a server — it all happens inside your browser — so contracts and invoices are safe here.',
    privacyNote:
      'Your PDFs are not sent to a server. All processing happens in your browser.',
  },
  pdfMerger: {
    // Input
    addHeading: '① Add PDFs',
    dropzone: 'Drop PDF files here, or click to choose',
    dropzoneHint: 'Several at once is fine',
    supportedFormats: 'Supported: .pdf',
    addMore: '+ Add files',
    rejectedHeading: 'Files that could not be added',
    dismiss: 'Dismiss',
    // The list
    orderHeading: '② Set the order and the pages',
    summary: (files: number, pages: number) =>
      `${files} file${files === 1 ? '' : 's'}, ${pages} page${pages === 1 ? '' : 's'}`,
    sortByName: 'Name order',
    reverse: 'Reverse',
    removeAll: 'Remove all',
    removeAllConfirm: 'Remove every file from the list?',
    dragHandle: 'Drag to reorder',
    moveUp: 'Move up',
    moveDown: 'Move down',
    remove: 'Remove',
    pageCount: (n: number) => `${n} page${n === 1 ? '' : 's'}`,
    reading: 'Reading…',
    pageRangeLabel: 'Pages to use',
    pageRangePlaceholder: 'All pages',
    pageRangeHint: 'e.g. 1-3, 5, 8-',
    usingAll: 'Using all pages',
    usingSome: (n: number) => `Using ${n} page${n === 1 ? '' : 's'}`,
    // Output
    runHeading: '③ Merge and download',
    outputNameLabel: 'File name',
    outputPages: (n: number) =>
      `The merged file will have ${n} page${n === 1 ? '' : 's'}.`,
    merge: 'Merge and download',
    merging: (done: number, total: number) =>
      `Merging… ${done} / ${total} files`,
    merged: (files: number, pages: number) =>
      `Done. ${files} file${files === 1 ? '' : 's'} became ${pages} page${pages === 1 ? '' : 's'}.`,
    needTwo: 'Add at least one PDF that can be merged.',
    // Warnings and errors
    warnings: {
      signed: 'Signed. The signature will not survive the merge.',
      has_form: 'Has form fields. They will not survive the merge.',
    },
    errors: {
      not_pdf: 'Not a PDF file.',
      empty_file: 'The file is empty.',
      corrupted: 'This PDF could not be read.',
      encrypted: 'Password-protected PDFs cannot be merged.',
      file_too_large: 'Larger than the 100 MB per-file limit.',
      total_too_large: 'Over the 500 MB total limit.',
      too_many_files: 'Over the limit of 100 files.',
      out_of_memory: 'Not enough memory to handle this file.',
      range_invalid: 'This page range cannot be read.',
      range_out_of_bounds: 'That page does not exist in this file.',
      merge_failed: 'The merge failed.',
    },
  },
  pdfPageOrganizerPage: {
    metaTitle:
      'Split, Extract, Delete and Rotate - PDF Page Organizer by Yoshinya | Free, No Sign-up',
    metaDescription:
      'Reorder, rotate and delete the pages of a PDF, or split one document into several, working from thumbnails. Free, no sign-up, and nothing is ever uploaded — your PDF stays in your browser.',
    heading: 'PDF Page Organizer by Yoshinya',
    toolName: 'PDF Page Organizer by Yoshinya',
    toolDescription:
      'Reorders, rotates and deletes the pages of a PDF, and splits one document into several.',
    lead: "A scan came out with some pages sideways, blank sheets and duplicates are mixed in, or only part of the document should be passed on — tidying up a PDF's pages is fiddly work. PDF Page Organizer by Yoshinya shows every page as a thumbnail and rotates, deletes, reorders and splits hundreds of them at a time, with undo for everything you do. Your PDF is never sent to a server — it all happens inside your browser — so contracts and invoices are safe here.",
    privacyNote:
      'Your PDF is not sent to a server. All processing happens in your browser.',
  },
  pdfPageOrganizer: {
    // Input
    addHeading: '① Add a PDF',
    dropzone: 'Drop a PDF file here, or click to choose',
    dropzoneHint: 'One document at a time, up to 1,000 pages',
    supportedFormats: 'Supported: .pdf',
    replaceFile: 'Open a different PDF',
    replaceConfirm:
      'Open a different PDF? The changes you have made will be lost.',
    reading: 'Opening…',
    fileSummary: (pages: number, size: string) =>
      `${pages} page${pages === 1 ? '' : 's'}, ${size}`,
    rejectedHeading: 'This file could not be opened',
    dismiss: 'Dismiss',
    warnings: {
      signed: 'This PDF is signed. The signature will not survive editing.',
      has_form: 'This PDF has form fields. They will not survive editing.',
    },
    // The grid
    editHeading: '② Edit the pages',
    selectAll: 'Select all',
    clearSelection: 'Clear selection',
    invertSelection: 'Invert selection',
    selectedCount: (n: number) =>
      n === 0 ? 'Nothing selected' : `${n} page${n === 1 ? '' : 's'} selected`,
    selectHint:
      'Click a page to select it, shift-click for a run of pages. With nothing selected, rotating turns every page.',
    rotateLeftAll: 'Rotate left',
    rotateRightAll: 'Rotate right',
    deleteSelected: 'Delete selected',
    keepSelected: 'Keep selected only',
    reverse: 'Reverse order',
    undo: 'Undo',
    redo: 'Redo',
    noPagesLeft: 'Every page has been deleted. Undo to bring one back.',
    // Cards
    dragHandle: 'Drag to reorder',
    sourcePage: (n: number) => `Originally page ${n}`,
    selectPage: (n: number) => `Select page ${n}`,
    moveBack: 'Move back',
    moveForward: 'Move forward',
    rotateLeft: 'Rotate this page left',
    rotateRight: 'Rotate this page right',
    deletePage: 'Delete this page',
    cutBefore: 'Cut before this page',
    cutHere: 'New file starts here',
    // Output
    runHeading: '③ Save',
    outputModeLegend: 'How to save',
    singleMode: 'Save as one PDF',
    splitMode: 'Save as separate files (zip)',
    splitModeLabel: 'Where to cut',
    splitByCuts: 'Cut where I say',
    splitEveryN: 'Every N pages',
    splitBySelection: 'Cut at the selected pages',
    splitSizeLabel: 'Pages per file',
    cutsHint:
      'Press *Cut before this page* on a card to start a new file there.',
    selectionHint: 'Each selected page becomes the first page of a new file.',
    everyNHint: 'A size of 1 gives you one file per page.',
    outputNameLabel: 'File name',
    outcomeSingle: (from: number, to: number) =>
      `${from} page${from === 1 ? '' : 's'} → ${to} page${to === 1 ? '' : 's'}.`,
    outcomeSplit: (files: number, ranges: string) =>
      `${files} files (${ranges}).`,
    download: 'Download',
    downloadZip: 'Download as zip',
    working: (done: number, total: number) =>
      `Saving… ${done} / ${total} files`,
    done: (files: number, pages: number) =>
      `Done. ${pages} page${pages === 1 ? '' : 's'} saved as ${files} file${files === 1 ? '' : 's'}.`,
    errors: {
      not_pdf: 'Not a PDF file.',
      empty_file: 'The file is empty.',
      corrupted: 'This PDF could not be read.',
      encrypted: 'Password-protected PDFs cannot be opened.',
      file_too_large: 'Larger than the 100 MB limit.',
      total_too_large: 'Over the 500 MB total limit.',
      too_many_files: 'One PDF at a time, please.',
      out_of_memory: 'Not enough memory to handle this file.',
      too_many_pages: 'Longer than the 1,000 page limit.',
      render_failed: 'No preview',
      no_pages_left: 'There are no pages left to save.',
      split_no_boundary: 'Nothing is cut yet, so this would save one file.',
      split_invalid: 'Pages per file has to be a whole number of at least 1.',
      organize_failed: 'The file could not be saved.',
    },
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
    compareHint:
      'Drag to compare · drag the image to pan · hold Space to see the original',
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
    // The comparison never draws an image above its own resolution, so a
    // resized output sits smaller in the frame. Printing the pixel size says
    // why, where the picture alone leaves it to be guessed.
    pixelSize: (size: string, width: number, height: number) =>
      `${size} (${width} × ${height} px)`,
    savedBy: (bytes: string, percent: string) =>
      `${bytes} smaller (${percent})`,
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
    // Unavailable formats stay listed rather than disappearing: the option is
    // worth knowing about, and a silently shorter menu reads as a missing
    // feature rather than as a limit of this browser.
    // Full screen on a narrow screen exists to make the picture big, so the
    // settings arrive on request rather than taking a third of it up front.
    showSettings: 'Settings',
    hideSettings: 'Close the settings',
    formatUnavailable: (name: string) =>
      `${name} (not supported by this browser)`,
    formatUnavailableHint:
      'Greyed-out formats cannot be written by this browser. Another browser, or a newer version of this one, will offer them.',
    backgroundLabel: 'Background behind transparency',
    backgroundHint:
      'JPEG has no transparency, so clear areas are filled with this colour.',
    qualityLabel: 'Quality',
    losslessAt100:
      'Quality 100 encodes WebP losslessly — pixel-identical to the original, and often smaller than quality 99. Use it when nothing may be lost.',
    useLossless: 'Use 100 (lossless)',
    qualityFlatTop:
      'Above roughly 90 the picture barely improves while the file keeps growing. If you want no loss at all, use 100.',
    // Replaces the old note that PNG could not be made smaller here. It could
    // not, while the canvas encoder was the only option — on an already
    // optimised source that encoder produced a larger file than the original.
    pngReduceLabel: 'Reduce the colours to shrink the file',
    pngReduceHint:
      'PNG compression is lossless and already applied, so the only way to make one smaller is to store fewer colours. This works well for logos, screenshots, illustrations and diagrams. Photographs may band — check the comparison.',
    pngMoreSettings: 'More settings',
    pngColorsLabel: 'Colours',
    pngDitherLabel: 'Smooth the gradients (dithering)',
    pngDitherHint:
      'Blends colours with a fine speckle instead of hard bands. Better for gradients, slightly larger for flat artwork.',
    pngLosslessOff:
      'Colour reduction is off, so this PNG is saved exactly as it is. Note that re-encoding an already optimised PNG can produce a larger file than the original.',
    applyQualityToRest: (quality: number, count: number) =>
      `Apply quality ${quality} to the remaining ${count}`,
    applyRestNone: 'No later images are waiting to be saved.',
    appliedQuality: (quality: number, count: number) =>
      `Applied quality ${quality} to ${count} image${count === 1 ? '' : 's'}.`,
    applyAllToRest: (count: number) =>
      `Apply all settings to the remaining ${count}`,
    applyAllHint:
      'Copies the format, quality and size of this image onto the later images that are still unsaved, replacing any adjustments they had.',
    appliedAll: (count: number) =>
      `Applied every setting to ${count} image${count === 1 ? '' : 's'}.`,
    notFollowed: (n: number) =>
      `${n} adjusted image${n === 1 ? '' : 's'} did not follow this change.`,
    includeThem: 'Change those too',
    moreActions: 'More',
    applyToAll: (n: number) =>
      `Apply these settings to all ${n} images (overwrites adjustments)`,
    applyToAllConfirm: (n: number) =>
      `Apply the current settings to all ${n} images? Images you adjusted individually and images you already saved will be overwritten.`,
    appliedToAll: (n: number) =>
      `Applied the current settings to all ${n} images.`,
    undo: 'Undo',
    resizeHeading: 'Resize',
    resizeEnable: 'Change the pixel size',
    widthLabel: 'Width',
    heightLabel: 'Height',
    keepRatio: 'Keep the aspect ratio',
    preventUpscale: 'Never enlarge beyond the original',
    distortWarning: 'These dimensions will stretch the image out of shape.',
    dimensionsPreview: (
      fromW: number,
      fromH: number,
      toW: number,
      toH: number,
    ) => `${fromW}×${fromH} → ${toW}×${toH}`,
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
        body: 'Quality 80 is a good starting point for photographs — most of the file disappears while the difference stays hard to see. Detailed textures, text inside an image, and flat illustrations show artefacts sooner, so compare those at 100% zoom before deciding. Below about 60 the damage is usually visible. Above about 90 the opposite happens — the picture stops improving while the file keeps growing — except at exactly 100, where WebP switches to lossless and comes out pixel-identical, often smaller than 99. PNG has no quality setting at all because it is lossless; to shrink a PNG, resize it or convert it to WebP.',
      },
      {
        heading: 'Privacy and security',
        body: 'Your images are decoded, compressed, and packed into a ZIP entirely inside your browser. Nothing is uploaded to a server, no account is required, and closing or reloading the page discards everything. Because the images never leave your device, the tool can be used with confidential or personal photos.',
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
    duplicatesBlock: 'Duplicate file names must be resolved before downloading',
    zipFailed: (message: string) => `Failed to generate the zip: ${message}`,
  },
};
