/**
 * @fileoverview Core Song Data Types
 * @purpose Define fundamental song structure used across all seams
 * @dataFlow Foundation for song generation, critique, revision, and formatting
 * @boundary Core domain model
 * @requirement Represent song structure with prosodic and lyrical detail
 * @updated 2025-11-14
 */

/**
 * Branded type for Song IDs (prevents mixing with other ID types)
 */
export type SongId = string & { readonly __brand: 'SongId' }

/**
 * Branded type for Verse IDs
 */
export type VerseId = string & { readonly __brand: 'VerseId' }

/**
 * Branded type for Chorus IDs
 */
export type ChorusId = string & { readonly __brand: 'ChorusId' }

/**
 * Branded type for Bridge IDs
 */
export type BridgeId = string & { readonly __brand: 'BridgeId' }

/**
 * Branded type for Section IDs (generic)
 */
export type SectionId = string & { readonly __brand: 'SectionId' }

/**
 * Complete song structure
 */
export interface Song {
  readonly id: SongId
  readonly title: string
  readonly verses: readonly Verse[]
  readonly choruses: readonly Chorus[]
  readonly bridge?: Bridge
  readonly intro?: Section
  readonly outro?: Section
  readonly metadata: SongMetadata
  readonly generatedAt: Date
  readonly lastModified?: Date
}

/**
 * Song metadata
 */
export interface SongMetadata {
  readonly genre?: string
  readonly mood?: string
  readonly theme?: string
  readonly targetAudience?: string
  readonly referenceArtist?: string
  readonly generationPrompt?: string
  readonly version?: number
  readonly author?: string
  readonly tags?: readonly string[]
}

/**
 * Verse section
 */
export interface Verse {
  readonly id: VerseId
  readonly number: number
  readonly lines: readonly Line[]
  readonly rhymeScheme: RhymeScheme
  readonly syllablePattern: readonly number[]
  readonly mood?: string
  readonly narrative?: string
}

/**
 * Chorus section
 */
export interface Chorus {
  readonly id: ChorusId
  readonly lines: readonly Line[]
  readonly rhymeScheme: RhymeScheme
  readonly syllablePattern: readonly number[]
  readonly hook?: string
  readonly isMainChorus: boolean
}

/**
 * Bridge section
 */
export interface Bridge {
  readonly id: BridgeId
  readonly lines: readonly Line[]
  readonly rhymeScheme: RhymeScheme
  readonly syllablePattern: readonly number[]
  readonly purpose?: string
}

/**
 * Generic section (intro, outro, pre-chorus, etc.)
 */
export interface Section {
  readonly id: SectionId
  readonly type: SectionType
  readonly lines: readonly Line[]
  readonly rhymeScheme?: RhymeScheme
  readonly syllablePattern?: readonly number[]
}

/**
 * Section type enum
 */
export enum SectionType {
  INTRO = 'intro',
  VERSE = 'verse',
  CHORUS = 'chorus',
  PRE_CHORUS = 'pre-chorus',
  BRIDGE = 'bridge',
  OUTRO = 'outro',
  INSTRUMENTAL = 'instrumental',
  DROP = 'drop',
  BREAK = 'break'
}

/**
 * Individual lyric line with prosodic analysis
 */
export interface Line {
  readonly text: string
  readonly syllables: number
  readonly stressPattern: StressPattern
  readonly rhymeSound?: RhymeSound
  readonly internalRhymes?: readonly RhymeSound[]
  readonly lineNumber?: number
}

/**
 * Stress pattern (x for unstressed, / for stressed)
 * Example: "x/x/x/x/" for iambic tetrameter
 */
export type StressPattern = string

/**
 * Rhyme sound (phonetic ending)
 * Example: "AY" for words ending in /eɪ/ sound (day, way, say)
 */
export type RhymeSound = string

/**
 * Rhyme scheme pattern
 * Example: "ABAB", "AABB", "ABCABC"
 */
