/**
 * @fileoverview Mock Implementation of Audio Analysis Service
 * @purpose Provide realistic mock for UI development and testing
 * @phase Phase 3 - BUILD (TDD)
 * @updated 2025-11-15
 *
 * This mock implementation:
 * - Returns realistic data that matches the contract exactly
 * - Handles all error cases defined in the contract
 * - Never throws exceptions - always returns ServiceResponse
 * - Uses readonly properties correctly (build values BEFORE creating objects)
 * - Passes all tests in AudioAnalysis.test.ts
 */

import type {
  IGeminiAudioService,
  AudioAnalysisInput,
  AudioAnalysis,
  MelodyAnalysis,
  RhythmPattern,
  EmotionAnalysis,
  LyricsFitCheck,
  AudioSuggestion,
  AnalysisData,
  AudioValidation,
  TimeRange,
  AudioMetadata,
  StructureAnalysis,
  VocalAnalysis,
  AudioSection,
  RepeatingElement,
  VocalStyleAnalysis,
  PitchRange,
  Motif,
  Hook,
  RhythmSegment,
  TimingIssue
} from '../../contracts/GeminiAudio'
import {
  AudioMimeType,
  AnalysisType,
  GeminiAudioErrorCode,
  RhythmType,
  MelodyContour,
  AudioSectionType,
  VocalEffect,
  DeliveryStyle,
  SuggestionType,
  createAudioAnalysisId,
  isValidFileSize,
  isValidDuration
} from '../../contracts/GeminiAudio'
import {
  createSuccess,
  createFailure,
  createError,
  type ServiceResponse
} from '../../contracts/types/common'

/**
 * Mock implementation of Audio Analysis Service
 *
 * Analyzes audio files for songwriting insights using simulated AI analysis.
 * Returns realistic heuristic data based on audio characteristics.
 */
export class MockAudioAnalysisService implements IGeminiAudioService {
  // Constants for validation
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
  private readonly MIN_DURATION = 10 // seconds
  private readonly MAX_DURATION = 600 // seconds

  /**
   * Analyze audio file for songwriting insights
   */
  async analyzeAudio(
    input: AudioAnalysisInput
  ): Promise<ServiceResponse<AudioAnalysis>> {
    // Validate audio data
    const validation = await this.validateAudioFile(input.audioData, input.fileName)

    if (!validation.success) {
      return validation as ServiceResponse<AudioAnalysis>
    }

    if (!validation.data.valid) {
      // Convert validation errors to specific error codes
      const errorMessage = validation.data.errors.join('; ')

      // Determine specific error code based on validation errors
      let errorCode = GeminiAudioErrorCode.INVALID_AUDIO_FILE
      let suggestion = 'Please provide a valid audio file'

      // Priority: empty > too large > unsupported format > too short
      if (errorMessage.includes('is empty')) {
        errorCode = GeminiAudioErrorCode.INVALID_AUDIO_FILE
        suggestion = 'Please provide a valid audio file'
      } else if (errorMessage.includes('exceeds maximum')) {
        errorCode = GeminiAudioErrorCode.FILE_TOO_LARGE
        suggestion = 'Please provide a smaller audio file (max 10MB)'
      } else if (errorMessage.includes('Unsupported audio format')) {
        errorCode = GeminiAudioErrorCode.UNSUPPORTED_FORMAT
        suggestion = 'Please provide a supported audio format (MP3, WAV, FLAC, OGG, M4A)'
      } else if (errorMessage.includes('too short')) {
        errorCode = GeminiAudioErrorCode.FILE_TOO_SHORT
        suggestion = 'Please provide an audio file at least 10 seconds long'
      }

      return createFailure(
        createError(
          errorCode,
          errorMessage,
          suggestion
        )
      )
    }

    // Check for empty prompt
    if (input.prompt !== undefined && input.prompt.trim().length === 0) {
      return createFailure(
        createError(
          GeminiAudioErrorCode.INVALID_PROMPT,
          'Prompt cannot be empty',
          'Please provide a non-empty prompt or omit the prompt parameter'
        )
      )
    }

    // Get metadata from validation
    const metadata: AudioMetadata = {
      duration: validation.data.duration,
      fileSize: validation.data.fileSize,
      bitrate: 320000, // Mock bitrate
      sampleRate: 44100, // Mock sample rate
      channels: 2, // Stereo
      format: validation.data.format
    }

    // Generate analysis based on analysis type
    const analysisData = this.generateAnalysisData(input.analysisType, metadata.duration)

    // Generate suggestions
    const suggestions = this.generateSuggestions(analysisData)

    // Build result
    const analysis: AudioAnalysis = Object.freeze({
      id: createAudioAnalysisId(),
      fileName: input.fileName,
      duration: metadata.duration,
      analysis: analysisData,
      suggestions: Object.freeze(suggestions),
      metadata: Object.freeze(metadata),
      analyzedAt: new Date()
    })

    return createSuccess(analysis)
  }

