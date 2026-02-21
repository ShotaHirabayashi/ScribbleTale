# Lyria RealTime 統合設計

> ScribbleTaleにLyria RealTime（`lyria-realtime-exp`）を統合し、絵本の場面に合わせたリアルタイムBGMを生成する。

---

## 概要

現在のサウンド設計（Howler.js + 静的MP3ファイル）に加え、Lyria RealTimeによるAI生成BGMを追加する。
ページの内容や改変状態に応じてBGMがリアルタイムに変化し、没入感を大幅に向上させる。

**Howler.jsは廃止しない**。効果音（ページめくり、水彩にじみ、チャイム）は引き続きHowler.jsで再生し、BGMのみをLyriaに置き換える。

---

## Lyria RealTime 仕様まとめ

| 項目 | 値 |
|------|------|
| モデルID | `lyria-realtime-exp` |
| ステータス | Experimental |
| SDK | `@google/genai` (`client.live.music.connect()`) |
| 接続方式 | WebSocket（双方向ストリーミング） |
| 出力 | Raw 16-bit PCM, 48kHz, ステレオ |
| レイテンシ | 最大2秒 |
| プロンプト言語 | 英語のみ |
| ボーカル | 不可（楽器のみ） |
| 効果音 | 不可 |

### 制御パラメータ

| パラメータ | 範囲 | 用途 |
|-----------|------|------|
| `guidance` | 0.0 - 6.0 | プロンプト追従の厳密さ |
| `bpm` | 60 - 200 | テンポ |
| `density` | 0.0 - 1.0 | 音の密度（楽器数・音符数） |
| `brightness` | 0.0 - 1.0 | 音色の明るさ |
| `temperature` | - | ランダム性 |
| `mute_bass` | boolean | ベースミュート |
| `mute_drums` | boolean | ドラムミュート |

---

## アーキテクチャ

### 現在のサウンド構成

```
[Howler.js (sound-manager.ts)]
  ├── ページめくり音 (page-turn.mp3)
  ├── 紙のざわめき音 (paper-rustle.mp3)
  ├── 水彩にじみ音 (watercolor-drip.mp3)
  ├── 魔法チャイム音 (magic-chime.mp3)
  └── BGM (静的アンビエントMP3) ← これをLyriaに置換
```

### 変更後のサウンド構成

```
[Howler.js (sound-manager.ts)]         [Lyria RealTime (music-session.ts)]
  ├── ページめくり音 (変更なし)           ├── BGM生成（WebSocket常時接続）
  ├── 紙のざわめき音 (変更なし)           ├── ページごとにプロンプト変更
  ├── 水彩にじみ音 (変更なし)             ├── 改変時にムード変化
  └── 魔法チャイム音 (変更なし)           └── Web Audio APIで再生
                    ↓                                ↓
              [SoundProvider.tsx で統合管理]
                    │
                    ├── マスターボリューム
                    ├── SE/BGM個別ミュート
                    └── ユーザー操作後に再生開始（autoplay policy対応）
```

---

## 新規ファイル

| ファイル | 役割 |
|---------|------|
| `src/lib/gemini/music-session.ts` | Lyria RealTimeセッション管理 |
| `src/hooks/useMusicSession.ts` | React フック（接続・プロンプト更新・音量制御） |
| `src/lib/audio/music-prompts.ts` | ページ・場面ごとのBGMプロンプト定義 |

---

## 変更が必要な既存ファイル

### 1. `src/lib/gemini/music-session.ts`（新規）

```typescript
import { GoogleGenAI } from '@google/genai';

interface MusicSessionConfig {
  apiKey: string;
  initialPrompt: string;
  bpm?: number;
  density?: number;
  brightness?: number;
}

interface MusicSession {
  initialize(config: MusicSessionConfig): Promise<void>;
  updatePrompt(prompt: string): void;
  updateParams(params: { bpm?: number; density?: number; brightness?: number }): void;
  setVolume(volume: number): void;  // 0.0 - 1.0
  mute(): void;
  unmute(): void;
  destroy(): void;
}

// 実装概要:
// 1. client.live.music.connect({ model: 'models/lyria-realtime-exp' }) で接続
// 2. PCMデータをWeb Audio API (AudioWorklet) でリアルタイム再生
// 3. ページ遷移時にプロンプトを動的更新
// 4. 改変発生時にパラメータ（brightness, density等）を変更
```

