# ScribbleTale 実装計画

## Context

子どもの「落書き」と「声」で既存の絵本がリアルタイムに書き換わる共創型インタラクティブ絵本アプリを、ハッカソン向けに開発する。
AIは物語構造を守る"見えない編集者"として機能し、**20%固定 / 80%自由**のルールで物語の骨格だけを守りながら、子どもの想像力に最大限の自由を与える。

**設計思想**: 従来の「大部分を固定して一部だけ変える」アプローチから、「最小限の骨格だけ固定して、残りは子どもが自由に作り変えられる」アプローチに転換。各ページの「役割」（導入・展開・クライマックス等）だけを固定し、舞台・キャラクターの見た目・出来事の詳細は全て子どもの発想で置き換え可能。

**ベース絵本**: 桃太郎（日本）+ 赤ずきん（西洋）の2作品を並行実装
**デモ形式**: 録画デモ + ライブ補足
**共有機能**: SNS（X/LINE）で表紙シェア → 絵本として閲覧可能なURL

> 技術仕様の詳細は [technical.md](./technical.md) を参照
> ストーリーテンプレート・キャラクター定義は [story-data.md](./story-data.md) を参照

---

## 実装フェーズ

### Phase 0: プロジェクトセットアップ (30分)
- Next.js 16 プロジェクト作成
- 依存パッケージインストール
- Firebase プロジェクト作成・初期化
- 環境変数設定
- ディレクトリ構造作成

**パッケージ:**
```
@google/genai, firebase, zustand, framer-motion, nanoid, qrcode.react
```

### Phase 1: 絵本UI + テンプレート + 没入感 (4時間)
- `lib/types/index.ts`: 型定義
- `lib/story/momotaro.ts`: 桃太郎12ページデータ（カバー + 本編11ページ）
- `lib/story/akazukin.ts`: 赤ずきん12ページデータ（カバー + 本編11ページ）
- `components/book/StoryBookViewer.tsx`: CSS 3D transform（rotateY + 700ms cubic-bezier）によるページめくり + レイアウト統合
- `components/book/BookPage.tsx`: 個別ページ（紙テクスチャ + イラスト）
- `components/book/StoryText.tsx`: 文字送りアニメーション (CSS transition)
- `components/effects/SvgFilters.tsx`: SVGフィルター定義（紙質 + 水彩にじみ）
- `components/effects/PaperTexture.tsx`: 紙質テクスチャ (mix-blend-mode)
- `components/audio/SoundProvider.tsx`: Howler.js プロバイダー
- `lib/audio/sound-manager.ts`: サウンドマネージャー（SE専用。静的BGM再生を除外し、SEのみ管理に変更）
- `styles/globals.css`: フォント変数 (Yomogi, Zen Maru Gothic, Klee One) + 絵本スタイル統合
- `app/layout.tsx`: next/font 設定
- `app/page.tsx`: トップページ（HeroSection, ExperienceSection, ParentInfoSection）
- `app/library/page.tsx`: ライブラリページ（絵本選択）
- `app/book/[bookId]/page.tsx`: 絵本閲覧ページ
- `app/book/[bookId]/cover/page.tsx`: カバーページ
- `stores/story-store.ts`: Zustand ストア

**ゴール**: CSS 3D transformによるページめくり + 紙質テクスチャ + サウンド付きの絵本として桃太郎・赤ずきんが閲覧できる

### Phase 2: 初期画像生成パイプライン (3時間)
- `lib/gemini/image-generator.ts`: Gemini 3 Pro Image (`gemini-3-pro-image-preview`) ラッパー + `gemini-2.5-flash-image` フォールバック
- `lib/gemini/prompts.ts`: 画風統一プロンプト
- `app/api/generate-image/route.ts`: 画像生成APIルート（Pro → Flash フォールバック付き）
- `app/api/edit-image/route.ts`: 画像編集APIルート（Pro → Flash フォールバック付き）
- `app/api/recognize-drawing/route.ts`: 落書き認識APIルート（`gemini-2.5-flash-lite-preview-06-17`）
- `lib/firebase/storage.ts`: Storage アップロード
- 各ページの初期イラストをバッチ生成するスクリプト
- `components/effects/WatercolorTransition.tsx`: 水彩ディゾルブ

