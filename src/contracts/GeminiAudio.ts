/**
 * @fileoverview Gemini Audio Analysis Contract
 * @purpose Analyze audio files using Gemini AI for songwriting insights
 * @dataFlow AudioFile → Gemini API → AudioAnalysis
 * @boundary Audio data → AI analysis service
 * @requirement Extract musical characteristics to inform song generation
 * @updated 2025-11-14
 *
 * @example
 * const analyzer = new MockGeminiAudioService()
 * const result = await analyzer.analyzeAudio({
 *   audioData: audioBuffer,
 *   analysisType: 'comprehensive',
 *   prompt: "Analyze rhythm and emotion"
 * })
 * if (result.success) {
 *   console.log(result.data.emotions)
 *   console.log(result.data.rhythmPattern)
 *   console.log(result.data.suggestions)
 * }
 */

import type { ServiceResponse } from './types/common'

/**
 * Branded type for Audio Analysis IDs
 */
export type AudioAnalysisId = string & { readonly __brand: 'AudioAnalysisId' }

/**
 * Audio analysis input
 */
export interface AudioAnalysisInput {
  readonly audioData: ArrayBuffer
  readonly fileName: string
  readonly mimeType: AudioMimeType
  readonly analysisType: AnalysisType
  readonly prompt?: string
  readonly existingLyrics?: string
  readonly options?: AnalysisOptions
}

/**
 * Supported audio MIME types
 */
export enum AudioMimeType {
  MP3 = 'audio/mpeg',
  WAV = 'audio/wav',
  OGG = 'audio/ogg',
  M4A = 'audio/mp4',
  FLAC = 'audio/flac'
}

/**
 * Analysis type
 */
export enum AnalysisType {
  COMPREHENSIVE = 'comprehensive',  // All analysis types
  RHYTHM = 'rhythm',                // Focus on rhythm/tempo
  EMOTION = 'emotion',              // Focus on emotional tone
  MELODY = 'melody',                // Focus on melodic content
  STRUCTURE = 'structure',          // Focus on song structure
  VOCAL = 'vocal',                  // Focus on vocal characteristics
  LYRICS_FIT = 'lyrics-fit'         // Check if lyrics match audio
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  readonly maxDuration?: number // Max audio duration to analyze (seconds)
  readonly language?: string
  readonly includeTiming?: boolean
  readonly generateVisual?: boolean
  readonly detailedBreakdown?: boolean
}

/**
 * Audio analysis result
 */
export interface AudioAnalysis {
  readonly id: AudioAnalysisId
  readonly fileName: string
  readonly duration: number // seconds
  readonly analysis: AnalysisData
  readonly suggestions: readonly AudioSuggestion[]
  readonly metadata: AudioMetadata
  readonly analyzedAt: Date
}

/**
 * Comprehensive analysis data
 */
export interface AnalysisData {
  readonly emotions: readonly EmotionAnalysis[]
  readonly rhythmPattern: RhythmPattern
  readonly melody: MelodyAnalysis
  readonly structure: StructureAnalysis
  readonly vocal: VocalAnalysis
  readonly timingIssues?: readonly TimingIssue[]
}

/**
 * Emotion analysis
 */
export interface EmotionAnalysis {
  readonly emotion: string
  readonly intensity: number // 0-1
  readonly confidence: number // 0-1
  readonly timeRanges: readonly TimeRange[]
  readonly keywords: readonly string[]
}

/**
 * Time range in audio
 */
export interface TimeRange {
  readonly start: number // seconds
  readonly end: number // seconds
}

/**
 * Rhythm pattern analysis
 */
export interface RhythmPattern {
  readonly tempo: number // BPM
  readonly timeSignature: string // e.g., "4/4"
  readonly rhythmType: RhythmType
  readonly consistency: number // 0-1
  readonly suggestedStressPattern: string
  readonly breakdown: readonly RhythmSegment[]
}

