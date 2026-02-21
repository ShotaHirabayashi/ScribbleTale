// ── 既存型（後方互換維持） ──

export interface StoryPage {
  id: number
  illustration: string
  text: string
  alt: string
  /** ページ番号 (1-12) */
  pageNumber?: number
  /** ページの物語上の役割 (固定20%) */
  pageRole?: string
  /** 固定要素（ページの役割を構成する最小骨格） */
  fixedElements?: string[]
  /** 自由要素（子どもが変えられるもの） */
  freeElements?: string[]
  /** 原文テキスト */
  originalText?: string
  /** 現在のテキスト（改変後） */
  currentText?: string
  /** 改変済みかどうか */
  isModified?: boolean
  /** 改変回数カウンター */
  modificationCount?: number
  /** 前のページの改変を反映して再生成が必要か */
  needsContextRegeneration?: boolean
  /** テキストアニメーション完了済み（既読） */
  textRevealed?: boolean
}

export interface Story {
  id: string
  title: string
  coverImage: string
  pages: StoryPage[]
}

export type FrameStyle = "stars" | "flowers" | "ribbon" | "simple"

export interface SavedBook {
  id: string
  storyId: string
  title: string
  authorName: string
  coverImage: string
  bgColor: string
  frameStyle: FrameStyle
  createdAt: string
}

// ── 新規型（Phase 0〜） ──

/** ページのライフサイクルフェーズ */
export type PagePhase = 'reading' | 'readingComplete' | 'commentTime' | 'drawing' | 'modifying' | 'modified' | 'transitioning'

/** 改変処理のフェーズ */
export type ModificationPhase = 'idle' | 'orchestrating' | 'generating_image' | 'complete'

/** コメントタイム終了理由 */
export type CommentTimeEndReason =
  | 'keyword_detected'
  | 'silence_timeout'
  | 'manual_skip'
  | 'max_time_reached'
  | 'end_keyword'

/** キーワード抽出結果 */
export interface ExtractionResult {
  keyword: string
  childUtterance: string
  trigger: 'voice' | 'drawing'
  timestamp: number
}

/** コメントタイム設定 */
export interface CommentTimeConfig {
  /** 最大継続時間（デフォルト: 30000ms） */
  maxDurationMs: number
  /** 無音タイムアウト（デフォルト: 5000ms） */
  silenceTimeoutMs: number
  /** カメラ入力の有効化（デフォルト: true） */
  enableCamera: boolean
}

/** キャラクターエージェント定義 */
export interface CharacterAgent {
  id: string
  name: string
  personality: string
  behaviorPatterns: string[]
  reactionStyle: string
  appearsInPages: number[]
  relationships: Record<string, string>
}

/** キャラクターの反応 */
export interface CharacterReaction {
  characterId: string
  reaction: string
  emotionalState: 'excited' | 'surprised' | 'worried' | 'happy' | 'angry' | 'sad'
  narrativeImpact: string
}

/** オーケストレーター結果 */
export interface OrchestratorResult {
  approved: boolean
  modifiedText: string
  characterReactions: CharacterReaction[]
  imagePromptAdditions: string
}

/** 改変履歴 */
export interface Modification {
  timestamp: number
  pageNumber: number
  targetPageNumber: number
  trigger: 'voice' | 'drawing'
  input: string
  beforeText: string
  afterText: string
}

/** ストーリーセッション */
export interface StorySession {
  id: string
  bookId: 'momotaro' | 'akazukin'
  pages: StoryPage[]
  modifications: Modification[]
  shareToken: string | null
  isShared: boolean
  createdAt: number
  updatedAt: number
}

/** 共有トークンデータ */
export interface ShareTokenData {
  storyId: string
  shareToken: string
  createdAt: number
}