**ゴール**: 全24ページ（桃太郎12 + 赤ずきん12）のイラストが生成され、水彩ディゾルブで切り替わる

### Phase 3: 音声入力 + Gemini Live API + コメントタイム方式 (4時間)
- `lib/gemini/live-session.ts`: Live API WebSocket管理（`LiveSessionManager` クラス、常時接続 + クライアント側ミュート制御）
  - `connect()`: WebSocket接続（絵本開始時に1回）
  - `setMuted(muted)`: マイクのミュート/有効化（コメントタイム開始/終了時）
  - `sendAudio(audioData)`: 音声データ送信（ミュート中は自動スキップ）
  - `updateContext(pageText)`: ページ遷移時のコンテキスト更新
  - `disconnect()`: 絵本終了時に切断
  - Function Calling: `extractKeyword` + `endCommentTime` の2関数定義
- `hooks/useLiveSession.ts`: React フック
- `hooks/useAudioStream.ts`: マイク入力フック
- `hooks/useCommentTime.ts`: コメントタイムライフサイクル管理フック（NEW）
  - 終了条件管理: 無音5秒 / 最大30秒 / 手動スキップ / 終了キーワード
  - タイマー管理（残り時間表示）
- `components/book/CommentTimeButton.tsx`: コメントタイム開始ボタン（NEW）
- `components/book/CommentTimeOverlay.tsx`: コメントタイム中UI（NEW）
- `components/book/ModificationLoading.tsx`: 改変処理中ローディング（NEW）
- `components/media/VoiceIndicator.tsx`: 音声インジケーター（コメントタイム中のみ表示に変更）
- `components/media/ChildQuote.tsx`: 子供の発言表示
- VAD設定（子供向けチューニング）
- `lib/gemini/music-session.ts`: Lyria RealTimeセッション管理 **実装済み**
- `hooks/useMusicSession.ts`: BGM管理Reactフック **実装済み**
- `lib/audio/music-prompts.ts`: ページごとのBGMプロンプト定義 **実装済み**

**Gemini Live API設定:**
- モデル: `gemini-2.5-flash-preview-native-audio-dialog`
- 常時接続 + クライアント側ミュート制御（コメントタイム中のみ有効）
- Function Calling でキーワード・意図を構造化抽出
- コンテキスト圧縮で長時間セッション対応（`contextWindowCompression`: triggerTokens=8000, targetTokens=2048）
- VAD: startOfSpeechSensitivity=HIGH, endOfSpeechSensitivity=LOW, silenceDurationMs=3000（`realtimeInputConfig` で設定）

**ゴール**: コメントタイム中にマイクに話すとキーワードが抽出され、画面に発言が表示される。終了条件で自動終了する

### Phase 4: 改変エンジン + キャラクターエージェント + コメントタイム連携ループ (5時間)
- `lib/story/engine.ts`: 改変エンジン（**20%固定/80%自由ルール、Freeform全文再生成方式**）
  - **改変対象は「現在のページ」**（ライブ変換: 目の前のページがリアルタイムに変わる）
  - `pageRole` / `fixedElements` をプロンプトに含めることで固定要素を保護（LLMプロンプトベースの制約）
  - これまでの改変済みテキストを `previousPages` として文脈に含め、累積改変の一貫性を維持
  - 全文再生成プロンプト生成（スロット単位ではなく全文を再生成）
  - 改変履歴管理（`Modification` オブジェクトを返却）
  - **各ページ最大2回まで改変可能**（`modificationCount` で管理）
  - **波及再生成**: `regeneratePageInContext()` で改変以降のページを文脈に基づき自動再生成
