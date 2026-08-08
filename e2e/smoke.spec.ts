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

test.describe('shared tool page structure', () => {
  // Every tool must open and close the same way: same badges, same privacy
  // note, a 使い方ガイド with an FAQ, and links to the other two tools.
  const tools = [
    { slug: 'file-renamer', heading: 'よしにゃにファイルリネーム' },
    { slug: 'image-sorter', heading: 'よしにゃに画像仕分け' },
    { slug: 'pdf-title-editor', heading: 'よしにゃにPDFタイトル変更' },
    { slug: 'image-compressor', heading: 'よしにゃにまとめて画像圧縮' },
  ]

  for (const tool of tools) {
    test(`${tool.slug} has the shared intro, guide, and related tools`, async ({
      page,
    }) => {
      await page.goto(`/ja/${tool.slug}`)
      await expect(
        page.getByRole('heading', { name: tool.heading, level: 1 }),
      ).toBeVisible()

      // The three promises, identically worded on every tool.
      for (const badge of ['無料', '登録不要', 'ブラウザ内で処理']) {
        await expect(page.locator('.tool-badges li', { hasText: badge })).toBeVisible()
      }
      await expect(page.locator('.tool-privacy')).toContainText(
        'すべての処理はブラウザ内で完結します',
      )

      await expect(
        page.getByRole('heading', { name: '使い方ガイド', level: 2 }),
      ).toBeVisible()
      for (const section of ['使い方', 'こんなときに便利', 'プライバシーと安全性', 'よくある質問', '関連ツール']) {
        await expect(
          page.getByRole('heading', { name: section, level: 3 }),
        ).toBeVisible()
      }

      // Related tools links to the other two, and never to itself.
      const related = page.locator('.tool-related a')
      await expect(related).toHaveCount(tools.length - 1)
      for (const other of tools.filter((t) => t.slug !== tool.slug)) {
        await expect(
          related.filter({ hasText: other.heading }),
        ).toHaveAttribute('href', `/ja/${other.slug}`)
      }
    })
  }

  test('the English pages carry the same structure', async ({ page }) => {
    await page.goto('/en/file-renamer')
    await expect(page.locator('.tool-badges li')).toHaveText([
      'Free',
      'No sign-up',
      'Processed in your browser',
    ])
    await expect(
      page.getByRole('heading', { name: 'Guide', level: 2 }),
    ).toBeVisible()
    await expect(page.locator('.tool-related a')).toHaveCount(3)
  })
})

