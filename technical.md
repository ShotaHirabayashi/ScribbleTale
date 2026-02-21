# ScribbleTale 技術仕様

> 本ドキュメントは [plan.md](./plan.md) の技術詳細を記載する。
> ストーリーテンプレート・キャラクター定義は [story-data.md](./story-data.md) を参照。

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | Next.js 16 App Router + TypeScript |
| SDK | `@google/genai` v1.42.0+ (旧`@google/generative-ai`は非推奨) |
| 音声AI | Gemini Live API (クライアント直接WebSocket) |
| 画像生成 | `gemini-3-pro-image-preview` (サーバーサイドAPI Route) |
| 画像生成フォールバック | `gemini-2.5-flash-image` (高速フォールバック、サーキットブレーカー制御) |
| テキスト生成 | `gemini-2.5-flash-preview-05-20` (改変テキスト生成) |
| 落書き認識 | `gemini-2.5-flash-lite-preview-06-17` (カメラフレーム解析) |
| 状態管理 | Zustand |
| DB | Firebase Firestore |
| Storage | Firebase Storage |
| Deploy | Firebase App Hosting |
| アニメーション | Framer Motion + CSS (水彩ディゾルブ) |
| BGM生成 | Lyria RealTime (`models/lyria-realtime-exp`) **実装済み** |
| 共有 | nanoid + next/og + qrcode.react |

---

## Gemini モデルマップ

| ユースケース | モデル ID | 実行場所 | レイテンシ |
|-------------|----------|---------|-----------|
| 音声入力 (Live API) | `gemini-2.5-flash-preview-native-audio-dialog` | クライアントWebSocket | < 1秒 |
| 画像生成 (プライマリ) | `gemini-3-pro-image-preview` | サーバー API Route | 8-12秒 |
| 画像生成 (フォールバック) | `gemini-2.5-flash-image` | サーバー API Route | ~4秒 |
| 落書き認識 | `gemini-2.5-flash-lite-preview-06-17` | サーバー API Route | 0.3-1.0秒 |
| テキスト生成 (改変) | `gemini-2.5-flash-preview-05-20` | サーバー API Route | 0.5-1.0秒 |
| キャラクター反応生成 | `gemini-2.5-flash-preview-05-20` | サーバー API Route | 0.5-1.0秒 (並列) |
| BGM生成 (Lyria RealTime) | `models/lyria-realtime-exp` | クライアントWebSocket | リアルタイム |
| OG画像 | `next/og` (Gemini不使用) | Edge Runtime | ミリ秒 |

### 画像生成フォールバック戦略
`gemini-3-pro-image-preview` をプライマリ、`gemini-2.5-flash-image` をフォールバックとして使用。エラー発生時のサーキットブレーカーパターン:
1. まず `gemini-3-pro-image-preview` で生成を試行（15秒タイムアウト）
2. エラーまたはタイムアウト時にサーキットブレーカーが発動
3. サーキットブレーカー発動中（60秒間）は即座に `gemini-2.5-flash-image` を使用
4. クールダウン後にプライマリモデルを再試行

---

## プロジェクト構成