- `lib/story/characters/agent.ts`: キャラクターエージェント基盤
  - Gemini 2.5 Flash を使ったキャラ反応生成
  - キャラクター定義（性格・行動パターン・反応スタイル）の読み込み
- `lib/story/characters/momotaro-chars.ts`: 桃太郎キャラクター定義
  - 桃太郎 / いぬ / さる / きじ / おに / おじいさん・おばあさん
- `lib/story/characters/akazukin-chars.ts`: 赤ずきんキャラクター定義
  - 赤ずきん / オオカミ / おばあさん / 猟師
- `lib/story/orchestrator.ts`: オーケストレーター
  - **現在のページ**の登場キャラクターを特定（`appearsInPages` でフィルタ）
  - 各エージェントへの並列問い合わせ（Promise.all）
  - **整合性チェック**: `buildConsistencyCheckPrompt` でfixedElements・previousPagesとの矛盾を検証、不整合時は修正版テキストを返す
  - キャラ反応取得と整合性チェックを**並列実行**（レイテンシ最小化）
  - エラー時は空の反応でフォールバック（個別キャラの失敗が全体をブロックしない）
- `lib/gemini/prompts.ts`: プロンプトテンプレート
  - `buildModificationPrompt`: キーワード改変プロンプト（既存）
  - `buildContextRegenerationPrompt`: 波及再生成プロンプト（キーワードなし・文脈のみ）
  - `buildConsistencyCheckPrompt`: 整合性チェックプロンプト
- `lib/firebase/firestore.ts`: Firestore永続化
  - `getOrCreateStorySession()`: セッション復元/新規作成（localStorageにセッションIDを保存）
  - `updateStoryPages()`: 改変のたびにページデータと改変履歴を自動保存
- Zustand ストアと改変エンジン + オーケストレーターの接続
- コメントタイム終了 → キーワード抽出 → 改変判定 → 整合性チェック → キャラ反応生成 → 画像生成 → 文字送り → ページめくり → 表示の全フロー結合
- レスポンス最適化（ローディングUI「おはなしを つくりかえているよ...」で遅延を隠す）

**改変ルール実装（20%固定/80%自由・全文再生成方式・ライブ改変）:**
```typescript
// engine.ts の核心ロジック
// 改変対象は現在のページ（targetPage = currentPage）
async function modifyCurrentPage(params: {
  bookTitle: string;
  keyword: string;
  currentPageIndex: number;
  pages: StoryPage[];
  trigger: 'voice' | 'drawing';
  apiKey: string;
}): Promise<{ modifiedText: string; modification: Modification; targetPageIndex: number }> {
  const targetPage = pages[currentPageIndex];  // 現在のページを改変

  const previousPages = pages.slice(0, currentPageIndex).map(p => ({
    pageNumber: p.pageNumber || p.id,
    currentText: p.currentText || p.text,  // 改変済みテキストを優先
  }));

  const prompt = buildModificationPrompt({
    bookTitle, pageRole, originalText, keyword, fixedElements, previousPages,
  });

  const modifiedText = await genai.models.generateContent({ model: TEXT_MODEL, contents: [...] });
  return { modifiedText, modification, targetPageIndex: currentPageIndex };
}

// 波及再生成（前ページの改変を反映して文脈に基づきページテキストを再生成）
async function regeneratePageInContext(params: {
  bookTitle: string;
  currentPageIndex: number;
  pages: StoryPage[];
  apiKey: string;
}): Promise<{ modifiedText: string; targetPageIndex: number }>
```