/**
 * Rhythm type
 */
export enum RhythmType {
  STEADY = 'steady',
  SYNCOPATED = 'syncopated',
  VARIABLE = 'variable',
  DRIVING = 'driving',
  LAID_BACK = 'laid_back',
  COMPLEX = 'complex'
}

/**
 * Rhythm segment (time-based breakdown)
 */
export interface RhythmSegment {
  readonly timeRange: TimeRange
  readonly tempo: number
  readonly description: string
}

/**
 * Melody analysis
 */
export interface MelodyAnalysis {
  readonly key: string // e.g., "C major"
  readonly scale: string
  readonly range: PitchRange
  readonly contour: MelodyContour
  readonly motifs: readonly Motif[]
  readonly hooks: readonly Hook[]
}

/**
 * Pitch range
 */
export interface PitchRange {
  readonly lowest: string // Note name (e.g., "C3")
  readonly highest: string
  readonly range: number // Semitones
}

/**
 * Melody contour
 */
export enum MelodyContour {
  ASCENDING = 'ascending',
  DESCENDING = 'descending',
  ARCH = 'arch', // Up then down
  WAVE = 'wave', // Up and down repeatedly
  STATIC = 'static',
  COMPLEX = 'complex'
}

/**
 * Musical motif
 */
export interface Motif {
  readonly description: string
  readonly occurrences: readonly TimeRange[]
  readonly importance: number // 0-1
}

/**
 * Hook (memorable melodic phrase)
 */
export interface Hook {
  readonly timeRange: TimeRange
  readonly description: string
  readonly catchiness: number // 0-1
  readonly suggestionForLyrics: string
}

/**
 * Structure analysis
 */
export interface StructureAnalysis {
  readonly sections: readonly AudioSection[]
  readonly totalSections: number
  readonly suggestedLyricStructure: string
  readonly repeatingElements: readonly RepeatingElement[]
}

/**
 * Audio section
 */
export interface AudioSection {
  readonly type: AudioSectionType
  readonly timeRange: TimeRange
  readonly characteristics: string
  readonly energyLevel: number // 0-1
}

/**
 * Audio section type (detected from audio)
 */
export enum AudioSectionType {
  INTRO = 'intro',
  VERSE = 'verse',
  CHORUS = 'chorus',
  BRIDGE = 'bridge',
  OUTRO = 'outro',
  INSTRUMENTAL = 'instrumental',
  BREAKDOWN = 'breakdown',
  BUILD_UP = 'build-up',
  DROP = 'drop'
}

/**
 * Repeating element
 */
export interface RepeatingElement {
  readonly type: string
  readonly occurrences: readonly TimeRange[]
  readonly pattern: string
}

/**
 * Vocal analysis
 */
export interface VocalAnalysis {
  readonly hasVocals: boolean
  readonly vocalStyle?: VocalStyleAnalysis
  readonly vocalEffects?: readonly VocalEffect[]
  readonly delivery?: DeliveryStyle
  readonly suggestedLyricStyle?: string
}

/**
 * Vocal style analysis
 */
export interface VocalStyleAnalysis {
  readonly tone: string // raspy, smooth, powerful, etc.
  readonly range: PitchRange
  readonly techniques: readonly string[]
  readonly characterization: string
}

/**
 * Vocal effect
 */
export enum VocalEffect {
  AUTOTUNE = 'autotune',
  REVERB = 'reverb',
  DELAY = 'delay',
  DISTORTION = 'distortion',
  HARMONY = 'harmony',
  VOCODER = 'vocoder',
  PITCH_SHIFT = 'pitch_shift'
}

/**
 * Delivery style
 */
export enum DeliveryStyle {
  AGGRESSIVE = 'aggressive',
  GENTLE = 'gentle',
  MELODIC = 'melodic',
  SPOKEN = 'spoken',
  RAP = 'rap',
  SUNG = 'sung',
  WHISPERED = 'whispered',
  SHOUTED = 'shouted'
}

