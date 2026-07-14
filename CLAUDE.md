# File Renamer

ブラウザ内で完結するファイル名一括変更ツール。複数ファイルを読み込み、ドラッグ&ドロップで並べ替え、リネーム規則（プレフィックス + 連番 + 日付フォーマット）を適用して zip でダウンロードする SPA。

## 絶対に守る方針

- **完全クライアントサイド**: サーバー・DB・外部へのファイル送信は追加しない。プライバシー（ファイルが端末外に出ないこと）がこのツールの売り。
- **デプロイ先は Cloudflare Workers の静的アセット配信**（Pages ではない）。wrangler.jsonc に `main` を持たない Worker スクリプトなしの構成を維持する。
- **Next.js・API Routes・バックエンドは導入しない。**

## 実装ルール

- リネームロジックは `src/lib/` 配下に**純粋関数**として実装し、**必ず Vitest でテストを書く**。
- UI は React + dnd-kit（並べ替え）、zip 生成は JSZip。

## コマンド

- `npm run dev` — 開発サーバー起動
- `npm run test` — Vitest 実行
- `npm run lint` — oxlint 実行
- `npm run build` — 型チェック + 本番ビルド
- `npm run deploy` — ビルドして Cloudflare Workers へデプロイ