**オーケストレーター実装（整合性チェック付き）:**
```typescript
// orchestrator.ts の核心ロジック
async function orchestrate(params: {
  bookId: string;
  bookTitle: string;
  keyword: string;
  targetPage: StoryPage;
  modifiedText: string;
  previousPages: { pageNumber: number; currentText: string }[];  // 文脈
  apiKey: string;
}): Promise<OrchestratorResult> {
  // キャラクター反応と整合性チェックを並列実行
  const [reactions, consistencyResult] = await Promise.all([
    // 該当ページのキャラクターに並列問い合わせ
    Promise.all(activeCharacters.map(char => getCharacterReaction(...))),
    // 整合性チェック（fixedElements + previousPagesとの矛盾検証）
    checkConsistency({ bookTitle, pageRole, fixedElements, previousPages, modifiedText, apiKey }),
  ]);

  // 不整合時は修正版テキストを返す
  const finalText = consistencyResult.approved ? modifiedText : consistencyResult.correctedText;
  return { approved: consistencyResult.approved, modifiedText: finalText, characterReactions, imagePromptAdditions };
}
```

**ゴール**: コメントタイムで話した内容が**目の前のページにリアルタイム反映**され、文字送り演出で表示。キャラクターが反応し、以降のページにも改変が波及する完全なループが動作

### Phase 5: カメラ入力 + 落書き認識（コメントタイム中のみ） (2時間)
- `hooks/useCamera.ts`: カメラフック（**コメントタイム中のみ有効化に変更**）
- `components/media/CameraPreview.tsx`: PiP小窓（**コメントタイム中のみ表示に変更**）
- `app/api/recognize-drawing/route.ts`: 落書き認識API（`gemini-2.5-flash-lite-preview-06-17`使用）
- カメラフレーム → `gemini-2.5-flash-lite-preview-06-17` で物体認識 → キーワード抽出
- 認識結果を改変エンジンに渡す（音声と同じフロー）
- debounce処理: 前回認識完了前に次のフレームを送信しない
- **音声キーワードとの優先順位: 音声 > 落書き**
- **複数キーワード時: 最初の有効キーワードのみ採用**

**ゴール**: コメントタイム中に落書きをカメラに見せると、その要素が次のページの絵本に反映される

### Phase 6: 共有機能 (2時間)
- `lib/firebase/firestore.ts`: Firestore CRUD
- `app/api/share/route.ts`: 共有トークン生成
- `app/story/[shareToken]/page.tsx`: 共有絵本ビューア（ISR）
- `app/story/[shareToken]/opengraph-image.tsx`: OG画像（表紙）
- `components/share/ShareModal.tsx`: 共有モーダル
- `components/share/ShareButtons.tsx`: X/LINE シェアボタン
- `components/share/QRCodeShare.tsx`: QRコード表示

**共有フロー:**
1. 絵本完成後「共有する」ボタン
2. Firestoreにストーリー保存 + shareToken生成
3. OG画像 = 絵本の表紙イラスト
4. X/LINEで表紙付きシェア
5. リンクを開くと改変された絵本が閲覧できる

**ゴール**: 完成した絵本をSNSで表紙付きシェア、リンクから絵本として閲覧可能

### Phase 7: ポリッシュ + デプロイ (3時間)
- Firebase App Hosting セットアップ・デプロイ
- レスポンシブ対応（タブレット最適化）
- エラーハンドリング・フォールバック
- SE音量バランス調整
- デモ用シナリオのリハーサル
- 録画デモの準備
- パフォーマンスチューニング

---

## ページライフサイクル（コメントタイム方式 + ライブ改変 + 波及生成）

各ページの読み聞かせ終了後に「コメントタイム」を設け、その間だけ音声・カメラ入力を受け付ける。**改変対象は「現在のページ」**（ライブ変換）。改変後、以降のページにもその文脈が波及し、物語全体が累積的に分岐する。

### なぜコメントタイム方式か

- APIリクエストが大量に発生する問題を解消（コスト・レイテンシ）
- 子供の無関係な発言にも反応してしまう問題を解消
- 改変リクエスト連発でキャラクターエージェント（並列Gemini呼び出し）が過負荷になる問題を解消