  /**
   * Extract melody information from audio
   */
  async extractMelody(
    audioData: ArrayBuffer,
    fileName: string
  ): Promise<ServiceResponse<MelodyAnalysis>> {
    // Validate audio file
    const validation = await this.validateAudioFile(audioData, fileName)

    if (!validation.success) {
      return validation as ServiceResponse<MelodyAnalysis>
    }

    if (!validation.data.valid) {
      const errorMessage = validation.data.errors.join('; ')

      // Determine specific error code
      let errorCode = GeminiAudioErrorCode.INVALID_AUDIO_FILE
      let suggestion = 'Please provide a valid audio file'

      // Priority: empty > too large > unsupported format > too short
      if (errorMessage.includes('is empty')) {
        errorCode = GeminiAudioErrorCode.INVALID_AUDIO_FILE
        suggestion = 'Please provide a valid audio file'
      } else if (errorMessage.includes('exceeds maximum')) {
        errorCode = GeminiAudioErrorCode.FILE_TOO_LARGE
        suggestion = 'Please provide a smaller audio file (max 10MB)'
      } else if (errorMessage.includes('Unsupported audio format')) {
        errorCode = GeminiAudioErrorCode.UNSUPPORTED_FORMAT
        suggestion = 'Please provide a supported audio format (MP3, WAV, FLAC, OGG, M4A)'
      } else if (errorMessage.includes('too short')) {
        errorCode = GeminiAudioErrorCode.FILE_TOO_SHORT
        suggestion = 'Please provide an audio file at least 10 seconds long'
      }

      return createFailure(
        createError(
          errorCode,
          errorMessage,
          suggestion
        )
      )
    }

    // Generate melody analysis
    const melody = this.generateMelodyAnalysis()

    return createSuccess(melody)
  }

  /**
   * Identify rhythm pattern and tempo
   */
  async identifyRhythmPattern(
    audioData: ArrayBuffer,
    fileName: string
  ): Promise<ServiceResponse<RhythmPattern>> {
    // Validate audio file
    const validation = await this.validateAudioFile(audioData, fileName)

    if (!validation.success) {
      return validation as ServiceResponse<RhythmPattern>
    }

    if (!validation.data.valid) {
      return createFailure(
        createError(
          GeminiAudioErrorCode.INVALID_AUDIO_FILE,
          validation.data.errors.join('; '),
          'Please provide a valid audio file'
        )
      )
    }

    // Generate rhythm pattern
    const rhythm = this.generateRhythmPattern(validation.data.duration)

    return createSuccess(rhythm)
  }

  /**
   * Detect emotional tone in audio
   */
  async detectEmotionalTone(
    audioData: ArrayBuffer,
    fileName: string
  ): Promise<ServiceResponse<readonly EmotionAnalysis[]>> {
    // Validate audio file
    const validation = await this.validateAudioFile(audioData, fileName)

    if (!validation.success) {
      return validation as ServiceResponse<readonly EmotionAnalysis[]>
    }

    if (!validation.data.valid) {
      return createFailure(
        createError(
          GeminiAudioErrorCode.INVALID_AUDIO_FILE,
          validation.data.errors.join('; '),
          'Please provide a valid audio file'
        )
      )
    }

    // Generate emotion analysis
    const emotions = this.generateEmotionAnalysis(validation.data.duration)

    return createSuccess(Object.freeze(emotions))
  }

