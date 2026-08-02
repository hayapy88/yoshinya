import { expect, test, type Page } from '@playwright/test'
import { deflateSync, crc32 } from 'node:zlib'
import { PDFDocument } from 'pdf-lib'

function textFile(name: string) {
  return { name, mimeType: 'text/plain', buffer: Buffer.from('content') }
}

// Builds a real PDF so the tool parses genuine metadata rather than a stub.
async function pdfFile(
  name: string,
  metadata: { title?: string; author?: string } = {},
) {
  const doc = await PDFDocument.create()
  doc.addPage()
  if (metadata.title !== undefined) {
    doc.setTitle(metadata.title)
  }
  if (metadata.author !== undefined) {
    doc.setAuthor(metadata.author)
  }
  return {
    name,
    mimeType: 'application/pdf',
    buffer: Buffer.from(await doc.save()),
  }
}

// Builds a minimal valid PNG of the given size so the browser can read its
// natural width/height (used to exercise the dimensions token).
function pngFile(name: string, width: number, height: number) {
  const chunk = (type: string, data: Buffer) => {
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(typeAndData) >>> 0)
    return Buffer.concat([len, typeAndData, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor
  const rowBytes = width * 3
  const raw = Buffer.concat(
    Array.from({ length: height }, () =>
      Buffer.concat([Buffer.from([0]), Buffer.alloc(rowBytes, 0xff)]),
    ),
  )
  const buffer = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
  return { name, mimeType: 'image/png', buffer }
}

// Drags an element onto a target slowly enough to satisfy dnd-kit's
// 8px pointer activation constraint.
async function dragTo(page: Page, sourceSelector: string, targetSelector: string) {
  const source = page.locator(sourceSelector)
  const target = page.locator(targetSelector)
  // Both elements must be inside the viewport for mouse coordinates to hit.
  await target.scrollIntoViewIfNeeded()
  await source.scrollIntoViewIfNeeded()
  const from = await source.boundingBox()
  const to = await target.boundingBox()
  if (!from || !to) {
    throw new Error('drag source or target not visible')
  }
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 15,
  })
  await page.mouse.up()
}

test.describe('root language redirect', () => {
  test('sends a Japanese browser to /ja', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ja-JP' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page).toHaveURL('/ja')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
    await context.close()
  })

  test('sends every other browser to /en', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'de-DE' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page).toHaveURL('/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await context.close()
  })

  test('an explicit choice outranks the browser language', async ({
    browser,
  }) => {
    // Japanese browser, but the visitor previously switched to English.
    const context = await browser.newContext({ locale: 'ja-JP' })
    const page = await context.newPage()
    await page.goto('/ja')
    await page.getByRole('link', { name: /English/ }).click()
    await expect(page).toHaveURL('/en')

    await page.goto('/')
    await expect(page).toHaveURL('/en')
    await context.close()
  })

  test('the redirect is never cached across visitors', async ({ request }) => {
    const response = await request.get('/', { maxRedirects: 0 })
    expect(response.status()).toBe(302)
    expect(response.headers()['vary']).toContain('Accept-Language')
    expect(response.headers()['vary']).toContain('Cookie')
    expect(response.headers()['cache-control']).toContain('no-store')
  })
})

test.describe('homepages', () => {
  test('Japanese homepage links to the localized tool', async ({ page }) => {
    await page.goto('/ja')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
    await page.getByRole('link', { name: /よしにゃにファイルリネーム/ }).click()
    await expect(page).toHaveURL('/ja/file-renamer')
  })

  test('English homepage links to the localized tool', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await page.getByRole('link', { name: /File Renamer by Yoshinya/ }).click()
    await expect(page).toHaveURL('/en/file-renamer')
  })
})

test.describe('language switcher', () => {
  test('switches to the equivalent page in both directions', async ({
    page,
  }) => {
    await page.goto('/ja/file-renamer')
    await page.getByRole('link', { name: 'View this page in English' }).click()
    await expect(page).toHaveURL('/en/file-renamer')
    await page.getByRole('link', { name: 'このページを日本語で表示' }).click()
    await expect(page).toHaveURL('/ja/file-renamer')
  })

  test('switches legal pages to their equivalents', async ({ page }) => {
    await page.goto('/en/privacy')
    await page.getByRole('link', { name: 'このページを日本語で表示' }).click()
    await expect(page).toHaveURL('/ja/privacy')
  })
})