### なぜライブ改変か（次ページ改変→現在ページ改変への変更理由）

- **因果関係が直感的**: 子どもが話す → 目の前のページが変わる、という即座のフィードバック
- **驚きが大きい**: 自分の声で目の前の物語が書き換わる体験
- **波及生成**: 改変の影響が以降のページにも広がり、物語全体が分岐するAI-native体験

### ページライフサイクルフロー

```
[絵本開始]
    ├── Gemini Live API 接続（音声用、既存）
    ├── Lyria RealTime 接続（BGM生成）
    └── Firestoreセッション復元/新規作成
    ↓
[ページN表示] → reading フェーズ
    ├── needsContextRegeneration=true の場合:
    │   → modifying（ModificationLoading表示）→ 波及再生成完了
    │   → modified（新テキスト文字送り）→ readingComplete
    └── needsContextRegeneration=false の場合:
        → テキスト文字送り → readingComplete
    ↓
[readingComplete]
    ├── modificationCount < 2 → コメントタイムボタン出現
    │   ├── タップ → commentTime 開始
    │   │   ├── マイク有効化 (MediaStreamTrack.enabled = true)
    │   │   ├── カメラ有効化（PiP小窓表示）
    │   │   ├── Live API でキーワード抽出
    │   │   └── 終了トリガー:
    │   │       (a) 無音5秒 (b) 最大30秒 (c) 手動ボタン (d) 終了キーワード「つぎ」等
    │   └── スキップ → transitioning → ページめくり
    └── modificationCount >= 2 → 自動で transitioning → ページめくり
    ↓
[改変処理]（キーワードがある場合のみ）
    ├── modifying: 改変対象=現在のページ（ライブ変換）
    ├── エンジン改変 → オーケストレーター（整合性チェック + キャラ反応を並列実行）
    ├── ローディングUI:「おはなしを つくりかえているよ...」
    ├── 改変完了 → modified フェーズ（新テキスト文字送り表示）
    ├── 以降のページに needsContextRegeneration=true をセット（波及フラグ）
    ├── Firestoreに自動保存
    ↓
[文字送り完了] → transitioning → ページめくりアニメーション → syncPageIndex → reading（次ページ）
    ↓
[次ページ: needsContextRegeneration=true の場合]
    → 自動で波及再生成（前ページの改変文脈を反映）
    ↓
[P12（最終ページ）]
    ↓
[絵本終了]
    └── Gemini Live API 切断
```

### 改変処理フロー（コメントタイム終了後）

