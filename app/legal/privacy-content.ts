import type { LocalizedLegalDocument } from './types'

// Initial concise privacy policy for a free browser-based utility service.
// The wording deliberately reflects the actual implementation: tools process
// files inside the browser, the only cookie is the language preference, and
// no analytics are active. Update this document before changing any of that.
export const privacyContent: LocalizedLegalDocument = {
  en: {
    title: 'Privacy Policy',
    updated: '2026-07-20',
    updatedLabel: 'Last updated: July 20, 2026',
    intro: [
      'YOSHINYA ("we") provides free browser-based tools at yoshinya.com. This policy explains what information is — and is not — handled when you use the site.',
    ],
    sections: [
      {
        heading: 'Your files stay in your browser',
        body: [
          'Tools on this site, including File Renamer, process the files you select entirely within your browser. Your files, file names, and their contents are not uploaded to or stored on our servers. Downloads (such as the generated zip) are created locally on your device.',
        ],
      },
      {
        heading: 'Cookies',
        body: [
          'The site uses a single cookie ("yoshinya_locale") to remember the language you chose. It contains only "ja" or "en" and is not used for tracking or advertising.',
        ],
      },
      {
        heading: 'Server logs',
        body: [
          'The site is delivered through Cloudflare. Like most web infrastructure, Cloudflare may process basic technical request data (such as IP address and browser information) to serve and protect the site. We do not use this data to identify you.',
        ],
      },
      {
        heading: 'Analytics',
        body: [
          'No analytics or advertising services are currently active on this site. If we introduce analytics in the future, this policy will be updated before it is enabled, and it will never collect the names or contents of your local files.',
        ],
      },
      {
        heading: 'Contact',
        body: [
          'For questions about this policy, contact us via X (Twitter): @yoshinya_com.',
        ],
      },
      {
        heading: 'Changes to this policy',
        body: [
          'We may update this policy as the service evolves. The date above shows the latest revision. Continued use of the site after an update constitutes acceptance of the revised policy.',
        ],
      },
    ],
  },
  ja: {
    title: 'プライバシーポリシー',
    updated: '2026-07-20',
    updatedLabel: '最終更新日: 2026年7月20日',
    intro: [
      'よしにゃ（以下「当サイト」）は、yoshinya.com において無料のブラウザツールを提供しています。本ポリシーでは、当サイトの利用にあたって、どのような情報が扱われるか（および扱われないか）を説明します。',
    ],
    sections: [
      {
        heading: 'ファイルはブラウザ内で処理されます',
        body: [
          'ファイルリネームをはじめとする当サイトのツールは、選択されたファイルをすべてブラウザ内で処理します。ファイル本体・ファイル名・その内容が当サイトのサーバーにアップロードまたは保存されることはありません。生成されるzipなどのダウンロードファイルも、お使いの端末内で作成されます。',
        ],
      },
      {
        heading: 'Cookieについて',
        body: [
          '当サイトは、選択された言語を記憶するためのCookie（yoshinya_locale）を1つだけ使用します。内容は「ja」または「en」のみで、トラッキングや広告には使用しません。',
        ],
      },
      {
        heading: 'サーバーログについて',
        body: [
          '当サイトはCloudflareを通じて配信されています。一般的なWebインフラと同様に、サイトの配信・保護のためにIPアドレスやブラウザ情報などの基本的な技術情報がCloudflareで処理されることがあります。当サイトがこれらの情報から個人を特定することはありません。',
        ],
      },
      {
        heading: 'アクセス解析について',
        body: [
          '現在、当サイトではアクセス解析ツールや広告サービスは使用していません。将来導入する場合は、有効化する前に本ポリシーを更新します。また、ローカルファイルの名前や内容を収集することはありません。',
        ],
      },
      {
        heading: 'お問い合わせ',
        body: [
          '本ポリシーに関するお問い合わせは、X（Twitter）アカウント @yoshinya_com までお願いします。',
        ],
      },
      {
        heading: '本ポリシーの変更',
        body: [
          'サービスの変化に応じて、本ポリシーを更新することがあります。最新の改定日は冒頭に記載します。更新後も当サイトを継続して利用された場合、改定後のポリシーに同意いただいたものとみなします。',
        ],
      },
    ],
  },
}