```
ScribbleTale/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # ルートレイアウト (next/font設定)
│   │   ├── page.tsx                # トップページ (HeroSection, ExperienceSection, ParentInfoSection)
│   │   ├── library/
│   │   │   └── page.tsx            # ライブラリページ（絵本選択）
│   │   ├── book/
│   │   │   └── [bookId]/
│   │   │       ├── page.tsx        # メイン絵本体験ページ
│   │   │       └── cover/
│   │   │           └── page.tsx    # カバーページ
│   │   ├── story/
│   │   │   └── [shareToken]/
│   │   │       ├── page.tsx        # 共有絵本ビューア（実装済み）
│   │   │       ├── SharedStoryViewer.tsx  # 共有用クライアントコンポーネント
│   │   │       ├── not-found.tsx   # 404ページ
│   │   │       └── opengraph-image.tsx  # OG画像動的生成
│   │   └── api/
│   │       ├── generate-image/
│   │       │   └── route.ts        # 画像生成 (gemini-3-pro-image-preview)
│   │       ├── edit-image/
│   │       │   └── route.ts        # 画像編集（改変時）
│   │       ├── recognize-drawing/
│   │       │   └── route.ts        # 落書き認識 (gemini-2.5-flash-lite-preview-06-17)
│   │       └── share/
│   │           └── route.ts        # 共有トークン生成
│   ├── components/
│   │   ├── book/
│   │   │   ├── StoryBookViewer.tsx  # CSS 3D transform ページめくり + レイアウト統合
│   │   │   ├── BookPage.tsx        # 個別ページ (紙テクスチャ + イラスト)
│   │   │   ├── StoryText.tsx       # テキスト文字送りアニメーション (CSS transition, onComplete付き)
│   │   │   ├── CommentTimeButton.tsx     # コメントタイム開始ボタン
│   │   │   ├── CommentTimeOverlay.tsx    # コメントタイム中UI
│   │   │   └── ModificationLoading.tsx   # 改変処理中ローディング
│   │   ├── top/
│   │   │   ├── HeroSection.tsx     # トップページヒーロー
│   │   │   ├── ExperienceSection.tsx  # 体験セクション
│   │   │   └── ParentInfoSection.tsx  # 保護者向け情報
│   │   ├── cover/
│   │   │   └── ...                 # カバー関連コンポーネント
│   │   ├── library/
│   │   │   └── ...                 # ライブラリ関連コンポーネント
│   │   ├── media/
│   │   │   ├── CameraPreview.tsx   # PiPカメラ小窓
│   │   │   ├── VoiceIndicator.tsx  # 音声入力インジケーター
│   │   │   └── ChildQuote.tsx      # 子供の発言表示
│   │   ├── effects/
│   │   │   ├── SvgFilters.tsx      # SVGフィルター定義 (紙質 + 水彩にじみ + ディゾルブ)
│   │   │   ├── WatercolorTransition.tsx  # Framer Motion + SVGフィルターディゾルブ
│   │   │   └── PaperTexture.tsx    # 紙質テクスチャ (mix-blend-mode)
│   │   ├── audio/
│   │   │   └── SoundProvider.tsx   # Howler.js コンテキストプロバイダー（ミュート制御含む）
│   │   ├── share/
│   │   │   ├── ShareModal.tsx      # 共有モーダル
│   │   │   ├── ShareButtons.tsx    # X/LINE シェアボタン
│   │   │   └── QRCodeShare.tsx     # QRコード
│   │   └── ui/                     # shadcn/ui コンポーネント群
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts           # Firebase初期化
│   │   │   ├── firestore.ts        # Firestore操作（saveStory/updateStoryPages/getOrCreateStorySession）
│   │   │   └── storage.ts          # Storage操作
│   │   ├── gemini/
│   │   │   ├── live-session.ts     # Live API WebSocket管理
│   │   │   ├── music-session.ts    # Lyria RealTime BGMセッション管理
│   │   │   ├── image-generator.ts  # 画像生成 (gemini-3-pro-image-preview + サーキットブレーカー)
│   │   │   └── prompts.ts          # プロンプトテンプレート（改変/波及再生成/整合性チェック/キャラ反応/画像）
│   │   ├── audio/
│   │   │   ├── sound-manager.ts    # Howler.js サウンドマネージャー（SE専用）
│   │   │   └── music-prompts.ts    # ページごとのBGMプロンプト定義
│   │   ├── story/
│   │   │   ├── engine.ts           # 改変エンジン（ライブ改変 modifyCurrentPage + 波及再生成 regeneratePageInContext）
│   │   │   ├── orchestrator.ts     # オーケストレーター（キャラクター反応 + 整合性チェック並列実行）
│   │   │   ├── characters/
│   │   │   │   ├── agent.ts        # キャラクターエージェント基盤（Gemini呼び出し）
│   │   │   │   ├── momotaro-chars.ts  # 桃太郎キャラクター定義
│   │   │   │   └── akazukin-chars.ts  # 赤ずきんキャラクター定義
│   │   │   ├── momotaro.ts         # 桃太郎12ページデータ
│   │   │   └── akazukin.ts         # 赤ずきん12ページデータ
│   │   └── types/
│   │       └── index.ts            # 型定義
│   ├── stores/
│   │   └── story-store.ts          # Zustand状態管理
│   └── hooks/
│       ├── useAudioStream.ts       # マイク入力フック
│       ├── useCamera.ts            # カメラ入力フック
│       ├── useCommentTime.ts       # コメントタイムライフサイクル管理フック
│       ├── useLiveSession.ts       # Gemini Live APIフック
│       ├── useMusicSession.ts      # Lyria RealTime BGMフック
│       ├── usePagePreloader.ts     # 画像プリロードフック
│       └── useStory.ts             # 絵本状態フック
├── public/
│   ├── sounds/
│   │   ├── page-turn.mp3           # ページめくり音
│   │   ├── paper-rustle.mp3        # 紙のざわめき音
│   │   ├── watercolor-drip.mp3     # 水彩にじみ音
│   │   ├── magic-chime.mp3         # 改変時のチャイム音
│   │   └── fallback-bgm.wav       # フォールバックBGM（Lyria接続失敗時）
│   └── fonts/                      # 日本語フォント (next/fontで管理)
├── package.json
├── next.config.ts
├── tsconfig.json
├── .env.local                      # APIキー等
└── firebase.json                   # Firebase設定
```