/**
 * Timing issue (lyrics vs audio)
 */
export interface TimingIssue {
  readonly timeRange: TimeRange
  readonly lyricSection: string
  readonly issue: string
  readonly suggestion: string
  readonly severity: 'critical' | 'major' | 'minor'
}

/**
 * Audio suggestion for songwriting
 */
export interface AudioSuggestion {
  readonly type: SuggestionType
  readonly priority: number // 0-1
  readonly suggestion: string
  readonly rationale: string
  readonly examples?: readonly string[]
}

/**
 * Suggestion type
 */
export enum SuggestionType {
  IMAGERY = 'imagery',
  THEME = 'theme',
  MOOD = 'mood',
  RHYTHM_MATCH = 'rhythm_match',
  VOCAL_DELIVERY = 'vocal_delivery',
  STRUCTURE = 'structure',
  ENERGY_LEVEL = 'energy_level',
  LYRIC_STYLE = 'lyric_style'
}

/**
 * Audio metadata
 */
export interface AudioMetadata {
  readonly duration: number
  readonly fileSize: number
  readonly bitrate?: number
  readonly sampleRate?: number
  readonly channels?: number
  readonly format: AudioMimeType
}

/**
 * Lyrics fit check (how well lyrics match audio)
 */
export interface LyricsFitCheck {
  readonly overallFit: number // 0-1
  readonly rhythmMatch: number
  readonly emotionMatch: number
  readonly syllableMatch: number
  readonly stressMatch: number
  readonly issues: readonly TimingIssue[]
  readonly recommendations: readonly string[]
}

/**
 * Pre-analysis prompts
 */
export const ANALYSIS_PROMPTS = {
  EMOTION: "What is the predominant emotion conveyed in this recording? Provide detailed emotional analysis with intensity levels and time ranges.",
  RHYTHM: "Identify the rhythm pattern, tempo, and time signature. Suggest lyrical stress patterns that would match this rhythm.",
  VOCAL_STYLE: "What vocal delivery style would best complement this instrumental? Analyze tone, range, and suggested techniques.",
  TIMING: "Are there any timing issues between the provided lyrics and the melody? Identify specific problem areas.",
  THEME: "What imagery or themes would enhance the mood of this track? Provide specific suggestions.",
  STRUCTURE: "Analyze the song structure and suggest how lyrics should be organized to match the musical sections.",
  COMPREHENSIVE: "Provide a comprehensive analysis of this audio including rhythm, emotion, melody, structure, and songwriting suggestions."
} as const

/**
 * Error codes for Gemini audio service
 */
export enum GeminiAudioErrorCode {
  INVALID_AUDIO_FILE = 'INVALID_AUDIO_FILE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_TOO_SHORT = 'FILE_TOO_SHORT',
  AUDIO_QUALITY_POOR = 'AUDIO_QUALITY_POOR',
  API_ERROR = 'API_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  INVALID_PROMPT = 'INVALID_PROMPT'
}

/**
 * Gemini Audio Service Interface
 *
 * This is the contract that both mock and real implementations must follow.
 * DO NOT modify this interface once implementation starts (create v2 instead).
 */
export interface IGeminiAudioService {
  /**
   * Analyze audio file for songwriting insights
   *
   * @param input - Audio analysis input
   * @returns Promise with audio analysis or error
   * @throws Never throws - always returns ServiceResponse
   */
  analyzeAudio(
    input: AudioAnalysisInput
  ): Promise<ServiceResponse<AudioAnalysis>>

  /**
   * Extract melody information from audio
   *
   * @param audioData - Audio file buffer
   * @param fileName - Name of audio file
   * @returns Promise with melody analysis or error
   * @throws Never throws - always returns ServiceResponse
   */
  extractMelody(
    audioData: ArrayBuffer,
    fileName: string
  ): Promise<ServiceResponse<MelodyAnalysis>>

