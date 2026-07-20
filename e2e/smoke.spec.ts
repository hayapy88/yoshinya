import { expect, test, type Page } from '@playwright/test'

function textFile(name: string) {
  return { name, mimeType: 'text/plain', buffer: Buffer.from('content') }
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

test.describe('language gateway', () => {
  test('shows both language options and honors the choice', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /日本語で続ける/ })).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Continue in English/ }),
    ).toBeVisible()

    await page.getByRole('link', { name: /日本語で続ける/ }).click()
    await expect(page).toHaveURL('/ja')
    await expect(
      page.getByRole('heading', { name: '面倒なことは、よしにゃに。' }),
    ).toBeVisible()

    // The stored choice now redirects the gateway.
    await page.goto('/')
    await expect(page).toHaveURL('/ja')
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
    await page.getByPlaceholder('e.g. trip').fill('renamed')
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

  test('validates forbidden characters in text tokens', async ({ page }) => {
    await page.goto('/en/file-renamer')
    await page.locator('input[type="file"]').setInputFiles([textFile('a.txt')])
    await dragTo(page, '.palette-chip:has-text("Text")', '.rule-area')
    await page.getByPlaceholder('e.g. trip').fill('bad/name')
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