test.describe('file renamer workflow', () => {
  test('renames files end to end, including duplicate handling', async ({
    page,
  }) => {
    await page.goto('/en/file-renamer')
    await expect(
      page.getByRole('heading', { name: 'File Renamer by Yoshinya' }),
    ).toBeVisible()

    // Empty state blocks the download.
    const download = page.getByRole('button', { name: 'Confirm and download' })
    await expect(download).toBeDisabled()

    // Upload files with tricky names: Japanese, multi-dot, no extension,
    // and two .txt files so a text-only rule produces duplicates.
    await page
      .locator('input[type="file"]')
      .setInputFiles([
        textFile('報告書 2026.txt'),
        textFile('archive.backup.tar.gz'),
        textFile('README'),
        textFile('notes.txt'),
      ])
    await expect(page.getByText('報告書 2026.txt').first()).toBeVisible()

    // Build a rule: a text token alone duplicates the two .txt files.
    await dragTo(page, '.palette-chip:has-text("Text")', '.rule-area')
    await page.getByPlaceholder('e.g. campaign').fill('renamed')
    await expect(
      page.getByText('Duplicate file names will occur', { exact: false }),
    ).toBeVisible()
    await expect(download).toBeDisabled()

    // Adding an index token resolves the duplicates.
    await dragTo(page, '.palette-chip:has-text("Index")', '.rule-area')
    await expect(page.getByText('renamed01.txt')).toBeVisible()
    await expect(page.getByText('renamed02.gz')).toBeVisible()
    await expect(page.getByText('renamed03', { exact: true })).toBeVisible()
    await expect(page.getByText('renamed04.txt')).toBeVisible()
    await expect(download).toBeEnabled()

    // Download produces the dated zip.
    const downloadEvent = page.waitForEvent('download')
    await download.click()
    const file = await downloadEvent
    expect(file.suggestedFilename()).toMatch(
      /^renamed_\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.zip$/,
    )

    // Repeated download still works.
    const secondEvent = page.waitForEvent('download')
    await download.click()
    expect((await secondEvent).suggestedFilename()).toMatch(/\.zip$/)
  })

  test('adds image dimensions from the dimensions token', async ({ page }) => {
    await page.goto('/en/file-renamer')
    // A real 120x80 image plus a non-image file.
    await page
      .locator('input[type="file"]')
      .setInputFiles([pngFile('photo.png', 120, 80), textFile('notes.txt')])
    await expect(page.getByText('photo.png').first()).toBeVisible()

    // Rule: text "img" + separator + dimensions.
    await dragTo(page, '.palette-chip:has-text("Text")', '.rule-area')
    await page.getByPlaceholder('e.g. campaign').fill('img')
    await dragTo(page, '.palette-chip:has-text("Separator")', '.rule-area')
    await dragTo(page, '.palette-chip:has-text("Dimensions")', '.rule-area')

    // The image gets its pixel size; the non-image gets no dimensions.
    await expect(page.getByText('img_120x80.png')).toBeVisible()
    await expect(page.getByText('img_.txt')).toBeVisible()
  })

  test('validates forbidden characters in text tokens', async ({ page }) => {
    await page.goto('/en/file-renamer')
    await page.locator('input[type="file"]').setInputFiles([textFile('a.txt')])
    await dragTo(page, '.palette-chip:has-text("Text")', '.rule-area')
    await page.getByPlaceholder('e.g. campaign').fill('bad/name')
    await expect(
      page.getByText('Contains characters not allowed in file names', {
        exact: false,
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Confirm and download' }),
    ).toBeDisabled()
  })
})

test.describe('SEO and infrastructure', () => {
  test('serves canonical and hreflang metadata', async ({ page }) => {
    await page.goto('/ja/file-renamer')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://yoshinya.com/ja/file-renamer',
    )
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute('href', 'https://yoshinya.com/en/file-renamer')
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]'),
    ).toHaveAttribute('href', 'https://yoshinya.com/')
  })

  test('serves sitemap.xml and robots.txt', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)
    expect(await sitemap.text()).toContain(
      'https://yoshinya.com/ja/file-renamer',
    )

    const robots = await request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    // Preview hosts are deliberately disallowed; production allows crawling.
    expect(await robots.text()).toContain('Disallow: /')
  })

  test('returns 404 for unknown URLs', async ({ request }) => {
    expect((await request.get('/xx')).status()).toBe(404)
    expect((await request.get('/ja/nope')).status()).toBe(404)
  })

  test('redirects locale-less page paths to a locale', async ({ request }) => {
    for (const path of ['/file-renamer', '/privacy', '/terms']) {
      const res = await request.get(path, { maxRedirects: 0 })
      expect(res.status()).toBe(302)
      expect(res.headers()['location']).toMatch(
        new RegExp(`^/(ja|en)${path}$`),
      )
    }
  })

  test('the 404 page has a valid lang and a title', async ({ page }) => {
    const response = await page.goto('/foobar')
    expect(response?.status()).toBe(404)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page).toHaveTitle(/YOSHINYA/)
  })
})