```
[コメントタイム終了 → キーワードあり]
    │
    ▼
[Story Engine (engine.ts) - modifyCurrentPage]
    │
    ├── ライブ改変処理（20%固定/80%自由）
    │   - 改変対象: 現在のページ（ページN自身）
    │   - pageRole / fixedElements をプロンプトに含めることでLLMが固定要素を保護
    │   - previousPages（改変済みテキスト含む）を文脈に含め一貫性を維持
    │   - 全文再生成プロンプトを構築（buildModificationPrompt）
    │
    ▼
[オーケストレーター (orchestrator.ts) - orchestrate]
    │
    ├── 以下を並列実行:
    │   ├── [キャラクター反応取得]
    │   │   ├── 現在のページの登場キャラクターを特定
    │   │   ├── 各キャラクターエージェントに並列問い合わせ
    │   │   │   ├── 桃太郎「よし、ドラゴンのたまごを もっていくぞ！」
    │   │   │   ├── 犬「わん！すごい たまご だ！」
    │   │   │   └── 猿「きをつけろ、なにが うまれるか わからないぞ」
    │   │
    │   └── [整合性チェック (checkConsistency)]
    │       ├── fixedElements が守られているか
    │       ├── previousPages との物語的矛盾がないか
    │       ├── キャラクターの行動に整合性があるか
    │       └── 不整合時 → 修正版テキストを返す
    │
    ├── キャラ反応を統合 → imagePromptAdditions 生成
    ├── 整合性チェック結果に基づき最終テキストを決定
    │
    ▼
[Zustand Store 更新 (completeModification)]
    │
    ├── currentText 更新（現在のページN）
    ├── modificationCount インクリメント
    ├── isModified フラグ設定
    ├── 改変履歴（Modification）に記録
    ├── ページN+1以降に needsContextRegeneration=true をセット（波及フラグ）
    │   ※既にユーザーが改変済み(modificationCount > 0)のページはフラグを立てない
    ├── Firestore に自動保存（バックグラウンド）
    │
    ▼
[pagePhase: 'modified' → 新テキスト文字送り表示]
    │
    ├── StoryText で改変テキストが文字送りアニメーション表示
    │
    ▼
[文字送り完了 → transitioning → ページめくりアニメーション]
    │
    ├── StoryBookViewer がtransitioning検知 → CSS flip → 700ms → syncPageIndex
    │
    ▼
[次ページ: reading フェーズ]
    │
    ├── needsContextRegeneration=true の場合:
    │   ├── modifying フェーズ（ModificationLoading表示）
    │   ├── regeneratePageInContext() で文脈に基づき自動再生成
    │   ├── modified → 文字送り → readingComplete
    │   └── コメントタイム or transitioning
    │
    └── needsContextRegeneration=false の場合:
        └── 通常の文字送り → readingComplete

[落書き（コメントタイム中のみ）] ──→ [カメラキャプチャ]
    │
    ├── Gemini で物体認識
    │   例: 紙に描いた星 → { keyword: "星" }
    │
    └── (以降は音声と同じフロー)
```

### Live APIセッション管理

**方式**: 常時接続 + クライアント側ミュート制御（都度接続ではない）
- 理由: 接続遅延ゼロ、物語コンテキスト蓄積、実装がシンプル

`lib/gemini/live-session.ts` のAPI（`LiveSessionManager` クラス）:
- `connect()`: WebSocket接続（絵本開始時に1回）
- `setMuted(muted: boolean)`: マイクのミュート/有効化（コメントタイム開始/終了時に切替）
- `sendAudio(audioData: string)`: 音声データ送信（ミュート中は自動スキップ）
- `updateContext(pageText: string)`: ページ遷移時のコンテキスト更新
- `disconnect()`: 絵本終了時に切断

Function Calling: `extractKeyword` + `endCommentTime` の2関数定義

VAD設定（子供向けチューニング）:
- startOfSpeechSensitivity: HIGH（小さな声も拾う）
- endOfSpeechSensitivity: LOW（考えながら話す間も待つ）
- silenceDurationMs: 3000

### コメントタイム終了条件

| 条件 | 説明 |
|------|------|
| 無音5秒 | 子供が話し終えたと判断 |
| 最大30秒 | コメントタイムの上限 |
| 手動スキップボタン | UIのスキップボタンタップ |
| 終了キーワード | 「つぎ」等の発話で終了 |

### カメラ入力との統合

- コメントタイム中のみカメラ有効化（常時認識から変更）
- 音声キーワードとの優先順位: 音声 > 落書き
- 複数キーワード時: 最初の有効キーワードのみ採用

### Zustand Store 追加状態（stores/story-store.ts）

