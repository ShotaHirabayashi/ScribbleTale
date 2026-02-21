# ScribbleTale 乖離分析レポート

> 生成日: 2026-02-21
> 比較対象: デモ実装 (src/) vs Spec (plan.md / technical.md)

---

## A. 構造的な違い

| # | 項目 | デモ（現在） | Spec（plan.md / technical.md） | 対応方針 |
|---|------|-------------|-------------------------------|---------|
| A1 | 絵本閲覧ルート | `/book/momotaro`, `/book/akazukin`（個別静的ルート2つ） | `/book/[bookId]`（動的ルート1つ） | 統合が必要 |
| A2 | シェアルート | `/share/[id]` | `/story/[shareToken]` | リネーム必要 |
| A3 | 表紙作成ルート | `/book/[id]/cover` あり | Specに記載なし | 残す（デモの良い機能） |
| A4 | ほんだなルート | `/library` あり | Specに記載なし | 残す（シェア後の絵本格納先） |
| A5 | APIルート | なし（0個） | `/api/generate-image`, `/api/edit-image`, `/api/recognize-drawing`, `/api/share`（4個） | 全て新規作成 |
| A6 | OG画像ルート | なし | `/story/[shareToken]/opengraph-image.tsx` | 新規作成 |
| A7 | 型定義 | 最小限（4型: `StoryPage`, `Story`, `FrameStyle`, `SavedBook`） | 豊富（15+型: `PagePhase`, `Modification`, `CharacterAgent`, `CharacterReaction`, `OrchestratorResult`, `ExtractionResult`, `CommentTimeConfig` 等） | 大幅拡張 |
| A8 | ストアディレクトリ | なし | `src/stores/story-store.ts`（Zustand） | 新規作成 |
| A9 | PDF生成ルート | なし | `/api/story/[storyId]/pdf` | 新規作成 |

---

## B. 不足しているコア機能（デモに存在しない）

| # | 機能 | Specの記載箇所 | 重要度 | 必要パッケージ |
|---|------|--------------|--------|--------------|
| B1 | Comment Timeモード（音声入力ウィンドウ） | plan.md Phase 3 | 最重要 | - |
| B2 | Gemini Live API音声入力 | plan.md Phase 3 | 最重要 | `@google/genai` v1.42.0+ |
| B3 | 修正エンジン（20%固定 / 80%自由ルール） | plan.md Phase 4 | 最重要 | `@google/genai` |
| B4 | キャラクターエージェント | plan.md Phase 4 | 高 | `@google/genai` |
| B5 | 画像生成パイプライン（Pro → Flash fallback） | plan.md Phase 2 | 高 | `@google/genai` |
| B6 | カメラ描画認識 | plan.md Phase 5 | 高 | `@google/genai` |
| B7 | 水彩ディゾルブトランジション | technical.md | 中 | `framer-motion` |
| B8 | Zustand状態管理 | technical.md | 中 | `zustand` |
| B9 | react-pageflipによるページめくり | plan.md Phase 1 | 中 | `react-pageflip` |
| B10 | サウンドデザイン（Howler.js） | plan.md Phase 1 | 中 | `howler`, `@types/howler` |
| B11 | Firebase連携（Firestore / Storage） | plan.md Phase 6 | 中 | `firebase` |
| B12 | APIルート群（4エンドポイント） | technical.md | 中 | - |
| B13 | OG画像生成 | plan.md Phase 6 | 低 | `next/og` |
| B14 | QRコード共有 | plan.md Phase 6 | 低 | `qrcode.react` |
| B15 | shareToken生成 | plan.md Phase 6 | 低 | `nanoid` |

### 不足パッケージまとめ

```
@google/genai          # Gemini SDK（音声・画像・テキスト生成）
firebase               # Firestore / Storage
zustand                # 状態管理
framer-motion          # アニメーション
react-pageflip         # ページめくり
howler                 # サウンド
@types/howler          # Howler型定義
nanoid                 # shareToken生成
qrcode.react           # QRコード表示
```

---

## C. 保持すべきデモの資産（そのまま活かす）