### 2. `src/hooks/useMusicSession.ts`（新規）

```typescript
interface UseMusicSessionReturn {
  isConnected: boolean;
  isPlaying: boolean;
  currentPrompt: string;
  updateForPage(pageNumber: number, isModified: boolean): void;
  updateForModification(keyword: string): void;
  setVolume(volume: number): void;
  toggleMute(): void;
}
```

### 3. `src/lib/audio/music-prompts.ts`（新規）

各ページの場面に合わせたBGMプロンプトを定義。改変時のムード変更プロンプトも含む。

```typescript
// ページごとのデフォルトBGMプロンプト（英語）
const momotaroMusicPrompts: Record<number, MusicPrompt> = {
  1: {
    prompt: 'gentle Japanese folk lullaby, soft koto and bamboo flute, peaceful countryside morning',
    bpm: 72,
    density: 0.3,
    brightness: 0.5,
  },
  2: {
    prompt: 'mysterious and wonder, flowing water sounds with gentle strings, something magical arriving',
    bpm: 80,
    density: 0.4,
    brightness: 0.6,
  },
  3: {
    prompt: 'joyful celebration, bright and happy melody, new life beginning, gentle percussion',
    bpm: 100,
    density: 0.5,
    brightness: 0.7,
  },
  4: {
    prompt: 'adventurous march, brave and determined, setting out on a journey, building excitement',
    bpm: 110,
    density: 0.5,
    brightness: 0.6,
  },
  5: {
    prompt: 'friendly encounter, warm and playful melody, making new friends, lighthearted',
    bpm: 105,
    density: 0.6,
    brightness: 0.7,
  },
  6: {
    prompt: 'dramatic arrival, tension building, dark and mysterious island, ominous undertone',
    bpm: 90,
    density: 0.6,
    brightness: 0.3,
  },
  7: {
    prompt: 'epic battle, fast and intense, heroic struggle, dramatic percussion and strings',
    bpm: 140,
    density: 0.8,
    brightness: 0.5,
  },
  8: {
    prompt: 'triumphant victory, joyful celebration, happy ending, warm and uplifting melody',
    bpm: 100,
    density: 0.6,
    brightness: 0.8,
  },
};

const akazukinMusicPrompts: Record<number, MusicPrompt> = {
  1: {
    prompt: 'cheerful walk, bright sunny day, skipping through village, gentle woodwind melody',
    bpm: 95,
    density: 0.4,
    brightness: 0.7,
  },
  2: {
    prompt: 'enchanted forest, mysterious but beautiful, birds singing, dappled sunlight through trees',
    bpm: 85,
    density: 0.5,
    brightness: 0.5,
  },
  3: {
    prompt: 'suspicious encounter, slightly tense, cunning character appears, playful but uneasy',
    bpm: 90,
    density: 0.5,
    brightness: 0.4,
  },
  4: {
    prompt: 'carefree exploration, picking flowers, distracted and happy, light and airy melody',
    bpm: 88,
    density: 0.3,
    brightness: 0.7,
  },
  5: {
    prompt: 'sneaky and urgent, villain rushing ahead, dark undercurrent, building suspense',
    bpm: 120,
    density: 0.6,
    brightness: 0.3,
  },
  6: {
    prompt: 'eerie arrival, something is wrong, quiet tension, unsettling calm before storm',
    bpm: 70,
    density: 0.3,
    brightness: 0.2,
  },
  7: {
    prompt: 'shocking revelation, dramatic moment, fear and surprise, intense strings',
    bpm: 130,
    density: 0.7,
    brightness: 0.4,
  },
  8: {
    prompt: 'heroic rescue, relief and joy, happy ending, warm celebration melody',
    bpm: 105,
    density: 0.6,
    brightness: 0.8,
  },
};

// 改変発生時のプロンプト修飾
// keyword から英語のムード修飾子を生成
function getModificationMoodShift(keyword: string): Partial<MusicPrompt> {
  // 例: 「うちゅう」→ { promptSuffix: 'with cosmic synthesizer pads and space ambience', brightness: +0.1 }
  // 例: 「くもの うえ」→ { promptSuffix: 'floating above clouds, ethereal and dreamlike', density: -0.1 }
  // Gemini 2.5 Flash で keyword → 英語BGMムード変換を行う
}
```

### 4. `src/lib/audio/sound-manager.ts`（変更）

**変更内容**: 静的BGM再生部分を削除し、Lyria BGMとの共存ロジックを追加

