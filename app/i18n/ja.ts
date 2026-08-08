import type { en } from './en';

export const ja: typeof en = {
  site: {
    brand: 'よしにゃ',
    xUrl: 'https://x.com/yoshinya_com',
    mascotAlt: 'よしにゃのマスコット「よしにゃん」',
  },
  // The three promises shown on every tool page. Shared so no tool words
  // the product's core claim differently.
  toolBadges: {
    free: '無料',
    noSignup: '登録不要',
    local: 'ブラウザ内で処理',
  },
  nav: {
    languageLabel: '言語',
    switchLocale: 'English',
    switchLocaleTitle: 'View this page in English',
  },
  home: {
    metaTitle: 'よしにゃ｜何か面倒に感じてる？それよしにゃにまかせて！',
    metaDescription:
      '何か面倒に感じてる？それよしにゃにまかせて！日々のちょっとした面倒をよしなに解決する便利ツールを、毎週ひとつ公開します。無料で、ファイルは端末内で処理されます。',
    kicker: '毎週ひとつ、新しい便利を',
    primary: '何か面倒に感じてる？それよしにゃにまかせて！',
    supporting:
      '日々のちょっとした面倒をよしなに解決する便利ツールを、毎週ひとつ公開します。',
    toolsHeading: 'ツール一覧',
    cta: '無料で使う',
    privacyNote:
      'すべてのツールはブラウザ上で動作します。ファイルは端末内で処理され、外部サーバーには送信されません。',
  },
  fileRenamerPage: {
    metaTitle: 'ファイル名を一括変更 - よしにゃにファイルリネーム｜無料・登録不要',
    metaDescription:
      'ブラウザ内で完結するファイル名一括変更ツール。並べ替え、プレフィックス・日付・連番トークンによる規則の組み立て、zipダウンロードに対応。ファイルはサーバーに送信されません。',
    heading: 'よしにゃにファイルリネーム',
    toolName: 'よしにゃにファイルリネーム',
    toolDescription: '複数のファイル名を、ブラウザ上でまとめて変更できます。',
    lead: 'ファイル名を1つずつ変えるのは手間がかかり、規則どおりに手作業で付けるのは間違いのもとです。プレフィックス・日付・連番でルールを一度組み立てれば、確定前にすべての新しい名前を確認でき、まとめてZIPでダウンロードできます。',
    privacyNote:
      'ファイルはサーバーに送信されません。すべての処理はブラウザ内で完結します。',
  },
  imageSorterPage: {
    metaTitle: '画像をフォルダ分け・写真整理 - よしにゃに画像仕分け｜無料・登録不要',
    metaDescription:
      '画像を見ながら、番号でサクサク仕分け。自由にフォルダを作って、フォルダ別のZIPにまとめて保存できます。画像分類・写真整理・フォルダ分けがブラウザだけで完結し、画像は外部へ送信されません。',
    heading: 'よしにゃに画像仕分け',
    toolName: 'よしにゃに画像仕分け',
    toolDescription:
      '画像を1枚ずつ見て番号でフォルダに仕分け、フォルダ別のZIPにまとめて保存できます。',
    lead:
      '画像を見ながら、番号でサクサク仕分け。自由にフォルダを作って、フォルダ別のZIPにまとめて保存できます。',
    privacyNote:
      '画像はサーバーに送信されません。すべての処理はブラウザ内で完結します。',
    steps: {
      add: '① 画像を追加',
      folders: '② フォルダを作成',
      sort: '③ 番号で仕分け',
    },
    supportedFormats: '対応形式: JPEG・PNG・WebP・GIF などの画像',
  },
  pdfTitleEditorPage: {
    metaTitle:
      'PDFのプロパティ・作成者を変更 - よしにゃにPDFタイトル変更｜無料・登録不要',
    metaDescription:
      'PDF内部のタイトル、作成者、件名、キーワードをブラウザ上で変更できます。複数PDFの一括編集にも対応。ファイルは外部へ送信されず、無料・登録不要です。',
    heading: 'よしにゃにPDFタイトル変更',
    toolName: 'よしにゃにPDFタイトル変更',
    toolDescription:
      'ファイル名ではなく、PDFの中に保存されたタイトルを変更できます。',
    lead: 'PDFを開いた時のタイトルが意図したものになっていなくて、変更したい時はないですか？このツールを使えば、PDF内部のタイトルや作成者情報などを、このページ上で直接書き換え、変更版をダウンロードすることができます。',
    privacyNote:
      'PDFはサーバーに送信されません。すべての処理はブラウザ内で完結します。',
  },
  pdfTitleEditor: {
    // Input
    addHeading: '① PDFを追加',
    dropzone: 'ここにPDFをドロップ、またはクリックして選択',
    dropzoneHint: '複数まとめて選択できます',
    addMore: '＋ PDFを追加',
    supportedFormats: '対応形式: .pdf',
    rejectedHeading: '追加できなかったファイル',
    dismiss: '閉じる',
    // File cards
    filesHeading: (n: number) => `② ${n}件のPDFを編集`,
    pages: (n: number) => `${n}ページ`,
    currentTitle: '現在のタイトル:',
    noTitle: 'タイトル未設定',
    newTitle: '新しいPDFタイトル',
    titlePlaceholder: '例: 2026年 決算報告',
    outputFileName: 'ダウンロード時のファイル名',
    outputFileNameHint: '空欄にすると元のファイル名のままになります。',
    otherMetadata: 'その他のメタデータ',
    title: 'タイトル',
    author: '作成者',
    subject: '件名',
    keywords: 'キーワード',
    keywordsPlaceholder: '報告書, 2026, 決算',
    keywordsHint: 'キーワードはカンマで区切ってください。',
    createThisOne: 'このPDFだけ作成',
    changedMarker: '変更あり',
    resetOne: '元に戻す',
    removeOne: '削除',
    status: {
      loading: '読み込み中',
      ready: '変更なし',
      modified: '変更あり',
      processing: '処理中',
      completed: '完了',
      warning: '警告',
      error: 'エラー',
    },
    errors: {
      not_pdf: 'PDFファイルを選択してください。',
      empty_file: 'このファイルは空です。',
      corrupted:
        'このPDFを読み込めませんでした。ファイルが壊れている可能性があります。',
      encrypted: 'パスワード付きPDFには対応していません。',
      signed:
        'このPDFには電子署名があります。保存すると署名が無効になるおそれがあるため、編集できません。',
      file_too_large: 'このファイルは上限の100MBを超えています。',
      total_too_large: 'このファイルを追加すると合計500MBの上限を超えます。',
      too_many_files: '一度に扱えるPDFは100件までです。',
      out_of_memory:
        'ブラウザのメモリが不足しました。ファイル数を減らすか、小さいファイルでお試しください。',
      write_failed: 'このPDFを保存できませんでした。',
    },
    // Batch
    batchHeading: 'すべてのPDFにまとめて適用',
    titleFromFileName: 'ファイル名をタイトルにする',
    fileNameFromTitle: 'タイトルをファイル名にする',
    batchFieldLabel: '項目',
    batchValueLabel: '値',
    batchModeLabel: '適用範囲',
    batchModeAll: 'すべてのファイル',
    batchModeBlank: '空欄のみ',
    applyToCount: (n: number) => `${n}件に適用`,
    resetAll: 'すべての変更を元に戻す',
    removeAll: 'すべて削除',
    removeAllConfirm: 'リストからすべてのPDFを削除しますか？',
    // Run
    runHeading: '③ 作成してダウンロード',
    createAll: 'すべて作成してZIPをダウンロード',
    createAndDownload: 'PDFを作成してダウンロード',
    processing: (done: number, total: number) =>
      `処理中 ${done} / ${total}…`,
    processed: (success: number, failed: number) =>
      failed === 0
        ? `完了 — ${success}件のファイルを作成しました。`
        : `${success}件を作成、${failed}件が失敗しました。成功したファイルはダウンロード済みです。`,
    readingFiles: 'PDFを読み込み中…',
    nothingToDo: '作成できるファイルがありません。',
    keptAvailable: (n: number) =>
      `作成した${n}件のPDFは、ページを再読み込みするまで再ダウンロードできます。`,
    zipFailed: (message: string) => `ZIPの作成に失敗しました: ${message}`,
  },
  fileRenamerGuide: {
    heading: '使い方ガイド',
    sections: [
      {
        heading: '使い方',
        steps: [
          'アップロードエリアにファイルをドロップするか、クリックして選択します。ブラウザ内で読み込まれ、アップロードは行われません。',
          'ファイルをドラッグして並べ替えます。この順序が連番トークンの番号順になります。',
          'トークンを規則エリアにドラッグして新しい名前を組み立てます。「任意文字列」「区切り文字」「日付」「時間」「連番」「寸法」が使えます。',
          'プレビューを確認します。各ファイルの元の名前と新しい名前が並び、重複があればダウンロード前に警告されます。',
          '「確認してダウンロード」を押します。リネームされたファイルが1つのZIPにまとまってダウンロードされます。',
        ],
      },
      {
        heading: 'こんなときに便利',
        items: [
          'カメラやスマホから取り込んだ写真が DSC_0431.JPG のような、中身の分からない名前のままになっている。',
          '取引先やモールへの納品で、ファイル名の命名規則が厳密に決まっている。',
          'スキャンした書類や領収書に、日付と連番を付けてから保管したい。',
          'サイトにアップロードする素材のファイル名を、規則的で分かりやすい形に揃えたい。',
          '受け取ったファイルの名前がバラバラで、1つずつ直すのは避けたい。',
        ],
      },
      {
        heading: 'プライバシーと安全性',
        body:
          'ファイルの読み込みとリネームは、すべてブラウザの中だけで行われます。サーバーへのアップロードはなく、アカウント登録も不要で、ページを閉じるか再読み込みすればデータは消えます。ファイルが端末から出ないため、オンラインサービスへのアップロードが禁止されている職場でも、機密資料に対して使えます。',
      },
    ],
    faqHeading: 'よくある質問',
    faq: [
      {
        question: 'ファイルはサーバーにアップロードされますか？',
        answer:
          'いいえ。ファイルの読み込みもZIPの作成も、お使いの端末のメモリ上でブラウザが行います。ファイル・ファイル名のいずれも送信されません。',
      },
      {
        question: '元のファイルは変更されますか？',
        answer:
          'いいえ。ディスク上の元ファイルはそのまま残ります。リネームされたコピーを含む新しいZIPが作られます。',
      },
      {
        question: '一度に何件までリネームできますか？',
        answer:
          '固定の上限はなく、実際の限界はブラウザのメモリです。通常の書類なら数百件でも問題ありません。容量の大きい動画などは小分けにすることをおすすめします。',
      },
      {
        question: '拡張子はどうなりますか？',
        answer:
          'そのまま保持されます。ルールが適用されるのは名前の部分だけなので、report.pdf は 2026-04-01_report_01.pdf のような形になります。',
      },
      {
        question: '同じ名前になってしまったらどうなりますか？',
        answer:
          'プレビューで警告が出て、解消するまで「確認してダウンロード」は押せません。連番トークンを追加すれば、すべてのファイルに固有の番号が付きます。',
      },
      {
        question: '番号の順序は指定できますか？',
        answer:
          'できます。連番トークンを追加する前にファイルをドラッグして並べ替えてください。リストの並び順がそのまま番号順になります。',
      },
    ],
    relatedHeading: '関連ツール',
  },
  imageSorterGuide: {
    heading: '使い方ガイド',
    sections: [
      {
        heading: '使い方',
        steps: [
          'アップロードエリアに画像をドロップします。ブラウザ内で読み込まれ、アップロードは行われません。',
          '仕分け先のフォルダをカテゴリごとに作り、名前を付けます。最初から2つ用意されています。',
          '「仕分けを開始」を押します。画像が1枚ずつ大きく表示されます。',
          '数字キーを押すと、その番号のフォルダに入れて次の未仕分けの画像へ進みます。スペースキーで直前と同じフォルダ、Backspaceで取り消しです。',
          '「最終確認・ダウンロード」で結果を確認し、入れ間違いがあれば移動してから、「ZIPをダウンロード」を押します。',
        ],
      },
      {
        heading: 'こんなときに便利',
        items: [
          'モールに出品する商品写真を、メイン画像・詳細画像・不採用に分ける必要がある。',
          '撮影データを、採用・保留・不採用に選別したい。',
          '物件写真や旅行写真を、部屋・建物・都市などでまとめたい。',
          '溜まったスクリーンショットを、機能別や案件別に整理したい。',
          '1枚ずつ開いてフォルダにドラッグするしかない、大量の画像がある。',
        ],
      },
      {
        heading: 'プライバシーと安全性',
        body:
          '画像の読み込み・仕分け・ZIPの作成は、すべてブラウザの中だけで行われます。サーバーへのアップロードはなく、アカウント登録も不要で、ページを閉じるか再読み込みすればデータは消えます。画像が端末から出ないため、業務上の画像や個人的な写真にも安心して使えます。',
      },
    ],
    faqHeading: 'よくある質問',
    faq: [
      {
        question: '画像はサーバーにアップロードされますか？',
        answer:
          'いいえ。画像の読み込みもZIPの作成も、お使いの端末のメモリ上でブラウザが行います。画像・ファイル名のいずれも送信されません。',
      },
      {
        question: '画像は加工・再圧縮されますか？',
        answer:
          'いいえ。各画像はバイト単位でそのままZIPにコピーされます。画質・サイズ・メタデータは元のままです。',
      },
      {
        question: 'ダウンロードされるのは何ですか？',
        answer:
          '作成したカテゴリごとにフォルダが分かれた1つのZIPです。ファイル名は元のまま保たれます（同じフォルダ内で名前が重複する場合だけ、失われないよう連番が付きます）。画像を1枚も入れなかったフォルダは含まれません。',
      },
      {
        question: 'キーボードだけで仕分けできますか？',
        answer:
          'できますし、その方が速いです。数字キー1〜9でそのフォルダへ、スペースキーで直前と同じフォルダへ、矢印キーで画像を移動、BackspaceまたはCtrl/⌘+Zで取り消しです。',
      },
      {
        question: 'フォルダが10個以上あるときはどうなりますか？',
        answer:
          '10個目以降はボタンをタップまたはクリックして仕分けます。数字キーのショートカットが割り当てられるのは最初の9個までです。',
      },
      {
        question: '仕分けなかった画像はどうなりますか？',
        answer:
          'ダウンロード前に確認されます。含めずにダウンロードすることも、「未仕分け」フォルダに入れて残すこともできます。',
      },
    ],
    relatedHeading: '関連ツール',
  },
  pdfTitleEditorGuide: {
    heading: '使い方ガイド',
    sections: [
      {
        heading: 'PDFのタイトルとは？',
        body:
          'PDFには、ファイルそのものの中に文書のプロパティが保存されていて、そのひとつがタイトルです。ブラウザはこれをタブに表示し、PDFリーダーはウィンドウやプロパティ画面に表示します。検索結果にPDFが出るときに使われることもあります。タイトルはPDFを作成した時点で書き込まれるため、書き出した文書のタイトルが、元になったテンプレートやスライド、Wordファイルの名前のままになっていることがよくあります。',
      },
      {
        heading: 'ファイル名とPDFタイトルの違い',
        body:
          'この2つは別物で、片方を変えてももう片方は変わりません。このツールが存在する理由がまさにそこにあります。',
        terms: [
          {
            term: 'ファイル名',
            definition:
              'OSが表示する名前（例: proposal.pdf）。ファイルの名前を変更しても、変わるのはこちらだけです。',
          },
          {
            term: 'PDFタイトル',
            definition:
              'PDFの内部に保存されている値。ブラウザのタブに表示されるのはこちらで、ファイル名を何度変えても変わりません。',
          },
        ],
      },
      {
        heading: '使い方',
        steps: [
          '上のエリアにPDFをドロップします。ブラウザ内で読み込まれ、アップロードは行われません。',
          '各PDFの現在のタイトルがファイル名の下に表示されます。新しいタイトルを入力してください。',
          '必要に応じて「その他のメタデータ」を開き、作成者・件名・キーワードの編集や、ダウンロード時のファイル名の変更ができます。',
          '複数のPDFを読み込んでいるときは「すべてのPDFにまとめて適用」で同じ値を一括設定したり、ファイル名を一括でタイトルにコピーしたりできます。',
          '1件なら「PDFを作成してダウンロード」、複数なら「すべて作成してZIPをダウンロード」を押します。',
        ],
      },
      {
        heading: 'こんなときに便利',
        items: [
          'サイトに公開したPDFが、ブラウザのタブに違う名前で表示されている。',
          'テンプレートから書き出した見積書や請求書に、テンプレートのタイトルが残っている。',
          '配布前に、資料や教材のタイトルを統一しておきたい。',
          '取引先やお客様から集めたPDFの文書プロパティがバラバラ、または空になっている。',
          '社外に共有する前に、作成者の情報を消しておきたい。',
        ],
      },
      {
        heading: 'プライバシーと安全性',
        body:
          'PDFの読み込み・編集・再生成は、すべてブラウザの中だけで行われます。サーバーへのアップロードはなく、アカウント登録も不要で、ページを閉じるか再読み込みすればデータは消えます。ファイルが端末から出ないため、オンラインサービスへのアップロードが禁止されている職場でも、機密文書に対して使えます。',
      },
    ],
    faqHeading: 'よくある質問',
    faq: [
      {
        question: 'ファイル名とPDFタイトルは何が違いますか？',
        answer:
          'ファイル名はOSがフォルダ内で表示する名前です。タイトルはPDFの内部に保存されていて、ブラウザのタブに表示されます。ファイル名を変更してもタイトルは変わりません。',
      },
      {
        question: 'ファイル名を変えたのに、ブラウザのタブに別の名前が出るのはなぜですか？',
        answer:
          'ブラウザがファイル名より、文書内部に保存されたタイトルを優先して表示するためです。PDFの作成時に設定されたタイトルは、メタデータ自体を編集しない限り、名前を変えても残り続けます。',
      },
      {
        question: 'PDFはサーバーにアップロードされますか？',
        answer:
          'いいえ。PDFの読み込みも書き換えも、お使いの端末のメモリ上でブラウザが行います。ファイル・ファイル名・メタデータのいずれも送信されません。',
      },
      {
        question: '複数のPDFをまとめて変更できますか？',
        answer:
          'できます。必要な数だけ追加して、個別に編集することも、同じ値を全件に一括適用することもできます。最後にまとめてZIPでダウンロードできます。',
      },
      {
        question: 'パスワード付きPDFは編集できますか？',
        answer:
          'できません。暗号化・パスワード保護されたPDFは受け付けません。先に作成元のアプリケーションで保護を解除してください。',
      },
      {
        question: '電子署名付きPDFは編集できますか？',
        answer:
          'できません。署名付きPDFを保存すると、署名が対象としているバイト位置が書き換わり署名が無効になるため、署名を検出した時点で編集を止めています。検出は簡易的なもので、署名について言及しているだけのファイルを誤検出することがあります。',
      },
      {
        question: 'PDFの中身や画質は変わりますか？',
        answer:
          'いいえ。ページ・テキスト・画像はそのまま引き継がれ、再圧縮も行いません。文書を書き出し直すため元ファイルとバイト構造は変わりますが、見た目は変わりません。',
      },
      {
        question: 'PDFタイトルを空欄にできますか？',
        answer:
          'できます。欄を空にして作成すると保存されていたタイトルが削除され、ブラウザはファイル名を表示するようになります。',
      },
    ],
    relatedHeading: '関連ツール',
  },
  imageCompressorPage: {
    metaTitle:
      '画像をまとめて圧縮・軽量化 - よしにゃにまとめて画像圧縮｜無料・登録不要',
    metaDescription:
      '複数の画像を一度に圧縮し、変換前後をスライダーで見比べてから保存できます。JPEG・PNG・WebPへの変換、品質調整、1枚ずつの保存もZIP一括保存も可能。すべてブラウザ内で処理され、画像は外部へ送信されません。',
    heading: 'よしにゃにまとめて画像圧縮',
    toolName: 'よしにゃにまとめて画像圧縮',
    toolDescription:
      '複数の画像を、1枚ずつ変換前後を見比べながら圧縮できます。',
    lead: '一括圧縮ツールで、思ったより画像が劣化してしまったことはありませんか？また、左右で見比べられるツールは1枚ずつしか読み込めず、不便に感じていませんか？よしにゃにまとめて画像圧縮なら、画像をまとめて読み込めて、1枚ずつ見比べながら圧縮具合を調整できます。',
    privacyNote:
      '画像はサーバーに送信されません。すべての処理はブラウザ内で完結します。',
  },
  imageCompressor: {
    // Input
    dropzone: 'ここに画像をドロップ、またはクリックして選択',
    supportedFormats: 'JPEG・PNG・WebP ／ 最大100枚',
    addMore: '＋ 画像を追加',
    rejectedHeading: '追加できなかったファイル',
    dismiss: '閉じる',
    // List
    listHeading: (n: number) => `${n}枚の画像`,
    filterLabel: '一覧の絞り込み',
    filters: {
      all: 'すべて',
      'not-downloaded': '未保存',
      customized: '個別調整',
      downloaded: '保存済み',
      error: 'エラー',
    },
    emptyFilter: '該当する画像はありません。',
    removeOne: (name: string) => `${name} を削除`,
    removeAll: 'すべて削除',
    removeAllConfirm: 'すべての画像を削除しますか？',
    stateProcessing: '処理中',
    stateDownloaded: '保存済み',
    stateCustomized: '個別調整',
    stateError: 'エラー',
    progress: (done: number, total: number) => `${total}枚中 ${done}枚 保存済み`,
    provisional: '（処理中）',
    // Compare
    beforeLabel: '変換前',
    afterLabel: '変換後',
    dividerLabel: '比較位置',
    dividerValue: (percent: number) =>
      `${percent}% — 境界線の左が変換前、右が変換後です`,
    compareHint:
      'ドラッグで比較 ／ 画像をドラッグで移動 ／ スペースキーを押している間は変換前を表示',
    processing: '圧縮中…',
    zoomIn: '拡大',
    zoomOut: '縮小',
    zoomFit: '全体を表示',
    enterFullscreen: '全画面で比較',
    exitFullscreen: '全画面を終了',
    fullscreenHint: 'Escで終了',
    // Sizes
    beforeSize: (size: string) => `変換前: ${size}`,
    afterSize: (size: string) => `変換後: ${size}`,
    savedBy: (bytes: string, percent: string) => `${bytes} 削減（${percent}）`,
    grewBy: (percent: string) => `${percent} 増加`,
    grewNote:
      'この設定では元の画像より大きくなります。品質を下げるか、元のファイルをそのまま使ってください。',
    // Settings
    settingsHeading: '圧縮設定',
    scopeLabel: '設定の適用先',
    scopeCommon: '共通設定',
    scopeImage: 'この画像のみ',
    resetToCommon: '共通設定に戻す',
    scopeCommonNote: (n: number) =>
      `個別調整した${n}枚には反映されません。まとめて上書きするには「その他の操作」を開いてください。`,
    formatLabel: '出力形式',
    formats: {
      original: '元の形式を維持',
      jpeg: 'JPEG',
      png: 'PNG',
      webp: 'WebP',
    },
    backgroundLabel: '透過部分の背景色',
    backgroundHint:
      'JPEGは透過を扱えないため、透明な部分はこの色で塗りつぶされます。',
    qualityLabel: '品質',
    losslessAt100:
      '品質100はWebPを可逆で書き出します。元画像と完全に同一で、品質99より小さくなることもあります。一切劣化させたくない場合はこちらを使ってください。',
    useLossless: '100（可逆）にする',
    qualityFlatTop:
      'おおよそ90を超えると画質はほとんど改善せず、容量だけ増えていきます。まったく劣化させたくない場合は100にしてください。',
    pngLossless:
      'PNGは可逆圧縮のため、品質設定はありません。PNGを軽くするには、サイズを変更するか出力形式をWebPにしてください。',
    applyQualityToRest: (quality: number, count: number) =>
      `品質${quality}を残り${count}枚に適用`,
    applyRestNone: 'この画像より後ろに、未保存の画像がありません。',
    appliedQuality: (quality: number, count: number) =>
      `品質${quality}を残り${count}枚に適用しました。`,
    applyAllToRest: (count: number) => `現在の設定すべてを残り${count}枚に適用`,
    applyAllHint:
      'この画像の形式・品質・サイズを、後ろにある未保存の画像へコピーします。それらの個別調整は上書きされます。',
    appliedAll: (count: number) => `現在の設定すべてを残り${count}枚に適用しました。`,
    notFollowed: (n: number) => `個別調整した${n}枚には反映していません。`,
    includeThem: 'これも変更する',
    moreActions: 'その他の操作',
    applyToAll: (n: number) => `現在の設定を全${n}枚に適用（個別調整も上書き）`,
    applyToAllConfirm: (n: number) =>
      `現在の設定を${n}枚すべてに適用します。個別調整とダウンロード済みの画像も上書きされます。よろしいですか？`,
    appliedToAll: (n: number) => `現在の設定を${n}枚すべてに適用しました。`,
    undo: '元に戻す',
    resizeHeading: 'サイズ変更',
    resizeEnable: 'ピクセルサイズを変更する',
    widthLabel: '幅',
    heightLabel: '高さ',
    keepRatio: '縦横比を維持',
    preventUpscale: '元サイズより大きくしない',
    distortWarning: 'この寸法では画像が歪みます。',
    dimensionsPreview: (fromW: number, fromH: number, toW: number, toH: number) =>
      `${fromW}×${fromH} → ${toW}×${toH}`,
    metadataNote:
      '再エンコードにより、撮影場所などのメタデータは出力画像に引き継がれません。画像の向きは保持されます。',
    // Download
    download: 'ダウンロード',
    downloadNext: 'ダウンロードして次へ',
    downloadFinish: 'ダウンロードして完了',
    downloadZip: 'すべてZIPでダウンロード',
    zipping: (percent: number) => `ZIPを作成中… ${percent}%`,
    zipSkipped: (count: number) => `処理できなかった${count}枚を除いています。`,
    zipFailed: (message: string) => `ZIPの作成に失敗しました: ${message}`,
    finished: (count: number) =>
      `${count}枚の画像を保存しました。設定を変えて再保存することもできます。`,
    shortcuts:
      'ショートカット: ← → 画像を移動 ／ Enter ダウンロードして次へ ／ スペース 変換前を表示 ／ ＋ − 0 拡大・縮小・全体表示',
    // Errors
    errors: {
      unsupported_type:
        'この形式には対応していません。JPEG・PNG・WebPをご利用ください。',
      empty_file: 'このファイルは空です。',
      file_too_large: 'このファイルは上限の30MBを超えています。',
      total_too_large: 'このファイルを追加すると合計300MBの上限を超えます。',
      too_many_files: '一度に扱える画像は100枚までです。',
      decode_failed:
        'この画像を読み込めませんでした。ファイルが壊れている可能性があります。',
      encode_failed: 'この画像を圧縮できませんでした。',
      out_of_memory:
        'ブラウザのメモリが不足しました。枚数を減らすか、小さい画像でお試しください。',
    },
  },
  imageCompressorGuide: {
    heading: '使い方ガイド',
    sections: [
      {
        heading: '使い方',
        steps: [
          'アップロードエリアに画像をドロップします。ブラウザ内で読み込まれ、アップロードは行われません。',
          '1枚目が比較画面に表示されます。境界線を左右にドラッグすると、左が変換前、右が変換後です。',
          '見た目が許容できるところまで品質を調整します。ファイルサイズはその場で更新されます。',
          '「品質○○を残り○枚に適用」を押すと、この画像より後ろの画像が、いま決めた品質から始まります。',
          '「ダウンロードして次へ」を押します。保存して次の未保存画像へ進みます。まとめて取得したい場合は「すべてZIPでダウンロード」を使ってください。',
        ],
      },
      {
        heading: 'こんなときに便利',
        items: [
          'サイトに載せる写真が重く、ページの表示が遅い。',
          'フォームやモールで、数MBを超えるファイルが受け付けられない。',
          '大量の商品写真を、見た目を保ったまま軽くしたい。',
          '圧縮でどこが劣化するかを、確定する前に自分の目で確かめたい。',
          '機密性のある画像で、オンラインの圧縮サービスにアップロードできない。',
        ],
      },
      {
        heading: '品質の決め方',
        body:
          '写真なら品質80あたりが出発点になります。容量の大半が落ちる一方で、違いは見つけにくいままです。細かい模様、画像内の文字、フラットなイラストは劣化が早く出るので、100%表示で確認してから決めてください。60を下回るとたいてい肉眼で分かるようになります。逆に90を超えると画質はほとんど改善せず容量だけ増えていきますが、100ちょうどのときだけWebPは可逆モードに切り替わり、元画像と完全に同一かつ99より小さくなることがあります。PNGは可逆圧縮のため品質設定自体がありません。PNGを軽くしたい場合は、サイズを変更するかWebPに変換してください。',
      },
      {
        heading: 'プライバシーと安全性',
        body:
          '画像の読み込み・圧縮・ZIPの作成は、すべてブラウザの中だけで行われます。サーバーへのアップロードはなく、アカウント登録も不要で、ページを閉じるか再読み込みすればデータは消えます。画像が端末から出ないため、機密性のある画像や個人的な写真にも安心して使えます。',
      },
    ],
    faqHeading: 'よくある質問',
    faq: [
      {
        question: '画像はサーバーにアップロードされますか？',
        answer:
          'いいえ。画像の読み込みも再エンコードも、お使いの端末のメモリ上でブラウザが行います。画像・ファイル名のいずれも送信されません。',
      },
      {
        question: '対応している形式は何ですか？',
        answer:
          '入力はJPEG・PNG・WebPです。出力もこの3つ、または元の形式を維持できます。HEIC・AVIF・SVG・GIF・RAWには対応していません。',
      },
      {
        question: 'PNGに品質スライダーがないのはなぜですか？',
        answer:
          'PNGの圧縮は可逆で、品質と引き換えに削る要素がないためです。品質設定を置いても何も起きません。PNGを軽くするには、サイズを変更するかWebPに変換してください。',
      },
      {
        question: '品質100と99では何が違いますか？',
        answer:
          '大きく違います。100のときだけブラウザはWebPを可逆で書き出すため、結果は元画像と完全に同一で、しかも品質99より小さくなることがあります。90〜99の範囲では画質はほとんど改善せず容量だけ増えるので、99は「品質80並みの劣化で容量だけ大きい」状態になりがちです。一切劣化させたくないなら100、容量を優先するなら75〜85を目安にしてください。',
      },
      {
        question: 'ファイルが大きくなってしまいました。',
        answer:
          '圧縮済みの画像をより高い品質で再エンコードしたり、写真をPNGにしたりすると、元より大きくなることがあります。その場合は隠さずに増加として表示します。品質を下げるか、元のファイルをそのままお使いください。',
      },
      {
        question: '1枚だけ違う品質にできますか？',
        answer:
          'できます。設定の適用先を「この画像のみ」に切り替えて調整すれば、他の画像は変わりません。その画像は一覧で「個別調整」と表示されます。',
      },
      {
        question: '「残りに適用」はどこまで変わりますか？',
        answer:
          '現在の画像より後ろにあり、まだ保存していない画像だけです。前の画像、保存済みの画像、エラーの画像は変更されません。適用後は対象枚数が通知され、その場で元に戻せます。',
      },
      {
        question: '写真のメタデータは残りますか？',
        answer:
          '残りません。再エンコードにより撮影場所やカメラ情報などは失われます。公開前にはむしろ望ましい挙動です。向きの情報は反映されるので、画像が回転して出力されることはありません。',
      },
      {
        question: '一度に何枚まで処理できますか？',
        answer:
          '100枚、1ファイル30MB、合計300MBまでです。実際の限界は端末のメモリなので、非常に大きい写真は小分けにすることをおすすめします。',
      },
    ],
    relatedHeading: '関連ツール',
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
    index: '連番',
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
      '⚠ 同名のファイルが発生します。連番トークンの追加などで名前が重複しないようにしてください。',
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