  /**
   * Identify rhythm pattern and tempo
   *
   * @param audioData - Audio file buffer
   * @param fileName - Name of audio file
   * @returns Promise with rhythm pattern or error
   * @throws Never throws - always returns ServiceResponse
   */
  identifyRhythmPattern(
    audioData: ArrayBuffer,
    fileName: string
  ): Promise<ServiceResponse<RhythmPattern>>

  /**
   * Detect emotional tone in audio
   *
   * @param audioData - Audio file buffer
   * @param fileName - Name of audio file
   * @returns Promise with emotion analysis or error
   * @throws Never throws - always returns ServiceResponse
   */
  detectEmotionalTone(
    audioData: ArrayBuffer,
    fileName: string
  ): Promise<ServiceResponse<readonly EmotionAnalysis[]>>

  /**
   * Check if lyrics fit audio timing
   *
   * @param audioData - Audio file buffer
   * @param lyrics - Lyrics text to check
   * @param fileName - Name of audio file
   * @returns Promise with fit check result or error
   * @throws Never throws - always returns ServiceResponse
   */
  checkLyricsFit(
    audioData: ArrayBuffer,
    lyrics: string,
    fileName: string
  ): Promise<ServiceResponse<LyricsFitCheck>>

  /**
   * Get songwriting suggestions based on audio
   *
   * @param analysis - Audio analysis to generate suggestions from
   * @returns Promise with suggestions or error
   * @throws Never throws - always returns ServiceResponse
   */
  suggestLyricImprovements(
    analysis: AudioAnalysis
  ): Promise<ServiceResponse<readonly AudioSuggestion[]>>

  /**
   * Analyze specific time range in audio
   *
   * @param audioData - Audio file buffer
   * @param timeRange - Time range to analyze
   * @param analysisType - Type of analysis
   * @param fileName - Name of audio file
   * @returns Promise with analysis or error
   * @throws Never throws - always returns ServiceResponse
   */
  analyzeTimeRange(
    audioData: ArrayBuffer,
    timeRange: TimeRange,
    analysisType: AnalysisType,
    fileName: string
  ): Promise<ServiceResponse<AnalysisData>>

  /**
   * Validate audio file before analysis
   *
   * @param audioData - Audio file buffer
   * @param fileName - Name of audio file
   * @returns Promise with validation result
   * @throws Never throws - always returns ServiceResponse
   */
  validateAudioFile(
    audioData: ArrayBuffer,
    fileName: string
  ): Promise<ServiceResponse<AudioValidation>>
}

/**
 * Audio validation result
 */
export interface AudioValidation {
  readonly valid: boolean
  readonly format: AudioMimeType
  readonly duration: number
  readonly fileSize: number
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
}

/**
 * Helper to create Audio Analysis ID
 */
export function createAudioAnalysisId(): AudioAnalysisId {
  return `audio_${Date.now()}_${Math.random().toString(36).substring(7)}` as AudioAnalysisId
}

/**
 * Helper to check if file size is within limits
 */
export function isValidFileSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
  return size > 0 && size <= maxSize
}

/**
 * Helper to check if duration is valid
 */
export function isValidDuration(duration: number, minDuration: number = 10, maxDuration: number = 600): boolean {
  return duration >= minDuration && duration <= maxDuration
}

/**
 * Helper to format time range
 */
export function formatTimeRange(range: TimeRange): string {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  return `${formatTime(range.start)} - ${formatTime(range.end)}`
}

/**
 * Helper to get file extension from MIME type
 */
export function getAudioExtension(mimeType: AudioMimeType): string {
  switch (mimeType) {
    case AudioMimeType.MP3:
      return '.mp3'
    case AudioMimeType.WAV:
      return '.wav'
    case AudioMimeType.OGG:
      return '.ogg'
    case AudioMimeType.M4A:
      return '.m4a'
    case AudioMimeType.FLAC:
      return '.flac'
  }
}