export type RhymeScheme = string

/**
 * Supported rhyme scheme patterns
 */
export const COMMON_RHYME_SCHEMES = {
  ABAB: 'ABAB',
  AABB: 'AABB',
  ABCABC: 'ABCABC',
  AAAA: 'AAAA',
  ABBA: 'ABBA',
  ABABCC: 'ABABCC',
  AAABBB: 'AAABBB',
  FREE: 'FREE'
} as const

/**
 * Meter types
 */
export enum MeterType {
  IAMBIC = 'iambic',           // x/
  TROCHAIC = 'trochaic',       // /x
  ANAPESTIC = 'anapestic',     // xx/
  DACTYLIC = 'dactylic',       // /xx
  SPONDAIC = 'spondaic',       // //
  PYRRHIC = 'pyrrhic',         // xx
  FREE = 'free'
}

/**
 * Style configuration for song generation
 */
export interface StyleConfig {
  readonly genre?: string
  readonly mood?: string
  readonly tempo?: TempoType
  readonly vocalStyle?: VocalStyle
  readonly harmony?: HarmonyType
  readonly effects?: readonly EffectType[]
}

/**
 * Tempo types
 */
export enum TempoType {
  SLOW = 'slow',
  MID = 'mid',
  FAST = 'fast',
  VARIABLE = 'variable'
}

/**
 * Vocal style types
 */
export enum VocalStyle {
  RASPY = 'raspy',
  SMOOTH = 'smooth',
  BREATHY = 'breathy',
  POWERFUL = 'powerful',
  GENTLE = 'gentle',
  AGGRESSIVE = 'aggressive',
  MELODIC = 'melodic'
}

/**
 * Harmony types
 */
export enum HarmonyType {
  NONE = 'none',
  TWO_PART = '2-part',
  THREE_PART = '3-part',
  GOSPEL = 'gospel',
  BACKING = 'backing'
}

/**
 * Effect types
 */
export enum EffectType {
  AUTOTUNE = 'autotune',
  VOCODER = 'vocoder',
  REVERB = 'reverb',
  DELAY = 'delay',
  DISTORTION = 'distortion',
  WHISPER = 'whisper'
}

/**
 * Song structure constraints
 */
export interface StructureConstraints {
  readonly verseCount?: number
  readonly linesPerVerse?: number
  readonly chorusCount?: number
  readonly linesPerChorus?: number
  readonly includeBridge?: boolean
  readonly includeIntro?: boolean
  readonly includeOutro?: boolean
  readonly rhymeScheme?: RhymeScheme
  readonly targetLength?: number // Total line count
  readonly minSyllablesPerLine?: number
  readonly maxSyllablesPerLine?: number
}

/**
 * Helper function to create Song ID
 */
export function createSongId(id: string): SongId {
  return id as SongId
}

/**
 * Helper function to create Verse ID
 */
export function createVerseId(id: string): VerseId {
  return id as VerseId
}

/**
 * Helper function to create Chorus ID
 */
export function createChorusId(id: string): ChorusId {
  return id as ChorusId
}

/**
 * Helper function to create Bridge ID
 */
export function createBridgeId(id: string): BridgeId {
  return id as BridgeId
}

/**
 * Helper function to create Section ID
 */
export function createSectionId(id: string): SectionId {
  return id as SectionId
}

/**
 * Type guard for Verse
 */
export function isVerse(section: Verse | Chorus | Bridge | Section): section is Verse {
  return 'number' in section && typeof section.number === 'number'
}

/**
 * Type guard for Chorus
 */
export function isChorus(section: Verse | Chorus | Bridge | Section): section is Chorus {
  return 'isMainChorus' in section
}

/**
 * Type guard for Bridge
 */
export function isBridge(section: Verse | Chorus | Bridge | Section): section is Bridge {
  return 'purpose' in section
}