```typescript
// 追加フィールド
pagePhase: PagePhase;  // 'reading' | 'readingComplete' | 'commentTime' | 'modifying' | 'modified' | 'transitioning'
isCommentTimeActive: boolean;
commentTimeRemainingMs: number;
commentTimeEndReason: CommentTimeEndReason | null;
childUtterance: string | null;
pendingKeywords: ExtractionResult[];
selectedKeyword: ExtractionResult | null;
modificationPhase: ModificationPhase;
modifications: Modification[];
shareToken: string | null;
isShared: boolean;
isSharing: boolean;
storySessionId: string | null;  // FirestoreドキュメントID

// 追加アクション
initializeStory: (bookId: string, pages: StoryPage[], storySessionId?: string) => void;
setPagePhase: (phase: PagePhase) => void;
startCommentTime: () => void;
endCommentTime: (reason: CommentTimeEndReason) => void;
setCommentTimeRemaining: (ms: number) => void;
setChildUtterance: (utterance: string | null) => void;
addPendingKeyword: (keyword: ExtractionResult) => void;
selectKeyword: (keyword: ExtractionResult | null) => void;
startModification: () => void;
setModificationPhase: (phase: ModificationPhase) => void;
completeModification: (targetPageIndex: number, newText: string, newIllustration?: string, modification?: Modification) => void;
  // → pagePhase を 'modified' に設定（文字送り表示用）
  // → modificationCount をインクリメント
  // → 以降のページに needsContextRegeneration=true をセット（波及フラグ）
  // → Firestoreに自動保存（バックグラウンド）
skipCommentTime: () => void;
goToNextPage: () => void;
goToPrevPage: () => void;
syncPageIndex: (index: number) => void;  // StoryBookViewerのflip完了後にストアと同期
clearContextRegenerationFlag: (pageIndex: number) => void;  // 波及再生成完了後にフラグクリア
resetSession: () => void;
shareStory: () => Promise<string | null>;
```

### 既存コンポーネントへの変更

| コンポーネント | 変更内容 |
|---------------|---------|
| `StoryText.tsx` | `onComplete` コールバック追加（文字送り完了通知） |
| `BookPage.tsx` | `pagePhase` に応じた子コンポーネント出し分け。CommentTimeButton表示条件に `modificationCount < 2` チェック追加（2回改変済みのページではボタン非表示） |
| `StoryBookViewer.tsx` | `syncPageIndex` 呼び出し追加（goToNextPage/goToPrevPageのflip完了後）。`transitioning` フェーズ監視 useEffect で CSS flip を自動トリガー |
| `VoiceIndicator.tsx` | コメントタイム中のみ表示 |
| `CameraPreview.tsx` | コメントタイム中のみ表示 |

---

## デモシナリオ（録画）

### 桃太郎編 (約2分)

1. **P1表示** → 穏やかな和風BGM（琴と竹笛）開始 → テキスト文字送り完了 → コメントタイムボタン出現 → **スキップ**
2. **P2表示** → BGMが神秘的に変化 → コメントタイムボタン → タップ → **コメントタイム開始**（BGM音量が自動で下がる）
   → 子供「うちゅうから ももが ふってきた！」
   → ローディング「おはなしを つくりかえているよ...」
   → **P2自身がライブ改変**（目の前のテキストが書き換わり文字送り表示）
   → 文字送り完了 → 自動ページめくり
3. **P3表示** → 波及再生成（P2の改変文脈を反映して自動再生成）→ コメントタイム → **落書き: 光る剣**
   → **P3自身がライブ改変**（持ち物が光る剣に）→ 自動ページめくり
4. **P4表示** → 波及再生成 → コメントタイム → スキップ
5. **P5表示** → コメントタイム → 子供「おには くもの うえに いる！」
   → **P5自身がライブ改変**（雲上の城の描写）→ 自動ページめくり
6. **P6表示** → 波及再生成（雲上の城の文脈反映）→ コメントタイム → スキップ
7. **P7〜P11表示** → 波及再生成 → コメントタイム → スキップ
8. **P12表示**: ハッピーエンド（改変要素が伏線回収）→ **共有ボタン**（コメントタイムボタンの代わり）
9. **共有**: 表紙をXでシェア → リンクから閲覧

---

## 検証方法

