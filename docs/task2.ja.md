# task2: リネームロジック（純粋関数 + テスト）

## 目的

トークン列で表現されたリネーム規則から新ファイル名リストを生成する純粋関数群を、
`src/lib/` 配下に実装する。UIは一切実装しない（task3で行う）。

## 背景（アプリ全体の仕様）

ユーザーはファイル名の規則を「トークン」をドラッグ&ドロップで並べて組み立てる。
例: `[任意文字列1][_][日付(yyyy-mm-dd)][_][任意文字列2][_][index(01)].拡張子`

- 任意文字列トークンは、置いた数だけ入力フィールドが表示され、ユーザーが値を入力する
- 日付・時間トークンは「ユーザーが指定した固定日時」または「各ファイルの更新日時」を
  ソースとして選べる（固定日時はUI側でカレンダー/時間ピッカーから選択する）
- indexトークンは数字（1〜3桁ゼロ埋め）またはアルファベット連番を選べる
- 拡張子は元ファイルのものを常に維持する（トークンではない）

このtask2では、この規則を表現するデータモデルと、それを適用する関数を作る。

## データモデル（src/lib/types.ts）

以下を基本とする。実装の都合で調整してよいが、判別可能なユニオン型を維持すること。

```ts
export type DateFormat = 'yyyy-mm-dd' | 'yyyymmdd' | 'yyyy-mm' | 'yyyymm';
export type TimeFormat = 'hh-mm-ss' | 'hh-mm';
// いずれも後からリテラルを追加しやすい構造にすること
// 時間の区切りに ':' は使わない（Windowsのファイル名で使用不可のため '-' 区切り）

export type DateTimeSource = 'fixed' | 'fileModified';
// fixed: ユーザーがピッカーで指定した日時（全ファイル共通）
// fileModified: 各ファイルの更新日時（ファイルごとに異なる）

export type IndexStyle =
  | { type: 'numeric'; padding: 1 | 2 | 3 }      // 1 / 01 / 001
  | { type: 'alpha'; letterCase: 'lower' | 'upper' }; // a, b, ... / A, B, ...

export type RenameToken =
  | { id: string; kind: 'text'; value: string }
  | { id: string; kind: 'separator'; char: string }   // 初期値 '_'
  | { id: string; kind: 'date'; format: DateFormat; source: DateTimeSource;
      fixedDate?: string }  // source='fixed' のとき 'yyyy-mm-dd' 形式のISO文字列
  | { id: string; kind: 'time'; format: TimeFormat; source: DateTimeSource;
      fixedTime?: string }  // source='fixed' のとき 'hh:mm' または 'hh:mm:ss'
  | { id: string; kind: 'index'; style: IndexStyle; start: number }; // startの初期値1

export type RenameInput = {
  originalName: string;
  lastModified: number;  // File.lastModified（エポックms）をそのまま渡す想定
};
```

## 実装する関数（src/lib/rename.ts）

すべて純粋関数。DOM・React・File APIに依存しないこと。

1. `formatDate(date: Date, format: DateFormat): string`
2. `formatTime(date: Date, format: TimeFormat): string`
   - 例: 9時5分3秒 → hh-mm-ss なら `"09-05-03"`（時分秒は常に2桁ゼロ埋め）
3. `formatNumericIndex(n: number, padding: 1 | 2 | 3): string`
   - 桁あふれ（padding=2 で n=100 など）はゼロ埋めせずそのまま `"100"` を返す
4. `formatAlphaIndex(n: number, letterCase: 'lower' | 'upper'): string`
   - 1→a, 2→b, ..., 26→z, 27→aa, 28→ab ...（Excelの列名と同じbijective base-26）
5. `splitExtension(fileName: string): { base: string; ext: string }`
   - `"photo.JPG"` → `{ base: "photo", ext: ".JPG" }`（大文字小文字は維持）
   - 拡張子なし → `ext: ""`
   - `".gitignore"` のようなドットファイル → 全体をbase扱いとし `ext: ""`
   - `"archive.tar.gz"` → `ext: ".gz"`（最後のドット以降のみ）
6. `buildFileName(tokens: RenameToken[], context: { index: number; fileDate: Date; now: Date }): string`
   - トークン列を連結して拡張子を除いた新ファイル名を生成
   - date/timeトークンは source に応じて fixedDate/fixedTime または fileDate を使う
   - source='fixed' なのに fixedDate/fixedTime が未設定の場合は now をフォールバックに使う
7. `applyRename(inputs: RenameInput[], tokens: RenameToken[], options: { now: Date }): RenameResult[]`

```ts
export type RenameResult = {
  originalName: string;
  newName: string;       // 拡張子込み
  isDuplicate: boolean;  // 生成結果に同名が存在する場合 true
};
```

- ファイルの並び順がそのままindexの順序になる（並べ替えはUI側の責務）
- `now` は引数で受け取る（テスト可能性のため。UI側では現在時刻を渡す想定）

## バリデーション（src/lib/validate.ts）

`validateTextValue(value: string): string | null`（エラーメッセージ or null）

- ファイル名に使えない文字（`/ \ : * ? " < > |`）を含む場合はエラー
- 空文字は許容する（UIで警告表示するかはtask3で判断）

## テスト（src/lib/*.test.ts）

Vitestで、少なくとも以下をカバーすること:

- 各DateFormatの出力（1桁月・1桁日を含む日付で検証。例: 2026-07-05）
- 各TimeFormatの出力（1桁の時・分・秒を含む時刻で検証。例: 09:05:03）
- formatNumericIndex: 各paddingと桁あふれ
- formatAlphaIndex: 1→a, 26→z, 27→aa, 52→az, 53→ba, 大文字/小文字
- splitExtensionの境界ケース（拡張子なし、ドットファイル、多重拡張子、大文字拡張子）
- buildFileName: source='fixed' と 'fileModified' の使い分け、fixed未設定時のフォールバック
- applyRename: 通常ケース、indexトークンなしで同名が発生するケース（isDuplicate=true）、
  fileModifiedソースでファイルごとに異なる日付が出るケース
- validateTextValueの禁止文字

## 完了条件

- `npm run test` が全件パス
- `npm run build` と `npm run lint` が通る
- src/lib/ 配下に純粋関数のみ（import に react / dom 系が含まれない）

## やらないこと

- UI実装（アップロード、D&D、カレンダー/時間ピッカー、プレビュー表示）→ task3
- zip生成 → task4
- 追加ライブラリのインストール