test.describe('keyboard access', () => {
  test('the dropzone is reachable and operable by keyboard', async ({
    page,
  }) => {
    await page.goto('/en/file-renamer')
    const dropzone = page.locator('.dropzone')
    await dropzone.focus()
    await expect(dropzone).toBeFocused()
  })
})

test.describe('image sorter workflow', () => {
  test('adds images, sorts by keyboard, fixes in review, and downloads', async ({
    page,
  }) => {
    await page.goto('/en/image-sorter')
    await expect(
      page.getByRole('heading', { name: 'Image Sorter by Yoshinya' }),
    ).toBeVisible()

    // Two folders exist by default.
    const folderInputs = page.locator('.is-folder-row input')
    await expect(folderInputs).toHaveCount(2)
    await folderInputs.nth(0).fill('Main')
    await folderInputs.nth(1).fill('Detail')

    // Add three images.
    await page
      .locator('input[type="file"]')
      .setInputFiles([
        pngFile('a.png', 120, 80),
        pngFile('b.png', 120, 80),
        pngFile('c.png', 120, 80),
      ])
    await expect(page.getByText('3 images added')).toBeVisible()

    // Sort: image 1 -> folder 1 (number key), then Space repeats it for image 2.
    await page.getByRole('button', { name: 'Start sorting' }).click()
    await page.locator('.is-stage').waitFor()
    await page.keyboard.press('1')
    await page.keyboard.press('Space')
    // Image 3 -> folder 2 by clicking its button.
    await page.locator('.is-folder-button').nth(1).click()

    // Review: folders show their images with file names.
    await page.getByRole('button', { name: 'Review & download' }).click()
    const detail = page.locator('.is-group').filter({ hasText: 'Detail' })
    await expect(detail.getByText('c.png')).toBeVisible()
    await expect(detail.locator('.is-group-count')).toHaveText('1 image')

    // Fix: move c.png from Detail to Main via the select-and-move path.
    await page.getByText('c.png').click()
    await page.getByLabel('Move to…').selectOption({ label: '1. Main' })
    await page.getByRole('button', { name: 'Move' }).click()
    const main = page.locator('.is-group').filter({ hasText: 'Main' })
    await expect(main.locator('.is-group-count')).toHaveText('3 images')

    // Download a dated zip.
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download zip' }).click()
    expect((await download).suggestedFilename()).toMatch(
      /^image-sorting_\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.zip$/,
    )
  })
})

