import type { LocalizedLegalDocument } from './types'

// Initial concise terms of use for a free browser-based utility service.
// These are a starting draft, not professional legal advice.
export const termsContent: LocalizedLegalDocument = {
  en: {
    title: 'Terms of Use',
    updated: '2026-07-20',
    updatedLabel: 'Last updated: July 20, 2026',
    intro: [
      'These Terms of Use ("Terms") apply to the free browser-based tools provided at yoshinya.com ("the Service"). By using the Service you agree to these Terms.',
    ],
    sections: [
      {
        heading: 'Service availability',
        body: [
          'The Service is provided free of charge. We may change, suspend, or discontinue all or part of the Service at any time without notice, and we do not guarantee that the Service will always be available or error-free.',
        ],
      },
      {
        heading: 'Local processing and no file retention',
        body: [
          'Tools process your files inside your browser, and the Service does not store your files. There is nothing for us to retain, back up, or restore: once you close or reload the page, any work in progress is gone. Please download your results and keep your own backups.',
        ],
      },
      {
        heading: 'User responsibility',
        body: [
          'You are responsible for the files you process and for verifying the results before using them. Always keep the original files until you have confirmed the output is what you expect.',
        ],
      },
      {
        heading: 'Prohibited use',
        body: [
          'You must not: use the Service for unlawful purposes; attempt to disrupt, overload, or gain unauthorized access to the Service or its infrastructure; or misrepresent the Service as your own.',
        ],
      },
      {
        heading: 'Intellectual property',
        body: [
          'The Service, including its name, branding, design, and code, belongs to the operator of YOSHINYA or its licensors. Your files remain entirely yours; using the Service grants us no rights over them.',
        ],
      },
      {
        heading: 'Disclaimer and limitation of liability',
        body: [
          'The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, we are not liable for any damages arising from the use of, or inability to use, the Service, including loss of data or files.',
        ],
      },
      {
        heading: 'Changes to the Service and these Terms',
        body: [
          'We plan to keep adding and improving tools, and we may revise these Terms accordingly. The date above shows the latest revision. Continued use of the Service after an update constitutes acceptance of the revised Terms.',
        ],
      },
    ],
  },
  ja: {
    title: '利用規約',
    updated: '2026-07-20',
    updatedLabel: '最終更新日: 2026年7月20日',
    intro: [
      '本利用規約（以下「本規約」）は、yoshinya.com で提供される無料のブラウザツール（以下「本サービス」）の利用条件を定めるものです。本サービスを利用された時点で、本規約に同意いただいたものとみなします。',
    ],
    sections: [
      {
        heading: 'サービスの提供について',
        body: [
          '本サービスは無料で提供されます。当サイトは、事前の通知なく本サービスの全部または一部を変更・停止・終了することがあります。また、本サービスが常に利用可能であることや、エラーがないことを保証しません。',
        ],
      },
      {
        heading: 'ブラウザ内処理とファイルの非保存',
        body: [
          '本サービスのツールはファイルをブラウザ内で処理し、当サイトがファイルを保存することはありません。そのため、当サイト側でのファイルの保管・バックアップ・復元は行えません。ページを閉じたり再読み込みしたりすると作業内容は失われます。結果は必ずダウンロードし、ご自身でバックアップを保管してください。',
        ],
      },
      {
        heading: '利用者の責任',
        body: [
          '処理するファイルおよびその結果の確認は、利用者ご自身の責任で行ってください。出力結果が期待どおりであることを確認するまで、元のファイルを保管しておくことをおすすめします。',
        ],
      },
      {
        heading: '禁止事項',
        body: [
          '次の行為を禁止します: 法令に違反する目的での利用、本サービスやそのインフラへの妨害・過負荷・不正アクセスの試み、本サービスを自身のものと偽る行為。',
        ],
      },
      {
        heading: '知的財産権',
        body: [
          '本サービス（名称、ブランド、デザイン、コードを含む）に関する権利は、よしにゃの運営者またはそのライセンサーに帰属します。利用者のファイルに関する権利は利用者に帰属し、本サービスの利用によって当サイトがファイルに対する権利を取得することはありません。',
        ],
      },
      {
        heading: '免責事項',
        body: [
          '本サービスは現状有姿で提供され、いかなる保証も行いません。法令で認められる最大限の範囲において、本サービスの利用または利用不能から生じる損害（データやファイルの損失を含む）について、当サイトは責任を負いません。',
        ],
      },
      {
        heading: 'サービスおよび本規約の変更',
        body: [
          '当サイトは今後もツールの追加・改善を行う予定であり、それに応じて本規約を改定することがあります。最新の改定日は冒頭に記載します。改定後も本サービスを継続して利用された場合、改定後の規約に同意いただいたものとみなします。',
        ],
      },
    ],
  },
}