| # | 資産 | ファイル | 評価 |
|---|------|---------|------|
| C1 | 紙テクスチャエフェクト | `components/effects/PaperTexture.tsx` | mix-blend-mode活用、Specの仕様に合致 |
| C2 | SVGフィルター定義 | `components/effects/SvgFilters.tsx` | 水彩dissolveフィルター定義あり |
| C3 | カラーシステム | `app/globals.css` | oklchカスタムプロパティ |
| C4 | フォントシステム | `app/layout.tsx` | Zen Maru Gothic / Yomogi / Klee One（Spec準拠） |
| C5 | トップページ | `components/top/*` | HeroSection, ExperienceSection, ParentInfoSection, Footer |
| C6 | BookSelector + BookCard | `components/book/BookSelector.tsx`, `BookCard.tsx` | 3Dホバー効果 |
| C7 | shadcn/uiライブラリ | `components/ui/*`（59ファイル） | 完全なUIキット |
| C8 | ストーリーデータ | `lib/story/momotaro.ts`, `akazukin.ts` | 8ページ × 2冊分の完全なデータ |
| C9 | 表紙カスタマイズ | `components/cover/CoverCreator.tsx`, `CoverPreview.tsx` | 4フレームスタイル（星・花・リボン・シンプル） |
| C10 | シェアボタン | `components/share/ShareButtons.tsx` | X / LINE / コピー |
| C11 | ほんだなUI | `components/library/*` | グリッドレイアウト + 空状態CTA |
| C12 | localStorage永続化 | `lib/data/saved-books.ts` | デモデータ3冊付き |

---

## D. 適応が必要な部分（デモにあるがSpec対応で修正必要）

| # | コンポーネント | 現状 | 必要な変更 | 工数 |
|---|--------------|------|----------|------|
| D1 | StoryBookViewer | CSS 3D transform（rotateY + 700ms easing） | react-pageflip統合 + Zustand連携 + Comment Timeライフサイクル | 高 |
| D2 | BookPage | シンプルな画像 + テキスト表示 | `pagePhase`に応じたUI切替（Comment Timeボタン、音声/カメラUI、修正ローディング） | 高 |
| D3 | StoryText | 文字送りアニメーション（50ms/文字） | `onComplete`コールバック追加（Comment Time開始トリガー） | 低 |
| D4 | ストーリーデータ構造 | `{id, illustration, text, alt}` | `{pageNumber, pageRole, originalText, currentText, fixedElements, freeElements, isModified}` に拡張 | 中 |
| D5 | 型定義 | 4インターフェース | 15+型に大幅拡張（PagePhase, Modification, CharacterAgent 等） | 中 |
| D6 | シェアページ | localStorage + `/share/[id]` | Firestore連携 + `/story/[shareToken]` にリネーム + ISR対応 | 中 |
| D7 | ShareButtons | X / LINE / コピーの3種 | Facebook追加 + nanoidトークン + QRCode追加 | 低 |
| D8 | 表紙作成 | 手動カスタマイズ（タイトル/著者/色/フレーム） | AI画像生成統合 + Firebase Storage保存 | 中 |
| D9 | ほんだな | localStorage保存 | Firestore連携（シェア済み絵本の一覧取得） | 中 |
| D10 | 絵本ルート | `/book/momotaro`, `/book/akazukin`（2ファイル） | `/book/[bookId]`（1ファイル）に統合 | 低 |

---

## サマリー

| カテゴリ | 件数 | 概要 |
|---------|------|------|
| A. 構造的な違い | 9件 | ルート構造・型定義・ストアの差異 |
| B. 不足コア機能 | 15件 | AI連携・Comment Time・状態管理・サウンド等 |
| C. 保持すべき資産 | 12件 | UI・エフェクト・データ・コンポーネント群 |
| D. 適応が必要な部分 | 10件 | 既存コンポーネントのSpec対応改修 |

### デモの強み

- UIデザイン・ビジュアルエフェクト・フォント・shadcn/uiキットが充実
- ストーリーデータ（ももたろう・あかずきん）が完備
- 表紙カスタマイズ・ほんだな・シェア機能のUIが動作済み

### 主要ギャップ

- **AI連携が全て未実装**: Gemini Live API（音声入力）、画像生成パイプライン（Pro→Flash fallback）、キャラクターエージェント、描画認識
- **Comment Timeモードが未実装**: アプリの最重要機能（子どもの声/落書きで絵本を変える）
- **修正エンジンが未実装**: 20%固定/80%自由ルール、次ページ修正ロジック、累積修正の整合性チェック
- **Firebase連携が未導入**: Firestore/Storage によるデータ永続化（現在はlocalStorage）
- **Zustand状態管理が未導入**: pagePhase ライフサイクル管理が存在しない