  /**
   * Check if lyrics fit audio timing
   */
  async checkLyricsFit(
    audioData: ArrayBuffer,
    lyrics: string,
    fileName: string
  ): Promise<ServiceResponse<LyricsFitCheck>> {
    // Validate lyrics
    if (!lyrics || lyrics.trim().length === 0) {
      return createFailure(
        createError(
          GeminiAudioErrorCode.INVALID_PROMPT,
          'Lyrics cannot be empty',
          'Please provide lyrics to check against the audio'
        )
      )
    }

    // Validate audio file
    const validation = await this.validateAudioFile(audioData, fileName)

    if (!validation.success) {
      return validation as ServiceResponse<LyricsFitCheck>
    }

    if (!validation.data.valid) {
      return createFailure(
        createError(
          GeminiAudioErrorCode.INVALID_AUDIO_FILE,
          validation.data.errors.join('; '),
          'Please provide a valid audio file'
        )
      )
    }

    // Generate fit check
    const fitCheck = this.generateLyricsFitCheck(lyrics, validation.data.duration)

    return createSuccess(fitCheck)
  }

  /**
   * Get songwriting suggestions based on audio
   */
  async suggestLyricImprovements(
    analysis: AudioAnalysis
  ): Promise<ServiceResponse<readonly AudioSuggestion[]>> {
    // Generate suggestions from analysis
    const suggestions = this.generateSuggestions(analysis.analysis)

    return createSuccess(Object.freeze(suggestions))
  }

  /**
   * Analyze specific time range in audio
   */
  async analyzeTimeRange(
    audioData: ArrayBuffer,
    timeRange: TimeRange,
    analysisType: AnalysisType,
    fileName: string
  ): Promise<ServiceResponse<AnalysisData>> {
    // Validate time range
    if (timeRange.start < 0 || timeRange.end <= timeRange.start) {
      return createFailure(
        createError(
          GeminiAudioErrorCode.ANALYSIS_FAILED,
          'Invalid time range',
          'End time must be greater than start time, and both must be non-negative'
        )
      )
    }

    // Validate audio file
    const validation = await this.validateAudioFile(audioData, fileName)

    if (!validation.success) {
      return validation as ServiceResponse<AnalysisData>
    }

    if (!validation.data.valid) {
      return createFailure(
        createError(
          GeminiAudioErrorCode.INVALID_AUDIO_FILE,
          validation.data.errors.join('; '),
          'Please provide a valid audio file'
        )
      )
    }

    // Generate analysis for the time range
    const duration = timeRange.end - timeRange.start
    const analysisData = this.generateAnalysisData(analysisType, duration)

    return createSuccess(analysisData)
  }

  /**
   * Validate audio file before analysis
   */
  async validateAudioFile(
    audioData: ArrayBuffer,
    fileName: string
  ): Promise<ServiceResponse<AudioValidation>> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check file size
    const fileSize = audioData.byteLength

    if (fileSize === 0) {
      errors.push('Audio file is empty')
    } else if (!isValidFileSize(fileSize, this.MAX_FILE_SIZE)) {
      errors.push(`File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds maximum allowed (${this.MAX_FILE_SIZE / 1024 / 1024}MB)`)
    } else if (fileSize < 50 * 1024) {
      warnings.push('Audio file is very small and may not contain enough data for accurate analysis')
    }

    // Detect format from filename
    const format = this.detectAudioFormat(fileName)

    if (!format) {
      errors.push('Unsupported audio format')
    }

    // Simulate duration detection (mock based on file size)
    const estimatedDuration = this.estimateDuration(fileSize, format || AudioMimeType.MP3)

    if (!isValidDuration(estimatedDuration, this.MIN_DURATION, this.MAX_DURATION)) {
      if (estimatedDuration < this.MIN_DURATION) {
        errors.push(`Audio duration (${estimatedDuration}s) is too short (minimum ${this.MIN_DURATION}s)`)
      } else {
        errors.push(`Audio duration (${estimatedDuration}s) is too long (maximum ${this.MAX_DURATION}s)`)
      }
    }