```diff
- // BGM再生
- playBGM() {
-   this.bgm = new Howl({ src: ['/sounds/ambient-bgm.mp3'], loop: true, volume: 0.3 });
-   this.bgm.play();
- }

+ // BGMはLyria RealTimeが担当。sound-managerはSEのみ管理
+ // マスターボリューム変更時にLyriaセッションにも通知する
```

### 5. `src/components/audio/SoundProvider.tsx`（変更）

**変更内容**: Lyria BGMセッションの初期化・管理を追加

```diff
  // 既存のHowler.js SE管理に加え、Lyria BGMセッションを統合
+ const { isConnected, updateForPage, setVolume: setMusicVolume } = useMusicSession();
+
+ // ページ変更時にBGMプロンプトを更新
+ useEffect(() => {
+   if (isConnected && currentPage) {
+     updateForPage(currentPage, isModified);
+   }
+ }, [currentPage, isModified, isConnected]);
```

### 6. `src/components/audio/SoundToggle.tsx`（変更）

**変更内容**: SE/BGM個別ミュートのUIを追加（オプション）

```diff
  // 既存のミュートボタンに加え、BGMのみミュートも対応
+ // シンプルにするなら、全体ミュートボタン1つでSE+BGM両方をミュート
```

### 7. `src/stores/story-store.ts`（変更）

**追加フィールド**:

```typescript
// BGM状態
isMusicConnected: boolean;
isMusicMuted: boolean;
musicVolume: number;  // 0.0 - 1.0, デフォルト: 0.3

// 追加アクション
setMusicConnected: (connected: boolean) => void;
toggleMusicMute: () => void;
setMusicVolume: (volume: number) => void;
```

### 8. `src/types/index.ts`（変更）

**追加型定義**:

```typescript
interface MusicPrompt {
  prompt: string;         // 英語BGMプロンプト
  bpm: number;            // テンポ
  density: number;        // 音の密度 0.0-1.0
  brightness: number;     // 明るさ 0.0-1.0
}

interface MusicSessionState {
  isConnected: boolean;
  isPlaying: boolean;
  currentPrompt: string;
  volume: number;
  isMuted: boolean;
}
```

### 9. `src/lib/gemini/prompts.ts`（変更）

**追加**: keyword → 英語BGMムード変換プロンプト

```typescript
// 子供のキーワード（日本語）を受け取り、BGMのムード修飾子（英語）を生成するプロンプト
const KEYWORD_TO_MUSIC_MOOD_PROMPT = `
You are a music director for a children's picture book.
Given a Japanese keyword from a child, generate a short English music mood description
that can be appended to a background music prompt.

Input: Japanese keyword
Output: JSON { "moodSuffix": "...", "bpmAdjust": 0, "densityAdjust": 0, "brightnessAdjust": 0 }

Examples:
- "うちゅう" → { "moodSuffix": "cosmic synthesizer pads, space ambience", "bpmAdjust": -10, "densityAdjust": 0.1, "brightnessAdjust": 0.1 }
- "おばけ" → { "moodSuffix": "spooky and playful, ghostly whispers", "bpmAdjust": -20, "densityAdjust": -0.1, "brightnessAdjust": -0.2 }
`;
```

---

## ページライフサイクルへの統合

```
[絵本開始]
    ├── Gemini Live API 接続（音声用、既存）
    └── Lyria RealTime 接続（BGM用、NEW）
         └── 初期プロンプト: P1のBGMプロンプト
    ↓
[ページN表示]
    ├── テキスト文字送り開始
    └── BGMプロンプトをページNに更新（クロスフェード的に変化）
    ↓
[コメントタイム]
    ├── BGM継続（音量やや下げ: 0.3 → 0.15）
    └── 子供の声を聞き取りやすくするため
    ↓
[改変処理開始]
    ├── BGMにサスペンス感を追加（density↑, brightness↓）
    └── ローディング中の期待感演出
    ↓
[改変完了 → ページめくり]
    ├── BGMプロンプトをページN+1（改変版）に更新
    │   └── ベースプロンプト + 改変キーワードのムード修飾
    └── 水彩ディゾルブと同時にBGMも変化（没入感）
    ↓
[P8（最終ページ）]
    └── BGMをハッピーエンディング → フェードアウト
    ↓
[絵本終了]
    ├── Gemini Live API 切断
    └── Lyria RealTime 切断
```

---

