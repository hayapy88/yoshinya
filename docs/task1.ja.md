# task1: プロジェクト土台構築（scaffold・設定・認証）

> **注**: このタスクは実施済み。docs/ に記録として残すために後から整備したもの。
> 実施時の補足は末尾の「実施記録」を参照。

## 目的

完全クライアントサイドのファイル名一括変更ツールのプロジェクト土台を構築する。
機能実装（リネーム関数・UI・zip）はこのタスクでは行わない。

## プロジェクト概要

- 完全クライアントサイドのSPA。サーバー・DB・外部へのファイル送信は一切なし
  （プライバシーが売り）
- 機能: 複数ファイルを読み込み → D&Dで並べ替え → トークンベースのリネーム規則を
  組み立て → プレビュー確認 → zipでダウンロード
- 技術: Vite + React + TypeScript + dnd-kit + JSZip + Vitest
- デプロイ先: Cloudflare Workers（静的アセット配信。Pagesではない）

## 実施内容

1. `npm create cloudflare@latest` を非対話モードで実行し、
   React + Vite + @cloudflare/vite-plugin 構成のプロジェクトを作成する
2. SPAのため wrangler.jsonc に `assets.not_found_handling: "single-page-application"`
   が設定されていることを確認する
3. 完全クライアントサイド化: テンプレート付属のデモWorker（worker/index.ts）と
   関連設定（wrangler.jsonc の main / nodejs_compat 等)を削除し、
   Workerスクリプトなしの静的アセット配信のみの構成にする
4. 依存関係を追加する: @dnd-kit/core / @dnd-kit/sortable / @dnd-kit/utilities /
   jszip / vitest（devDependencies）
5. CLAUDE.md を作成し、以下の方針を明記する:
   - 完全クライアントサイドのSPA。サーバー・DB・外部へのファイル送信は追加しない
   - デプロイ先はCloudflare Workers静的アセット（Workerスクリプトなしの構成を維持）
   - リネームロジックは src/lib/ 配下に純粋関数として実装し、必ずVitestでテストを書く
   - Next.js・API Routes・バックエンドは導入しない
6. `npm run dev` でローカル起動できることを確認する
7. `wrangler login` で認証する（ブラウザでの許可操作はユーザー本人が行う）。
   完了後 `wrangler whoami` で確認する
8. `git init` し、.gitignore を確認のうえ初回コミットを作成する

## 完了条件

- `npm run dev` でローカル起動し HTTP 200 が返る
- `npm run build` / `npm run lint` が通る
- wrangler がユーザーのCloudflareアカウントで認証済み
- 初回コミットが存在する

## やらないこと

- 機能実装（リネーム関数・UI・zip生成）→ task2〜4
- 本番デプロイ（`npm run deploy`）→ task4の最後に実施

## 実施記録（2026-07-14）

- scaffoldは `--framework=react --platform=workers --variant=react-ts --no-deploy
  --git=false` の組み合わせで成功（TS指定は `--lang=ts` ではなく `--variant=react-ts`）
- 既存の `.claude/` ディレクトリがscaffoldと衝突するため、一時退避してから実行し復元した
  （settings.local.json の存在を確認済み）
- `assets.not_found_handling: "single-page-application"` はテンプレートに最初から
  含まれていた
- package.json に `"deploy": "npm run build && wrangler deploy"` スクリプトを追加し、
  未使用の `cf-typegen` を削除した
- 構成: Vite 8 + React 19 + TypeScript + @cloudflare/vite-plugin（wrangler 4）。
  lint は oxlint（テンプレート標準）
- index.html を日本語ロケール + タイトル「File Renamer」に変更した