    // Check audio quality (mock)
    if (fileSize > 0 && fileSize < 100 * 1024 && estimatedDuration > 30) {
      warnings.push('Audio quality may be too low for accurate analysis')
    }

    // Build validation result
    const validation: AudioValidation = Object.freeze({
      valid: errors.length === 0,
      format: format || AudioMimeType.MP3,
      duration: estimatedDuration,
      fileSize,
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings)
    })

    return createSuccess(validation)
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Detect audio format from filename
   */
  private detectAudioFormat(fileName: string): AudioMimeType | null {
    const extension = fileName.toLowerCase().split('.').pop()

    switch (extension) {
      case 'mp3':
        return AudioMimeType.MP3
      case 'wav':
        return AudioMimeType.WAV
      case 'ogg':
        return AudioMimeType.OGG
      case 'm4a':
        return AudioMimeType.M4A
      case 'flac':
        return AudioMimeType.FLAC
      default:
        return null
    }
  }

  /**
   * Estimate duration from file size (mock algorithm)
   */
  private estimateDuration(fileSize: number, format: AudioMimeType): number {
    // Rough estimates based on typical bitrates
    let bytesPerSecond: number

    switch (format) {
      case AudioMimeType.MP3:
        bytesPerSecond = 128000 / 8 // 128 kbps
        break
      case AudioMimeType.WAV:
        bytesPerSecond = 1411000 / 8 // 1411 kbps (CD quality)
        break
      case AudioMimeType.FLAC:
        bytesPerSecond = 900000 / 8 // ~900 kbps (compressed lossless)
        break
      case AudioMimeType.OGG:
        bytesPerSecond = 160000 / 8 // 160 kbps
        break
      case AudioMimeType.M4A:
        bytesPerSecond = 256000 / 8 // 256 kbps
        break
      default:
        bytesPerSecond = 128000 / 8
    }

    const calculatedDuration = Math.round(fileSize / bytesPerSecond)

    // For mock purposes, ensure files > 100KB get at least 30 seconds
    // This makes testing easier while still being realistic
    if (fileSize > 100 * 1024 && calculatedDuration < 30) {
      return 30
    }

    return calculatedDuration
  }

  /**
   * Generate complete analysis data
   */
  private generateAnalysisData(_analysisType: AnalysisType, duration: number): AnalysisData {
    const emotions = this.generateEmotionAnalysis(duration)
    const rhythmPattern = this.generateRhythmPattern(duration)
    const melody = this.generateMelodyAnalysis()
    const structure = this.generateStructureAnalysis(duration)
    const vocal = this.generateVocalAnalysis()

    const data: AnalysisData = Object.freeze({
      emotions: Object.freeze(emotions),
      rhythmPattern: Object.freeze(rhythmPattern),
      melody: Object.freeze(melody),
      structure: Object.freeze(structure),
      vocal: Object.freeze(vocal)
    })

    return data
  }

  /**
   * Generate emotion analysis
   */
  private generateEmotionAnalysis(duration: number): EmotionAnalysis[] {
    const emotions = ['hopeful', 'melancholic', 'energetic', 'calm']
    const selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)]

    if (!selectedEmotion) return []

    const timeRanges: TimeRange[] = [
      Object.freeze({ start: 0, end: duration / 2 }),
      Object.freeze({ start: duration / 2, end: duration })
    ]

    const emotionAnalysis: EmotionAnalysis = Object.freeze({
      emotion: selectedEmotion,
      intensity: 0.7 + Math.random() * 0.3,
      confidence: 0.8 + Math.random() * 0.2,
      timeRanges: Object.freeze(timeRanges),
      keywords: Object.freeze(['emotional', 'expressive', selectedEmotion])
    })

    return [emotionAnalysis]
  }

  /**
   * Generate rhythm pattern
   */
  private generateRhythmPattern(duration: number): RhythmPattern {
    const tempos = [80, 100, 120, 140, 160]
    const tempo = tempos[Math.floor(Math.random() * tempos.length)] || 120

    const rhythmTypes = [RhythmType.STEADY, RhythmType.DRIVING, RhythmType.LAID_BACK]
    const rhythmType = rhythmTypes[Math.floor(Math.random() * rhythmTypes.length)] || RhythmType.STEADY

    const breakdown: RhythmSegment[] = [
      Object.freeze({
        timeRange: Object.freeze({ start: 0, end: duration / 2 }),
        tempo,
        description: 'Steady rhythm throughout'
      }),
      Object.freeze({
        timeRange: Object.freeze({ start: duration / 2, end: duration }),
        tempo: tempo + 5,
        description: 'Slightly faster in second half'
      })
    ]

    const rhythm: RhythmPattern = Object.freeze({
      tempo,
      timeSignature: '4/4',
      rhythmType,
      consistency: 0.85 + Math.random() * 0.15,
      suggestedStressPattern: 'x/x/x/x/',
      breakdown: Object.freeze(breakdown)
    })

    return rhythm
  }

  /**
   * Generate melody analysis
   */
  private generateMelodyAnalysis(): MelodyAnalysis {
    const keys = ['C major', 'G major', 'D major', 'A minor', 'E minor']
    const key = keys[Math.floor(Math.random() * keys.length)] || 'C major'

    const range: PitchRange = Object.freeze({
      lowest: 'C3',
      highest: 'C5',
      range: 24 // semitones
    })

    const contours = [MelodyContour.ARCH, MelodyContour.WAVE, MelodyContour.ASCENDING]
    const contour = contours[Math.floor(Math.random() * contours.length)] || MelodyContour.ARCH

    const motifs: Motif[] = [
      Object.freeze({
        description: 'Rising melodic phrase',
        occurrences: Object.freeze([
          Object.freeze({ start: 10, end: 15 }),
          Object.freeze({ start: 40, end: 45 })
        ]),
        importance: 0.8
      })
    ]

    const hooks: Hook[] = [
      Object.freeze({
        timeRange: Object.freeze({ start: 30, end: 35 }),
        description: 'Catchy melodic hook',
        catchiness: 0.9,
        suggestionForLyrics: 'Use repetitive, memorable phrases here'
      })
    ]

    const melody: MelodyAnalysis = Object.freeze({
      key,
      scale: 'Major',
      range: Object.freeze(range),
      contour,
      motifs: Object.freeze(motifs),
      hooks: Object.freeze(hooks)
    })

    return melody
  }

  /**
   * Generate structure analysis
   */
  private generateStructureAnalysis(duration: number): StructureAnalysis {
    const sections: AudioSection[] = [
      Object.freeze({
        type: AudioSectionType.INTRO,
        timeRange: Object.freeze({ start: 0, end: duration * 0.1 }),
        characteristics: 'Building energy',
        energyLevel: 0.5
      }),
      Object.freeze({
        type: AudioSectionType.VERSE,
        timeRange: Object.freeze({ start: duration * 0.1, end: duration * 0.35 }),
        characteristics: 'Main melodic content',
        energyLevel: 0.6
      }),
      Object.freeze({
        type: AudioSectionType.CHORUS,
        timeRange: Object.freeze({ start: duration * 0.35, end: duration * 0.6 }),
        characteristics: 'High energy, memorable',
        energyLevel: 0.9
      }),
      Object.freeze({
        type: AudioSectionType.BRIDGE,
        timeRange: Object.freeze({ start: duration * 0.6, end: duration * 0.8 }),
        characteristics: 'Contrasting section',
        energyLevel: 0.7
      }),
      Object.freeze({
        type: AudioSectionType.OUTRO,
        timeRange: Object.freeze({ start: duration * 0.8, end: duration }),
        characteristics: 'Winding down',
        energyLevel: 0.4
      })
    ]

    const repeatingElements: RepeatingElement[] = [
      Object.freeze({
        type: 'Chord progression',
        occurrences: Object.freeze([
          Object.freeze({ start: 10, end: 20 }),
          Object.freeze({ start: 50, end: 60 })
        ]),
        pattern: 'I-V-vi-IV'
      })
    ]

    const structure: StructureAnalysis = Object.freeze({
      sections: Object.freeze(sections),
      totalSections: sections.length,
      suggestedLyricStructure: 'Verse-Chorus-Verse-Chorus-Bridge-Chorus',
      repeatingElements: Object.freeze(repeatingElements)
    })

    return structure
  }

  /**
   * Generate vocal analysis
   */
  private generateVocalAnalysis(): VocalAnalysis {
    const hasVocals = Math.random() > 0.3 // 70% chance of vocals

    if (!hasVocals) {
      return Object.freeze({
        hasVocals: false
      })
    }

    const vocalStyle: VocalStyleAnalysis = Object.freeze({
      tone: 'smooth',
      range: Object.freeze({
        lowest: 'A2',
        highest: 'E4',
        range: 19
      }),
      techniques: Object.freeze(['vibrato', 'breath control']),
      characterization: 'Warm and expressive'
    })

    const vocalEffects = [VocalEffect.REVERB, VocalEffect.DELAY]

    const vocal: VocalAnalysis = Object.freeze({
      hasVocals: true,
      vocalStyle: Object.freeze(vocalStyle),
      vocalEffects: Object.freeze(vocalEffects),
      delivery: DeliveryStyle.MELODIC,
      suggestedLyricStyle: 'Flowing, melodic phrases'
    })

    return vocal
  }

  /**
   * Generate suggestions from analysis
   */
  private generateSuggestions(analysis: AnalysisData): AudioSuggestion[] {
    const suggestions: AudioSuggestion[] = []

    // Rhythm suggestion
    suggestions.push(
      Object.freeze({
        type: SuggestionType.RHYTHM_MATCH,
        priority: 0.9,
        suggestion: `Match the ${analysis.rhythmPattern.tempo} BPM tempo with your lyrical flow`,
        rationale: 'The audio has a consistent rhythm that should guide lyric pacing',
        examples: Object.freeze(['Use shorter syllables for faster sections', 'Hold longer notes in slower parts'])
      })
    )

    // Emotion suggestion
    if (analysis.emotions.length > 0) {
      const emotion = analysis.emotions[0]
      if (emotion) {
        suggestions.push(
          Object.freeze({
            type: SuggestionType.MOOD,
            priority: 0.85,
            suggestion: `Align lyrics with the ${emotion.emotion} mood of the music`,
            rationale: `The audio conveys ${emotion.emotion} emotion with ${Math.round(emotion.intensity * 100)}% intensity`,
            examples: Object.freeze(emotion.keywords)
          })
        )
      }
    }

    // Structure suggestion
    suggestions.push(
      Object.freeze({
        type: SuggestionType.STRUCTURE,
        priority: 0.8,
        suggestion: analysis.structure.suggestedLyricStructure,
        rationale: `The audio has ${analysis.structure.totalSections} distinct sections that suggest this structure`
      })
    )

    return suggestions
  }

  /**
   * Generate lyrics fit check
   */
  private generateLyricsFitCheck(lyrics: string, duration: number): LyricsFitCheck {
    const lineCount = lyrics.split('\n').filter(l => l.trim().length > 0).length
    const syllableCount = lyrics.split(/\s+/).length * 2 // Rough estimate

    // Calculate fit scores (mock)
    const overallFit = 0.7 + Math.random() * 0.3
    const rhythmMatch = 0.75 + Math.random() * 0.25
    const emotionMatch = 0.8 + Math.random() * 0.2
    const syllableMatch = lineCount > 0 ? Math.min(syllableCount / (duration * 2), 1) : 0
    const stressMatch = 0.7 + Math.random() * 0.3

    const issues: TimingIssue[] = []
    const recommendations: string[] = [
      'Consider adjusting syllable count to match the melody',
      'Ensure stressed syllables align with musical beats'
    ]

    const fitCheck: LyricsFitCheck = Object.freeze({
      overallFit,
      rhythmMatch,
      emotionMatch,
      syllableMatch,
      stressMatch,
      issues: Object.freeze(issues),
      recommendations: Object.freeze(recommendations)
    })

    return fitCheck
  }
}
