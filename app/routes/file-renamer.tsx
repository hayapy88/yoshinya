import type { Route } from './+types/file-renamer'
import { dictionaries, isLocale } from '~/i18n/locale'
import { fileRenamerJsonLd, isProductionHost, pageMeta } from '~/lib/seo'
import FileRenamerTool from '~/features/file-renamer/FileRenamerTool'

export function meta({ params, matches }: Route.MetaArgs) {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const t = dictionaries[locale]
  const rootData = matches[0]?.loaderData
  return pageMeta({
    locale,
    path: '/file-renamer',
    title: t.fileRenamerPage.metaTitle,
    description: t.fileRenamerPage.metaDescription,
    noindex: !isProductionHost(rootData?.host),
    jsonLd: [fileRenamerJsonLd(locale)],
  })
}

export default function FileRenamerPage() {
  return <FileRenamerTool />
}