## Gemini モデルマップへの追加

| ユースケース | モデル ID | 実行場所 | レイテンシ |
|-------------|----------|---------|-----------|
| BGM生成 (Lyria) | `lyria-realtime-exp` | クライアントWebSocket | < 2秒 |

---

## Phase影響

| Phase | 変更内容 |
|-------|---------|
| Phase 0 | パッケージ追加なし（`@google/genai`に含まれる） |
| Phase 1 | `SoundProvider.tsx` にLyria初期化のプレースホルダー追加。`sound-manager.ts`から静的BGM削除 |
| Phase 3 | `music-session.ts` + `useMusicSession.ts` + `music-prompts.ts` 新規作成。Lyria接続をLive API接続と同タイミングで実行 |
| Phase 4 | 改変発生時にBGMプロンプトを動的更新するロジック追加 |
| Phase 7 | BGM音量バランス調整、フェードイン/アウトのタイミング調整 |

---

## 技術的注意点

### Web Audio API でのPCM再生

Lyria RealTimeはRaw PCMデータを返すため、Web Audio APIのAudioWorkletで再生する必要がある:

```typescript
// AudioWorkletProcessorでPCMデータをリアルタイム再生
class LyriaPlaybackProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    // PCMバッファからデータを読み出してoutputに書き込み
    return true;
  }
}
```

### autoplay policy 対策

ブラウザのautoplay policyにより、ユーザー操作なしに音声再生は不可。
現在のSoundProviderの「ユーザー操作後に再生開始」ロジックをLyriaにも適用:

1. 絵本選択タップ → AudioContext.resume()
2. その後にLyria WebSocket接続 → BGM再生開始

### Experimental モデルのリスクと対策

`lyria-realtime-exp` はExperimentalのため:

- **フォールバック**: 接続失敗時は静的BGM（MP3）にフォールバック
- **public/sounds/fallback-bgm.mp3** を用意（穏やかなアンビエント）
- サーキットブレーカー: 接続エラー3回でセッション全体をフォールバックモードに

```typescript
// music-session.ts
async function initialize(config: MusicSessionConfig) {
  try {
    session = await client.live.music.connect({ model: 'models/lyria-realtime-exp' });
  } catch (error) {
    console.warn('Lyria RealTime unavailable, falling back to static BGM');
    fallbackToStaticBGM();
  }
}
```

### 同時WebSocket接続

ScribbleTaleは以下の2つのWebSocket接続を同時に維持する:

1. **Gemini Live API** (`gemini-2.5-flash-native-audio-preview-12-2025`) — 音声キーワード抽出
2. **Lyria RealTime** (`lyria-realtime-exp`) — BGM生成

両方とも `@google/genai` SDK経由で、同じAPIキーで接続可能。
ブラウザの同時WebSocket制限（通常255）には問題なし。

### 音量バランス

| 音源 | 音量（デフォルト） | 備考 |
|------|------------------|------|
| Lyria BGM | 0.3 | 読み聞かせの邪魔にならない程度 |
| ページめくりSE | 0.5 | 短いので少し大きめ |
| 水彩にじみSE | 0.4 | |
| チャイムSE | 0.6 | 改変成功を明確に伝える |
| コメントタイム中BGM | 0.15 | 音声入力の邪魔にならないよう下げる |

---

## 検証項目（追加）

1. Lyria RealTime接続が絵本開始時に成功するか
2. ページ遷移時にBGMがスムーズに変化するか（途切れない）
3. コメントタイム中にBGM音量が自動で下がるか
4. 改変発生時にBGMのムードが変化するか
5. Lyria接続失敗時に静的BGMにフォールバックするか
6. ミュートボタンでBGM+SE両方がミュートされるか
7. P8終了後にBGMがフェードアウトするか

---

## デモシナリオへの影響

デモでの見せ所:
- P1: 穏やかな和風BGMで始まる
- P2→P3改変時: 「うちゅう」キーワードでBGMがコスミックなシンセパッドに変化
- P5→P6改変時: 「くもの うえ」でBGMが浮遊感のあるエーテリアルなサウンドに
- P7（バトル）: テンポアップ、ドラマチックなBGM
- P8: 勝利のファンファーレ → 温かいエンディング → フェードアウト

**ハッカソンの審査員に対するアピールポイント**: 「物語の改変に合わせてBGMもリアルタイムに変化する」はAI×音楽の革新的なデモになる。
