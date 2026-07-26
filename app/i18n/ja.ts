import type { en } from './en';

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
    metaTitle: 'よしにゃ｜ちょっと面倒？それ、よしにゃにおまかせ！',
    metaDescription:
      'ちょっと面倒？それ、よしにゃにおまかせ！日々のちょっとした面倒をよしなに解決する便利ツールを、毎週ひとつ公開します。無料で、ファイルは端末内で処理されます。',
    kicker: '毎週ひとつ、新しい便利を',
    primary: 'ちょっと面倒？それ、よしにゃにおまかせ！',
    supporting:
      '日々のちょっとした面倒をよしなに解決する便利ツールを、毎週ひとつ公開します。',
    toolsHeading: 'ツール一覧',
    cta: '無料で使う',
    privacyNote:
      'すべてのツールはブラウザ上で動作します。ファイルは端末内で処理され、外部サーバーには送信されません。',
  },
  fileRenamerPage: {
    metaTitle: 'ファイル名を一括変更｜よしにゃにファイルリネーム',
    metaDescription:
      'ブラウザ内で完結するファイル名一括変更ツール。並べ替え、プレフィックス・日付・連番トークンによる規則の組み立て、zipダウンロードに対応。ファイルはサーバーに送信されません。',
    heading: 'よしにゃにファイルリネーム',
    toolName: 'よしにゃにファイルリネーム',
    toolDescription: '複数のファイル名を、ブラウザ上でまとめて変更できます。',
  },
  imageSorterPage: {
    metaTitle: '画像をフォルダ分け・写真整理｜よしにゃに画像仕分け',
    metaDescription:
      '画像を見ながら、番号でサクサク仕分け。自由にフォルダを作って、フォルダ別のZIPにまとめて保存できます。画像分類・写真整理・フォルダ分けがブラウザだけで完結し、画像は外部へ送信されません。',
    heading: 'よしにゃに画像仕分け',
    toolName: 'よしにゃに画像仕分け',
    toolDescription:
      '画像を1枚ずつ見て番号でフォルダに仕分け、フォルダ別のZIPにまとめて保存できます。',
    intro:
      '画像を見ながら、番号でサクサク仕分け。自由にフォルダを作って、フォルダ別のZIPにまとめて保存できます。',
    privacyNote:
      '画像はブラウザ内で処理され、サーバーに送信されることはありません。',
    steps: {
      add: '① 画像を追加',
      folders: '② フォルダを作成',
      sort: '③ 番号で仕分け',
    },
    supportedFormats: '対応形式: JPEG・PNG・WebP・GIF などの画像',
  },
  imageSorter: {
    dropzone: 'ここに画像をドロップ、またはクリックして選択',
    nonImageSkipped: (count: number) =>
      `画像以外のファイルを${count}件スキップしました。`,
    imageCount: (n: number) => `画像${n}枚`,
    imagesAdded: (n: number) => `画像が${n}枚追加されました`,
    removeImage: (name: string) => `${name} を削除`,
    // フォルダ
    foldersHeading: 'フォルダ',
    foldersHint:
      '仕分け先のカテゴリごとにフォルダを作成します。フォルダ名は変更できます。',
    addFolder: 'フォルダを追加',
    newFolderName: (n: number) => `フォルダ${n}`,
    folderNamePlaceholder: 'フォルダ名',
    renameFolder: (name: string) => `${name} の名前を変更`,
    deleteFolder: (name: string) => `${name} を削除`,
    folderNameEmpty: 'フォルダ名を入力してください。',
    folderNameDuplicate: '同じ名前のフォルダがすでにあります。',
    deleteFolderConfirm: (name: string, n: number) =>
      `「${name}」を削除しますか？中の画像${n}枚は未仕分けに戻ります。`,
    startSorting: '仕分けを開始',
    needImages: '画像を追加してください。',
    needFolders: 'フォルダを1つ以上作成してください。',
    // 仕分け画面
    position: (current: number, total: number) => `${current} / ${total}`,
    sortedCount: (n: number) => `仕分け済み ${n}件`,
    remainingCount: (n: number) => `残り ${n}件`,
    inFolder: (name: string) => `所属: ${name}`,
    unsortedLabel: '未仕分け',
    keyboardHeading: 'キーボード操作',
    keyNumber: '数字キー 1〜9 — その番号のフォルダに仕分け',
    keySpace: 'スペース — 直前と同じフォルダに仕分け',
    keyArrows: '← / → — 前 / 次の画像',
    keyUndo: 'Backspace・Ctrl/⌘ + Z — 直前の操作を取り消し',
    overNineHint: '10番以降はボタンで選択してください（数字キー非対応）。',
    prev: '前へ',
    next: '次へ',
    undo: '元に戻す',
    undoneToast: '元に戻しました。',
    sortedToast: (name: string) => `「${name}」に移動しました。`,
    zoomIn: '拡大',
    zoomOut: '縮小',
    resetZoom: '表示をリセット',
    imageLoadError: 'この画像を読み込めませんでした。',
    skipImage: 'この画像をスキップ',
    allSorted: 'すべての画像を仕分けました。',
    goToReview: '最終確認・ダウンロード',
    backToSorting: '仕分けに戻る',
    // 最終確認
    reviewHeading: '最終確認',
    filterAll: 'すべて',
    filterUnsorted: '未仕分け',
    selectedCount: (n: number) => `${n}枚を選択中`,
    selectAll: 'すべて選択',
    clearSelection: '選択解除',
    move: '移動',
    dragHint: 'ヒント: 選択した画像をフォルダにドラッグ&ドロップでも移動できます。',
    moveTo: '移動先…',
    moveToUnsorted: '未仕分けに戻す',
    moveDone: (name: string, n: number) => `${n}枚を「${name}」に移動しました。`,
    emptyFilter: 'ここに画像はまだありません。',
    // ダウンロード
    download: 'ZIPをダウンロード',
    zipping: 'ZIPを生成中…',
    unsortedWarningTitle: '未仕分けの画像があります',
    unsortedWarning: (n: number) =>
      `${n}枚がまだどのフォルダにも入っていません。ダウンロード方法を選んでください:`,
    downloadAnyway: '未仕分けを除いてダウンロード',
    downloadWithUnsorted: '「未仕分け」フォルダに入れてダウンロード',
    reviewUnsorted: '未仕分けを確認',
    noSortedImages: '1枚以上を仕分けてからダウンロードしてください。',
    zipFailed: (message: string) => `ZIPの生成に失敗しました: ${message}`,
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
    reorderHint:
      'ドラッグ&ドロップで並べ替えできます（この順序が連番の順になります）',
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
    dimensions: '寸法',
    textNumbered: (n: number) => `任意文字列${n}`,
    separatorNumbered: (n: number) => `区切り文字${n}`,
  },
  rule: {
    hint: 'トークンを下の規則エリアにドラッグして、ファイル名の形を組み立てます',
    placeholder: 'ここにトークンをドロップ',
    dropSlotLabel: '挿入位置',
    extChip: '.拡張子',
    removeToken: (label: string) => `${label} を削除`,
    textPlaceholder: '例: キャンペーン',
    textError: (chars: string) =>
      `ファイル名に使えない文字が含まれています: ${chars}`,
    formatLabel: 'フォーマット',
    dimensionsFormats: {
      wxh: '幅×高さ（例: 1920x1080）',
      w: '幅のみ（例: 1920）',
      h: '高さのみ（例: 1080）',
    },
    dimensionsHint:
      '画像ファイルのみに適用されます（画像以外は寸法なしになります）。',
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
};
