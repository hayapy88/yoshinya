import type { en } from './en'

export const ja: typeof en = {
  site: {
    brand: 'よしにゃ',
    xUrl: 'https://x.com/yoshinya_com',
    mascotAlt: 'よしにゃのマスコット「よしにゃん」',
  },
  nav: {
    languageLabel: '言語',
    switchLocale: 'English',
    switchLocaleTitle: 'View this page in English',
  },
  home: {
    metaTitle: 'よしにゃ｜面倒なことは、よしにゃに。',
    metaDescription:
      '面倒なことは、よしにゃに。毎週ひとつ、日々の小さな面倒を解決する便利ツールを公開します。無料で、ファイルはブラウザの外に出ません。',
    primary: '面倒なことは、よしにゃに。',
    supporting: '毎週ひとつ、日々の小さな面倒を解決する便利ツールを公開します。',
    toolsHeading: 'ツール一覧',
    cta: '無料で使う',
    privacyNote:
      'すべてのツールはブラウザ内で動作します。ファイルがアップロードされることはありません。',
  },
  fileRenamerPage: {
    metaTitle: 'ファイル名を一括変更｜よしにゃにファイルリネーム',
    metaDescription:
      'ブラウザ内で完結するファイル名一括変更ツール。並べ替え、プレフィックス・日付・連番トークンによる規則の組み立て、zipダウンロードに対応。ファイルはサーバーに送信されません。',
    heading: 'よしにゃにファイルリネーム',
    toolName: 'よしにゃにファイルリネーム',
    toolDescription: '複数のファイル名を、ブラウザ上でまとめて変更できます。',
  },
  footer: {
    privacy: 'プライバシーポリシー',
    terms: '利用規約',
    followX: 'Xをフォロー',
    copyright: (year: number) => `© ${year} よしにゃ`,
  },
  header: {
    tagline:
      '複数ファイルの名前をルールに沿って一括変更し、zipでダウンロードできるツールです。ファイルはサーバーに送信されず、すべてブラウザ内で処理されます。',
    languageLabel: '言語',
  },
  steps: {
    upload: '① ファイルのアップロード',
    rule: '② リネーム規則の組み立て',
    preview: '③ 新ファイル名のプレビュー',
  },
  upload: {
    dropzone: 'ここにファイルをドロップ、またはクリックして選択',
    reorderHint: 'ドラッグ&ドロップで並べ替えできます（この順序が連番の順になります）',
    thumbSizeLabel: '画像サイズ',
    thumbSmaller: 'プレビュー画像を小さくする',
    thumbLarger: 'プレビュー画像を大きくする',
    removeFile: (name: string) => `${name} を削除`,
    openPreview: (name: string) => `${name} のプレビューを大きく表示`,
    closePreview: 'プレビューを閉じる',
  },
  tokens: {
    text: '任意文字列',
    separator: '区切り文字',
    date: '日付',
    time: '時間',
    index: 'index',
    textNumbered: (n: number) => `任意文字列${n}`,
    separatorNumbered: (n: number) => `区切り文字${n}`,
  },
  rule: {
    hint: 'トークンを下の規則エリアにドラッグして、ファイル名の形を組み立てます',
    placeholder: 'ここにトークンをドロップ',
    extChip: '.拡張子',
    removeToken: (label: string) => `${label} を削除`,
    textPlaceholder: '例: 旅行',
    textError: (chars: string) =>
      `ファイル名に使えない文字が含まれています: ${chars}`,
    formatLabel: 'フォーマット',
    dateSourceLabel: '日付のソース',
    timeSourceLabel: '時間のソース',
    pickDate: '日付を指定',
    pickTime: '時刻を指定',
    useFileModified: 'ファイルの更新日時を使う',
    chooseDate: '日付を選択',
    chooseTime: '時刻を選択',
    separatorOptions: {
      underscore: '_（アンダースコア）',
      hyphen: '-（ハイフン）',
      dot: '.（ドット）',
    },
    indexStyles: {
      num1: '数字1桁（1, 2, 3...）',
      num2: '数字2桁（01, 02...）',
      num3: '数字3桁（001, 002...）',
      alphaLower: 'アルファベット小文字（a, b, c...）',
      alphaUpper: 'アルファベット大文字（A, B, C...）',
    },
  },
  preview: {
    addFilesGuide: 'ファイルを追加するとプレビューが表示されます',
    buildRuleGuide: 'リネーム規則を組み立てるとプレビューが表示されます',
    duplicateNotice:
      '⚠ 同名のファイルが発生します。indexトークンの追加などで名前が重複しないようにしてください。',
    originalName: '元のファイル名',
    newName: '新しいファイル名',
    duplicate: '重複',
  },
  download: {
    confirm: '確認してダウンロード',
    zipping: 'zipを生成中…',
    needFiles: 'ファイルを追加するとダウンロードできます',
    needRule: 'リネーム規則を組み立てるとダウンロードできます',
    fixTextErrors: '任意文字列のエラーを解消してください',
    duplicatesBlock: '同名のファイルが発生するためダウンロードできません',
    zipFailed: (message: string) => `zipの生成に失敗しました: ${message}`,
  },
}