---

## データモデル (Firestore)

### stories コレクション（StorySession型）
```typescript
interface StorySession {
  id: string;
  bookId: 'momotaro' | 'akazukin';
  pages: StoryPage[];
  modifications: Modification[];  // 改変履歴
  shareToken: string | null;
  isShared: boolean;
  createdAt: number;             // Unix timestamp (ms)
  updatedAt: number;             // Unix timestamp (ms)
}

// 既存型（後方互換維持。全フィールドoptionalで段階的に拡張）
interface StoryPage {
  id: number;                    // ページインデックス
  illustration: string;          // イラストURL（初期 or 改変後）
  text: string;                  // 原文テキスト
  alt: string;                   // 画像alt属性
  pageNumber?: number;           // 1-12
  pageRole?: string;             // ページの役割（固定20%）例: '導入', '仲間との出会い', 'クライマックス'
  fixedElements?: string[];      // 固定要素（ページの役割を構成する最小骨格）
  freeElements?: string[];       // 自由要素（子供が変えられるもの）
  originalText?: string;         // 原文テキスト（改変前保存用）
  currentText?: string;          // 現在のテキスト（改変後）
  isModified?: boolean;          // 改変済みかどうか
  modificationCount?: number;    // 改変回数カウンター（最大2回まで改変可能）
  needsContextRegeneration?: boolean;  // 前のページの改変を反映して再生成が必要か（波及フラグ）
}

interface Modification {
  timestamp: number;             // Unix timestamp (ms)
  pageNumber: number;
  targetPageNumber: number;      // 改変対象ページ（ライブ改変: pageNumber と同値）
  trigger: 'voice' | 'drawing';
  input: string;                 // 抽出されたキーワード
  beforeText: string;            // 改変前の全文
  afterText: string;             // 改変後の全文
}
```

### キャラクターエージェント定義
```typescript
interface CharacterAgent {
  id: string;                    // 例: 'momotaro', 'dog', 'oni'
  name: string;                  // 表示名: '桃太郎', 'いぬ', 'おに'
  personality: string;           // 性格: '勇敢で優しい'
  behaviorPatterns: string[];    // 行動パターン: ['困っている人を助ける', '仲間を大切にする']
  reactionStyle: string;         // 反応のトーン: 'やる気満々で前向き'
  appearsInPages: number[];      // 登場ページ: [3, 4, 5, 6, 7, 8]
  relationships: Record<string, string>;  // 他キャラとの関係: { dog: '頼れる仲間' }
}

interface CharacterReaction {
  characterId: string;
  reaction: string;              // キャラの反応テキスト: 'ドラゴンのたまご？ よし、大切に持っていくぞ！'
  emotionalState: 'excited' | 'surprised' | 'worried' | 'happy' | 'angry' | 'sad';
  narrativeImpact: string;       // 物語への影響: 'ドラゴンのたまごを道具袋に入れた'
}

interface OrchestratorResult {
  approved: boolean;             // 整合性チェック合格か（不合格時は修正版テキストをmodifiedTextに格納）
  modifiedText: string;          // 最終テキスト（整合性チェック修正版 or 元テキスト）
  characterReactions: CharacterReaction[];  // 各キャラの反応
  imagePromptAdditions: string;  // 画像プロンプトへの追加指示
}
```