1. **Phase 1完了後**: 静的絵本が正しく表示されるか確認（ページ送り、レイアウト）
2. **Phase 2完了後**: `curl` でAPI Routeを叩き、画像が生成されるか確認
3. **Phase 3完了後（コメントタイム方式）**:
   - コメントタイムボタンがテキスト表示完了後に出現するか確認
   - ボタンタップでマイクが有効化され、VoiceIndicatorが表示されるか
   - 無音5秒 / 30秒制限で自動終了するか
   - スキップ時は改変なしで即座にページめくりされるか
   - P12ではコメントタイムボタンの代わりに共有ボタンが表示されるか
4. **Phase 4完了後（ライブ改変 + 波及生成）**:
   - キーワード抽出後、**現在のページ自身**がリアルタイムに改変されるか
   - 改変後テキストが文字送りアニメーションで表示されるか（`modified` フェーズ）
   - 文字送り完了後に自動ページめくりが発動するか
   - 次ページ進入時にModificationLoading → 波及再生成テキスト表示されるか
   - 同じページで2回改変後はCommentTimeButtonが出ないことを確認
   - 累積改変の一貫性が保たれるか（例: P5で宇宙→P6以降も宇宙反映）
   - fixedElementsに違反する改変がオーケストレーターの整合性チェックで修正されるか
   - StoryBookViewerのcurrentPageとストアのcurrentPageIndexが常に一致するか
   - Firestore永続化: 改変後にリロード → 改変済みストーリーが復元されるか
   - セッション管理: 同じbookIdで再訪問 → 前回の改変セッションが継続されるか
5. **Phase 5完了後**: コメントタイム中に紙に描いた絵をカメラに見せて認識されるか確認
6. **Phase 6完了後**: 共有URL生成→SNSシェア→リンクから閲覧可能か確認
7. **Phase 7完了後**: Firebase App Hosting にデプロイし、外部からアクセス確認
8. **BGM検証（Lyria RealTime実装済み）**:
   - Lyria RealTime接続が絵本開始時に成功するか
   - ページ遷移時にBGMがスムーズに変化するか
   - コメントタイム中にBGM音量が下がるか
   - 接続失敗時にフォールバックBGMが再生されるか
   - ミュートボタンでSE + BGMがミュートされるか

---

## 重要な技術的注意点

- **SDK**: `@google/genai` v1.42.0+ を使用。旧`@google/generative-ai`は非推奨・使用禁止
- **APIキー保護**: Gemini APIキーは `GEMINI_API_KEY`（サーバーサイドのみ）で管理。テキスト改変は `/api/modify`, `/api/regenerate` 経由。WebSocket接続（Live API/Lyria）は `/api/session-key` 経由でキーを取得（本番環境ではプロキシまたは短寿命トークンに切り替えること）
- **画像生成の遅延**: Gemini 3 Pro Imageは8-12秒かかるため、水彩ディゾルブアニメーション（2-3秒）＋「おはなしを かきかえているよ...」等のメッセージで体感遅延を隠す
- **画像生成フォールバック**: プライマリ `gemini-3-pro-image-preview` → フォールバック `gemini-2.5-flash-image`。サーキットブレーカーパターンでエラー時に自動切替
- **セッション管理**: Gemini Live APIのセッションは15分制限。`contextWindowCompression`（triggerTokens=8000, slidingWindow targetTokens=2048）を有効化済みで長時間セッション対応
- **日本語フォント**: ひらがな中心の丸ゴシック体（M PLUS Rounded 1cなど）を使用
- **モデル廃止注意**: `gemini-live-2.5-flash-preview-native-audio-09-2025`は2026/3/19に廃止 → 使用しないこと
- **Lyria RealTime BGM**: 実装済み（`@google/genai` SDK の `ai.live.music.connect()` を使用、フォールバックBGM対応）
- **WebSocket接続**: Live API (`gemini-2.5-flash-preview-native-audio-dialog`) と Lyria RealTime (`lyria-realtime-exp`) をクライアントから直接WebSocket接続