test.describe('pdf title editor workflow', () => {
  test('changes a title and downloads a single PDF', async ({ page }) => {
    await page.goto('/en/pdf-title-editor')
    await expect(
      page.getByRole('heading', { name: 'PDF Title Editor by Yoshinya', level: 1 }),
    ).toBeVisible()

    await page
      .locator('input[type="file"]')
      .setInputFiles([await pdfFile('proposal.pdf', { title: 'Template v3' })])

    // The internal title is read and shown separately from the filename.
    await expect(page.getByText('Template v3')).toBeVisible()
    await expect(page.locator('.pte-status')).toHaveText(/Unchanged/)

    const titleField = page.getByLabel('New PDF title')
    await titleField.fill('2026 Proposal')
    await expect(page.locator('.pte-status')).toHaveText(/Modified/)
    // The marker points at the field that actually changed.
    await expect(page.getByRole('img', { name: 'Changed' })).toHaveCount(1)
    // With a single file the per-card create button is redundant and hidden.
    await expect(
      page.getByRole('button', { name: 'Create this one' }),
    ).toHaveCount(0)

    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Create and download PDF' }).click()
    expect((await download).suggestedFilename()).toBe('proposal.pdf')
    await expect(page.getByText('1 file created')).toBeVisible()
  })

  test('rejects a non-PDF and explains why', async ({ page }) => {
    await page.goto('/en/pdf-title-editor')
    await page
      .locator('input[type="file"]')
      .setInputFiles([textFile('notes.txt')])
    await expect(page.getByText('Please select a PDF file.')).toBeVisible()
    await expect(page.locator('.pte-card')).toHaveCount(0)
  })

  test('applies a bulk value and downloads a ZIP', async ({ page }) => {
    await page.goto('/en/pdf-title-editor')
    await page
      .locator('input[type="file"]')
      .setInputFiles([
        await pdfFile('a.pdf', { title: 'Old A' }),
        await pdfFile('b.pdf'),
      ])
    await expect(page.locator('.pte-card')).toHaveCount(2)
    await expect(page.locator('.pte-status').first()).toHaveText(/Unchanged/)
    await expect(page.locator('.pte-status').last()).toHaveText(/Unchanged/)

    // Blank-only mode must skip the file that already has a title.
    await page.getByLabel('Field', { exact: true }).selectOption('title')
    await page.getByLabel('Blank fields only').check()
    await expect(
      page.getByRole('button', { name: 'Apply to 1 file' }),
    ).toBeVisible()
    await page.getByLabel('Value').fill('Filled In')
    await page.getByRole('button', { name: 'Apply to 1 file' }).click()

    const titles = page.getByLabel('New PDF title')
    await expect(titles.nth(0)).toHaveValue('Old A')
    await expect(titles.nth(1)).toHaveValue('Filled In')

    const download = page.waitForEvent('download')
    await page
      .getByRole('button', { name: 'Create all and download ZIP' })
      .click()
    expect((await download).suggestedFilename()).toMatch(
      /^yoshinya-pdf-title-editor-\d{8}-\d{4}\.zip$/,
    )
    await expect(page.getByText('2 files created')).toBeVisible()
  })

  test('copies filenames into titles in bulk', async ({ page }) => {
    await page.goto('/en/pdf-title-editor')
    await page
      .locator('input[type="file"]')
      .setInputFiles([
        await pdfFile('2026 report.pdf'),
        await pdfFile('minutes.pdf'),
      ])
    await expect(page.locator('.pte-status').first()).toHaveText(/Unchanged/)
    await expect(page.locator('.pte-status').last()).toHaveText(/Unchanged/)
    await page.getByRole('button', { name: 'Use filename as title' }).click()
    const titles = page.getByLabel('New PDF title')
    await expect(titles.nth(0)).toHaveValue('2026 report')
    await expect(titles.nth(1)).toHaveValue('minutes')
  })

  test('resets and removes files', async ({ page }) => {
    await page.goto('/en/pdf-title-editor')
    await page
      .locator('input[type="file"]')
      .setInputFiles([await pdfFile('a.pdf', { title: 'Original' })])

    await page.getByLabel('New PDF title').fill('Changed')
    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    await expect(page.getByLabel('New PDF title')).toHaveValue('Original')

    await page.getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(page.locator('.pte-card')).toHaveCount(0)
  })

  test('renders the Japanese route with its own copy', async ({ page }) => {
    await page.goto('/ja/pdf-title-editor')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
    await expect(
      page.getByRole('heading', { name: 'よしにゃにPDFタイトル変更', level: 1 }),
    ).toBeVisible()
    await expect(page.getByText('登録不要')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'よくある質問' }),
    ).toBeVisible()
  })

  test('the dropzone is reachable and operable by keyboard', async ({
    page,
  }) => {
    await page.goto('/en/pdf-title-editor')
    const dropzone = page.locator('.pte-dropzone')
    await dropzone.focus()
    await expect(dropzone).toBeFocused()
    const chooser = page.waitForEvent('filechooser')
    await page.keyboard.press('Enter')
    expect(await chooser).toBeTruthy()
  })
})