### shareTokens コレクション（逆引きインデックス）
```typescript
interface ShareTokenData {
  storyId: string;
  shareToken: string;
  createdAt: number;  // Unix timestamp (ms)
}
```

### Lyria RealTime BGM関連型定義（実装済み）
```typescript
// music-prompts.ts
interface MusicPromptConfig {
  prompts: WeightedPrompt[];  // @google/genai の WeightedPrompt 型
  generationConfig: LiveMusicGenerationConfig;  // bpm, density, brightness, temperature 等
}

// music-session.ts - MusicSessionManager クラス
// - connect(apiKey): Lyria WebSocket接続
// - updatePrompt(prompts): BGMプロンプト動的更新
// - updateConfig(config): 生成パラメータ変更
// - play() / pause() / setVolume(volume) / disconnect()

// useMusicSession.ts - Reactフック
// - サーキットブレーカー: 3回連続エラーでフォールバックBGMに自動切替
// - コメントタイム中はボリューム自動低下
```

### コメントタイム関連型定義（types/index.ts に追加）
```typescript
type PagePhase = 'reading' | 'readingComplete' | 'commentTime' | 'modifying' | 'modified' | 'transitioning';
// 'modified': 改変完了後、新テキストを文字送りで表示するフェーズ。ページ遷移はしない
type ModificationPhase = 'idle' | 'orchestrating' | 'generating_image' | 'complete';
type CommentTimeEndReason = 'keyword_detected' | 'silence_timeout' | 'manual_skip' | 'max_time_reached' | 'end_keyword';

interface ExtractionResult {
  keyword: string;
  childUtterance: string;
  trigger: 'voice' | 'drawing';
  timestamp: number;
}

interface CommentTimeConfig {
  maxDurationMs: number;       // デフォルト: 30000
  silenceTimeoutMs: number;    // デフォルト: 5000
  enableCamera: boolean;       // デフォルト: true
}
```

### Firestoreセッション管理

改変したシナリオをFirestoreに自動保存し、リロードしても改変済みストーリーを復元する。

```typescript
// firestore.ts のAPI
getOrCreateStorySession(bookId, initialPages)  // セッション復元/新規作成
  // → localStorage に scribble-session-{bookId} としてセッションIDを保存
  // → Firestoreにセッションがあれば復元、なければ新規作成

updateStoryPages(storyId, pages, modifications)  // 改変のたびに自動保存
  // → completeModification() 内からバックグラウンドで呼び出し（await不要）

// Firestoreドキュメント構造
// stories/{storyId}/
//   ├── bookId: string
//   ├── pages: StoryPage[]        // modificationCount, needsContextRegeneration含む
//   ├── modifications: Modification[]
//   ├── isShared: boolean
//   ├── shareToken: string
//   ├── createdAt: serverTimestamp  // 初回のみ
//   └── updatedAt: serverTimestamp  // 毎回更新
```

---

## 絵本の没入感（リアリティ演出）

### ページめくりアニメーション
- **方式**: CSS 3D transform (`rotateY` + 700ms `cubic-bezier`)
- `StoryBookViewer.tsx` にレイアウトとアニメーションを統合
- `react-pageflip` は不使用
- タッチ/スワイプ対応（タブレット向け）
- ページめくり中に水彩ディゾルブを同時トリガー可能

### 紙質テクスチャ（SVGフィルター）
画像ファイル不要。SVGフィルターのみで紙のリアリティを表現:
- `feTurbulence` (fractalNoise) で紙の繊維質感
- `feDiffuseLighting` で立体的な凹凸感
- `mix-blend-mode: multiply` でイラストが紙に「塗られた」感覚
- ページ周縁のビネット効果（古紙感）

### ガター（綴じ目）+ ページ端シャドウ
- 中央にlinear-gradientで綴じ目の影
- 左ページ右端、右ページ左端に微妙な影
- 下端コーナーに軽い浮き（ページカール暗示）