test.describe('image compressor workflow', () => {
  // Real PNGs, built by the same helper the sorter tests use, so the browser
  // genuinely decodes and re-encodes them. Output is switched to WebP where a
  // test needs a quality slider — PNG output deliberately has none.
  const addImages = async (page: Page, names: string[]) => {
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles(names.map((name) => pngFile(name, 120, 90)))
  }
  const waitForCompare = (page: Page) =>
    expect(page.locator('.ic-divider')).toBeVisible({ timeout: 20000 })

  test('compresses an image and shows the before/after comparison', async ({
    page,
  }) => {
    await page.goto('/ja/image-compressor')
    await expect(
      page.getByRole('heading', { name: 'よしにゃにまとめて画像圧縮', level: 1 }),
    ).toBeVisible()

    await addImages(page, ['a.png'])
    await waitForCompare(page)
    await expect(page.locator('.ic-side-left')).toHaveText('変換前')
    await expect(page.locator('.ic-side-right')).toHaveText('変換後')
    await expect(page.locator('.ic-sizes')).toContainText('変換後')
  })

  test('png output offers no quality slider, and says why', async ({ page }) => {
    await page.goto('/ja/image-compressor')
    await addImages(page, ['a.png'])
    await waitForCompare(page)
    // A png source kept in its original format is lossless: no quality to set.
    await expect(page.locator('#ic-quality')).toHaveCount(0)
    await expect(page.locator('.ic-lossless')).toContainText('PNGは可逆圧縮')
  })

  test('bulk quality applies only to later unsaved images, and undo restores them', async ({
    page,
  }) => {
    await page.goto('/ja/image-compressor')
    await addImages(page, ['a.png', 'b.png', 'c.png'])
    await expect(page.locator('.ic-thumb')).toHaveCount(3)
    await waitForCompare(page)

    // WebP everywhere, so quality is meaningful for all three.
    await page.getByLabel('出力形式').selectOption('webp')
    await expect(page.locator('#ic-quality')).toBeVisible()

    // Adjust this image alone, leaving the others on the shared setting.
    await page.getByLabel('この画像のみ').check()
    await page.locator('#ic-quality').fill('40')

    // The button states the value and how many images it will touch: the two
    // that follow the current one.
    const apply = page.getByRole('button', { name: /品質40を残り2枚に適用/ })
    await expect(apply).toBeVisible()
    await apply.click()
    await expect(page.locator('.ic-toast')).toContainText('残り2枚に適用しました')

    await page.locator('.ic-thumb').nth(1).click()
    await expect(page.locator('#ic-quality')).toHaveValue('40')

    await page.getByRole('button', { name: '元に戻す' }).click()
    await expect(page.locator('#ic-quality')).toHaveValue('80')

    // The image the user was editing keeps what they set on it.
    await page.locator('.ic-thumb').nth(0).click()
    await expect(page.locator('#ic-quality')).toHaveValue('40')
  })

  test('downloads one image and moves to the next', async ({ page }) => {
    await page.goto('/ja/image-compressor')
    await addImages(page, ['a.png', 'b.png'])
    await waitForCompare(page)

    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'ダウンロードして次へ' }).click()
    expect((await download).suggestedFilename()).toBe('a.png')

    await expect(page.locator('.ic-thumb').nth(1)).toHaveAttribute('aria-current', 'true')
    await expect(page.locator('.ic-thumb').nth(0)).toContainText('保存済み')
    // Only one image is left to save, so the button changes wording.
    await expect(
      page.getByRole('button', { name: 'ダウンロードして完了' }),
    ).toBeVisible()
  })

  test('changing the format changes the download extension', async ({ page }) => {
    await page.goto('/ja/image-compressor')
    await addImages(page, ['a.png'])
    await waitForCompare(page)
    await page.getByLabel('出力形式').selectOption('webp')
    await expect(page.locator('#ic-quality')).toBeVisible()

    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'ダウンロード', exact: true }).click()
    expect((await download).suggestedFilename()).toBe('a.webp')
  })

  test('downloads everything as a ZIP', async ({ page }) => {
    await page.goto('/ja/image-compressor')
    await addImages(page, ['a.png', 'b.png'])
    await waitForCompare(page)

    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'すべてZIPでダウンロード' }).click()
    expect((await download).suggestedFilename()).toBe('yoshinya-compressed-images.zip')
  })

  test('the comparison boundary stays under the divider when zoomed', async ({
    page,
  }) => {
    // clip-path resolves in the clipped element's own coordinate space. Putting
    // it on the transformed layer made the visible seam zoom away from the
    // divider, so the invariant worth pinning is that the clipped box is not
    // itself transformed.
    await page.goto('/ja/image-compressor')
    await addImages(page, ['a.png'])
    await waitForCompare(page)

    await page.getByRole('button', { name: '拡大' }).click()
    await page.getByRole('button', { name: '拡大' }).click()

    const geometry = await page.evaluate(() => {
      const q = (sel: string) =>
        (globalThis as unknown as { document: { querySelector(s: string): unknown } })
          .document.querySelector(sel) as {
          getBoundingClientRect(): { left: number; width: number }
        } | null
      const win = globalThis as unknown as {
        getComputedStyle(el: unknown): { transform: string; clipPath: string }
      }
      const stage = q('.ic-stage')!
      const clip = q('.ic-clip')!
      const layer = q('.ic-clip .ic-layer')!
      return {
        clipTransform: win.getComputedStyle(clip).transform,
        layerTransform: win.getComputedStyle(layer).transform,
        clipPath: win.getComputedStyle(clip).clipPath,
        sameBox:
          Math.abs(clip.getBoundingClientRect().left - stage.getBoundingClientRect().left) < 1 &&
          Math.abs(clip.getBoundingClientRect().width - stage.getBoundingClientRect().width) < 1,
      }
    })

    // The clipped box tracks the stage exactly, and only the layer inside moves.
    expect(geometry.clipTransform).toBe('none')
    expect(geometry.layerTransform).not.toBe('none')
    expect(geometry.sameBox).toBe(true)
    expect(geometry.clipPath).toContain('inset')
  })

  test('steers a high webp quality toward the lossless setting', async ({ page }) => {
    // Chrome's WebP encoder only goes lossless at exactly 100; 99 loses about
    // as much as 80 and produces a much larger file. Someone reaching for 99
    // wants no loss, so the UI has to say where that actually is.
    await page.goto('/ja/image-compressor')
    await addImages(page, ['a.png'])
    await waitForCompare(page)
    await page.getByLabel('出力形式').selectOption('webp')
    await page.locator('#ic-quality').fill('99')
    // Scoped to the panel: the same explanation also appears in the guide below.
    const panel = page.locator('.ic-settings')
    await expect(panel.getByText('画質はほとんど改善せず', { exact: false })).toBeVisible()

    await page.getByRole('button', { name: '100（可逆）にする' }).click()
    await expect(page.locator('#ic-quality')).toHaveValue('100')
    await expect(panel.getByText('可逆で書き出します', { exact: false })).toBeVisible()
  })

  test('resize starts from the image size, and the ratio keeps the pair in step', async ({
    page,
  }) => {
    await page.goto('/ja/image-compressor')
    // 120x90, a 4:3 image, so the derived partner value is predictable.
    await addImages(page, ['a.png'])
    await waitForCompare(page)

    await page.getByText('サイズ変更', { exact: true }).click()
    await page.getByLabel('ピクセルサイズを変更する').check()

    // Seeded with the real dimensions rather than left empty, where the number
    // spinner's first press would jump to 1.
    await expect(page.getByLabel('幅')).toHaveValue('120')
    await expect(page.getByLabel('高さ')).toHaveValue('90')

    // With the ratio locked, editing one has to move the other, or the stale
    // value would silently constrain the result.
    await page.getByLabel('幅').fill('60')
    await expect(page.getByLabel('高さ')).toHaveValue('45')
  })

  test('an adjusted image keeps its own format until explicitly overwritten', async ({
    page,
  }) => {
    await page.goto('/ja/image-compressor')
    await addImages(page, ['a.png', 'b.png'])
    await waitForCompare(page)

    // Pin the first image to JPEG.
    await page.getByLabel('この画像のみ').check()
    await page.getByLabel('出力形式').selectOption('jpeg')
    await expect(page.locator('.ic-thumb').first()).toContainText('個別調整')

    // The shared settings deliberately skip it, and the panel says so.
    await page.getByLabel('共通設定').check()
    await expect(page.getByText('個別調整した1枚には反映されません', { exact: false })).toBeVisible()
    await page.getByLabel('出力形式').selectOption('webp')
    await page.waitForTimeout(600)
    await expect(page.getByLabel('出力形式')).toHaveValue('jpeg')

    // The way out is offered at the moment of confusion, not buried in a menu.
    await expect(page.locator('.ic-toast')).toContainText('反映していません')
    await page.getByRole('button', { name: 'これも変更する' }).click()
    await page.waitForTimeout(600)
    await expect(page.getByLabel('出力形式')).toHaveValue('webp')
    await expect(page.locator('.ic-thumb').first()).not.toContainText('個別調整')
  })

  test('the whole-batch override reaches downloaded and pinned images', async ({
    page,
  }) => {
    await page.goto('/ja/image-compressor')
    await addImages(page, ['a.png', 'b.png'])
    await waitForCompare(page)
    await page.getByLabel('この画像のみ').check()
    await page.getByLabel('出力形式').selectOption('jpeg')
    await expect(page.locator('.ic-thumb').first()).toContainText('個別調整')
    await page.getByLabel('共通設定').check()

    // The escape hatch does reach it.
    page.once('dialog', (d) => void d.accept())
    await page.getByText('その他の操作', { exact: true }).click()
    await page.getByRole('button', { name: /現在の設定を全2枚に適用/ }).click()
    await expect(page.locator('.ic-thumb').first()).not.toContainText('個別調整')
  })

  test('the content lines up with the site frame', async ({ page }) => {
    // This tool was briefly 84rem wide while the header and footer are 72rem,
    // so on a wide screen the page content stuck out past its own frame.
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto('/ja/image-compressor')
    const edges = await page.evaluate(() => {
      const d = (globalThis as unknown as {
        document: { querySelector(s: string): { getBoundingClientRect(): { left: number } } }
      }).document
      const left = (sel: string) => Math.round(d.querySelector(sel).getBoundingClientRect().left)
      return [left('header a picture'), left('.ic-root h1'), left('footer p')]
    })
    expect(new Set(edges).size).toBe(1)
  })

  test('the view controls are one consistent row', async ({ page }) => {
    // The zoom stepper, fit and full screen are all view commands, so they get
    // the same height. One of them was an underlined link and another fell back
    // to the tall default because its style was never defined.
    await page.goto('/ja/image-compressor')
    await addImages(page, ['a.png'])
    await waitForCompare(page)
    const heights = await page.evaluate(() => {
      const d = (globalThis as unknown as {
        document: { querySelectorAll(s: string): ArrayLike<{ getBoundingClientRect(): { height: number } }> }
      }).document
      return Array.from(d.querySelectorAll('.ic-zoom .ic-zoom-step, .ic-zoom .ic-btn')).map(
        (e) => Math.round(e.getBoundingClientRect().height),
      )
    })
    expect(heights.length).toBe(4)
    expect(new Set(heights).size).toBe(1)
  })

  test('compares full screen and comes back', async ({ page }) => {
    await page.goto('/ja/image-compressor')
    await addImages(page, ['a.png', 'b.png'])
    await waitForCompare(page)

    await page.getByRole('button', { name: '全画面で比較' }).click()
    const viewer = page.locator('.ic-viewer.ic-fullscreen')
    await expect(viewer).toBeVisible()

    // The stage really does take the screen, not the page column.
    const box = (await page.locator('.ic-stage').boundingBox())!
    const size = page.viewportSize()!
    expect(box.width).toBeGreaterThan(size.width * 0.9)

    // Every setting is reachable without leaving — a quality slider alone was
    // not enough, because PNG output has none and left nothing to adjust.
    await expect(page.locator('.ic-fs-panel')).toBeVisible()
    await page.getByLabel('出力形式').selectOption('webp')
    await expect(page.locator('.ic-fs-panel #ic-quality')).toBeVisible()

    // Still able to judge and save without leaving.
    await expect(page.locator('.ic-fs-bar')).toBeVisible()
    await expect(
      page.locator('.ic-fs-bar').getByRole('button', { name: /ダウンロードして/ }),
    ).toBeVisible()

    // Escape gets out, which is the only exit some users will look for.
    await page.keyboard.press('Escape')
    await expect(viewer).toHaveCount(0)
    await expect(page.locator('.ic-divider')).toBeVisible()
  })

  test('never makes the page wider than the screen', async ({ page }) => {
    // A page wider than the device makes the browser zoom out, shrinking every
    // control. The thumbnail strip caused exactly that until it was given a
    // min-width, so the invariant is worth pinning.
    await page.goto('/ja/image-compressor')
    await addImages(page, ['a.png', 'b.png', 'c.png', 'd.png'])
    await waitForCompare(page)
    const overflow = await page.evaluate(() => {
      const el = (globalThis as unknown as {
        document: { documentElement: { scrollWidth: number; clientWidth: number } }
      }).document.documentElement
      return { scroll: el.scrollWidth, client: el.clientWidth }
    })
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client + 1)
  })

  test('refuses an unsupported format and keeps the rest', async ({ page }) => {
    await page.goto('/ja/image-compressor')
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles([textFile('notes.txt'), pngFile('ok.png', 120, 90)])
    await expect(
      page.getByText('この形式には対応していません', { exact: false }),
    ).toBeVisible()
    await expect(page.locator('.ic-thumb')).toHaveCount(1)
  })
})
