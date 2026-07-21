import type { LocalizedLegalDocument } from './types'

// Concise privacy policy for a free browser-based utility service. The wording
// reflects the actual implementation: tools process files inside the browser,
// a language cookie is set, and Google Tag Manager loads measurement tags on
// the production site. Update this document before changing any of that.
export const privacyContent: LocalizedLegalDocument = {
  en: {
    title: 'Privacy Policy',
    updated: '2026-07-21',
    updatedLabel: 'Last updated: July 21, 2026',
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
          'The site sets a cookie ("yoshinya_locale") to remember the language you chose; it contains only "ja" or "en". In addition, Google Tag Manager and the measurement tags it loads (see Analytics) may set their own cookies.',
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
          'On the production site (yoshinya.com) we use Google Tag Manager to load measurement tags such as website analytics. These tags may set cookies and collect standard usage data — for example the pages you visit, referring page, browser and device type, and an approximate location derived from your IP address. This data is processed by Google; please refer to Google’s privacy policy for details.',
          'Analytics never receives the names or contents of the files you process. All file processing stays in your browser and is never sent to us or to Google.',
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
    updated: '2026-07-21',
    updatedLabel: '最終更新日: 2026年7月21日',
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
          '当サイトは、選択された言語を記憶するためのCookie（yoshinya_locale）を使用します。内容は「ja」または「en」のみです。加えて、Google タグマネージャーおよびそれが読み込む計測タグ（「アクセス解析について」を参照）が独自のCookieを設定する場合があります。',
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
          '本番サイト（yoshinya.com）では、Google タグマネージャーを利用して、アクセス解析などの計測タグを読み込んでいます。これらのタグはCookieを設定し、閲覧ページ・参照元・ブラウザや端末の種類・IPアドレスから推定される大まかな地域といった一般的な利用データを収集する場合があります。これらのデータはGoogleによって処理されます。詳細はGoogleのプライバシーポリシーをご確認ください。',
          'アクセス解析が、処理対象のファイルの名前や内容を受け取ることはありません。ファイルの処理はすべてブラウザ内で行われ、当サイトやGoogleに送信されることはありません。',
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