### 水彩にじみエフェクト（画像変化時）
改変で画像が切り替わるとき:
1. SVGフィルター `feDisplacementMap` + `feTurbulence` で有機的なにじみ
2. Framer Motion で opacity + blur アニメーション
3. `mix-blend-mode: multiply` で紙テクスチャとの一体感
4. 水彩ドリップ音をHowler.jsで同時再生

### サウンドデザイン

**BGM: Lyria RealTime（実装済み）**
- `@google/genai` SDK の `ai.live.music.connect()` でWebSocket接続
- ページごとにBGMプロンプトを動的切替（`music-prompts.ts`）
- コメントタイム中はボリュームを自動低下
- サーキットブレーカー: 3回連続エラーでフォールバックBGM（`fallback-bgm.wav`）に固定
- Web Audio API でPCMチャンクをギャップレス再生（48kHz, ステレオ）

**SE: Howler.js（静的MP3）**
- ページめくり音（紙のこすれ音）
- 水彩にじみ音（改変時）
- 魔法チャイム音（改変成功時）
- ステレオパンニング（左ページめくりは左寄り音）

**統合管理: SoundProvider.tsx**
- マスターボリューム制御
- SE/BGM個別ミュート対応
- ミュートボタン付き

**音量バランス（デフォルト）:**

| 音源 | 音量 | 備考 |
|------|------|------|
| ページめくりSE | 0.3 | |
| 紙のざわめきSE | 0.2 | |
| 水彩にじみSE | 0.4 | |
| チャイムSE | 0.5 | 改変成功を明確に伝える |

### タイポグラフィ
- **本文**: Yomogi（手書き風）+ Zen Maru Gothic（丸ゴシック）
- **子供の発言引用**: Klee One（ペン書き風）
- **UI**: Zen Maru Gothic
- `next/font/google` で自動サブセット + セルフホスト
- 文字送りアニメーション: CSS transition (opacity 50ms) で1文字ずつ出現

### パフォーマンス最適化
- **画像戦略**: 事前生成済みイラストをFirebase Storageに保存、CDNキャッシュ (max-age=31536000)
- **プリロード**: 現在のページ + 前後2ページを先読み（`usePagePreloader` フックで実装済み）
- **ブラーアップ**: SVG blur placeholderを表示 → 本画像ロード完了で切替
- **画像フォーマット**: AVIF優先、WebPフォールバック (`next.config.ts` で設定)
- **レンダリング最適化**: `will-change: transform` + `contain: layout style paint` で GPU レイヤー化
- **非表示ページ**: `content-visibility: auto` でオフスクリーンページの描画コストを削減

---

## パッケージ一覧

```
@google/genai          # Gemini SDK (v1.42.0+)
firebase               # Firebase SDK (v12.9.0)
zustand                # 状態管理 (v5.0.11)
framer-motion          # アニメーション
howler                 # サウンド（SE再生）
nanoid                 # 共有トークン生成
qrcode.react           # QRコード
react-hook-form        # フォーム管理
shadcn/ui              # UIコンポーネント群（Radix UI ベース）
tailwindcss            # CSS フレームワーク (v4.2.0)
@types/howler          # (devDependencies)
```

---

## 画像生成実装パターン

```typescript
// image-generator.ts の核心
const PRIMARY_MODEL = 'gemini-3-pro-image-preview'
const FALLBACK_MODEL = 'gemini-2.5-flash-image'

async function generateImage(prompt: string, apiKey: string, referenceImageBase64?: string) {
  // サーキットブレーカーが開いている場合はフォールバックモデルを使用
  if (isCircuitBreakerOpen()) {
    return generateWithModel(genai, FALLBACK_MODEL, prompt, referenceImageBase64)
  }

  try {
    // プライマリモデルで試行（10秒タイムアウト）
    return await generateWithTimeout(
      generateWithModel(genai, PRIMARY_MODEL, prompt, referenceImageBase64),
      10000
    )
  } catch (error) {
    console.warn('Primary model failed:', error)
    tripCircuitBreaker() // 60秒間フォールバックモードに
    return generateWithModel(genai, FALLBACK_MODEL, prompt, referenceImageBase64)
  }
}
```

**画風プロンプト（固定）:**
```
Japanese picture book illustration, soft watercolor and colored pencil,
muted pastel tones, wide white margins, gentle hand-drawn lines,
natural paper texture, minimal detail, consistent character design
```
