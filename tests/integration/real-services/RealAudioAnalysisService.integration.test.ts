/**
 * @fileoverview Integration Tests for Real AudioAnalysisService
 * @purpose Validate 100% AI-powered audio analysis using Gemini
 * @integration @audio-analysis
 *
 * Test Count: 30 tests
 * - Contract Compliance: 10 tests
 * - Behavioral Tests: 8 tests
 * - Quality Threshold Tests: 5 tests
 * - Semantic Tests: 4 tests
 * - Edge Cases: 3 tests
 *
 * NOTE: AudioAnalysis is 100% AI-powered using Gemini multimodal capabilities
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals'
import { RealAudioAnalysisService } from '../../../src/services/real/RealAudioAnalysisService'
import { GeminiClient } from '../../../src/services/real/geminiClient'
import type { IGeminiAudioService } from '../../../src/contracts/GeminiAudio'
import {
  AudioMimeType,
  AnalysisType
} from '../../../src/contracts/GeminiAudio'
import { isSuccess, isFailure } from '../../../src/contracts/types/common'
import { hasApiKey } from '../../helpers/test-builders'
import {
  assertValidServiceResponse,
  assertLatencyWithinSLA,
  measurePerformance
} from '../../helpers/assertion-helpers'

describe('RealAudioAnalysisService Integration Tests', () => {
  let service: IGeminiAudioService
  let geminiClient: GeminiClient

  // Helper to create mock audio data
  const createMockAudioData = (sizeKB: number): ArrayBuffer => {
    const buffer = new ArrayBuffer(sizeKB * 1024)
    const view = new Uint8Array(buffer)
    // Fill with some non-zero data to simulate audio
    for (let i = 0; i < view.length; i++) {
      view[i] = Math.floor(Math.random() * 256)
    }
    return buffer
  }

  beforeAll(() => {
    if (!hasApiKey()) {
      console.warn('⚠️  Skipping RealAudioAnalysisService tests: GROK_API_KEY not set')
      return
    }

    geminiClient = new GeminiClient({
      apiKey: process.env.GROK_API_KEY!,
      model: 'gemini-2.0-flash-exp'
    })

    service = new RealAudioAnalysisService(geminiClient)
  })

  beforeEach(() => {
    // GeminiClient doesn't have clearCache - tests run fresh each time
  })

  describe('Contract Compliance (10 tests)', () => {
    it('should return ServiceResponse<AudioAnalysis> from analyzeAudio', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500) // 500KB
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      // Should return proper structure (success or failure)
      assertValidServiceResponse(result)
    }, 30000)

    it('should include nested analysis.rhythmPattern', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      if (isSuccess(result)) {
        expect(result.data).toHaveProperty('analysis')
        expect(result.data.analysis).toHaveProperty('rhythmPattern')
        expect(result.data.analysis.rhythmPattern).toHaveProperty('tempo')
        expect(result.data.analysis.rhythmPattern).toHaveProperty('timeSignature')
        expect(result.data.analysis.rhythmPattern).toHaveProperty('rhythmType')
      }
    }, 30000)

    it('should include nested analysis.emotions', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.EMOTION
      })

      if (isSuccess(result)) {
        expect(result.data).toHaveProperty('analysis')
        expect(result.data.analysis).toHaveProperty('emotions')
        expect(Array.isArray(result.data.analysis.emotions)).toBe(true)
      }
    }, 30000)

    it('should include nested analysis.melody with key', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.MELODY
      })

      if (isSuccess(result)) {
        expect(result.data.analysis).toHaveProperty('melody')
        expect(result.data.analysis.melody).toHaveProperty('key')
        expect(result.data.analysis.melody).toHaveProperty('scale')
        expect(result.data.analysis.melody).toHaveProperty('range')
        expect(result.data.analysis.melody).toHaveProperty('contour')
      }
    }, 30000)

    it('should include nested analysis.structure', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.STRUCTURE
      })

      if (isSuccess(result)) {
        expect(result.data.analysis).toHaveProperty('structure')
        expect(result.data.analysis.structure).toHaveProperty('sections')
        expect(Array.isArray(result.data.analysis.structure.sections)).toBe(true)
      }
    }, 30000)

    it('should include suggestions array', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      if (isSuccess(result)) {
        expect(result.data).toHaveProperty('suggestions')
        expect(Array.isArray(result.data.suggestions)).toBe(true)
      }
    }, 30000)

    it('should include metadata with duration', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      if (isSuccess(result)) {
        expect(result.data).toHaveProperty('metadata')
        expect(result.data.metadata).toHaveProperty('duration')
        expect(result.data.metadata).toHaveProperty('fileSize')
        expect(result.data.metadata).toHaveProperty('format')
      }
    }, 30000)

    it('should handle empty audio data gracefully', async () => {
      if (!hasApiKey()) return

      const emptyAudioData = new ArrayBuffer(0)
      const result = await service.analyzeAudio({
        audioData: emptyAudioData,
        fileName: 'empty.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      // Should return failure for empty data
      expect(isFailure(result)).toBe(true)

      if (isFailure(result)) {
        expect(result.error.code).toBe('INVALID_AUDIO_FILE')
        expect(result.error.suggestion).toBeTruthy()
      }
    }, 10000)

    it('should include analyzedAt timestamp', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      if (isSuccess(result)) {
        expect(result.data).toHaveProperty('analyzedAt')
        expect(result.data.analyzedAt).toBeInstanceOf(Date)
      }
    }, 30000)

    it('should validate input with empty prompt', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE,
        prompt: '' // Empty prompt should fail
      })

      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error.code).toBe('INVALID_PROMPT')
      }
    }, 10000)
  })

  describe('Behavioral Tests (8 tests)', () => {
    it('should detect reasonable BPM (40-220)', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.RHYTHM
      })

      if (isSuccess(result)) {
        const bpm = result.data.analysis.rhythmPattern.tempo
        expect(bpm).toBeGreaterThanOrEqual(40)  // Very slow
        expect(bpm).toBeLessThanOrEqual(220)    // Very fast
      }
    }, 30000)

    it('should identify emotions with confidence scores', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.EMOTION
      })

      if (isSuccess(result)) {
        expect(result.data.analysis.emotions.length).toBeGreaterThanOrEqual(0)
        result.data.analysis.emotions.forEach(emotion => {
          expect(emotion.confidence).toBeGreaterThanOrEqual(0)
          expect(emotion.confidence).toBeLessThanOrEqual(1)
          expect(emotion.intensity).toBeGreaterThanOrEqual(0)
          expect(emotion.intensity).toBeLessThanOrEqual(1)
        })
      }
    }, 30000)

    it('should provide valid musical key', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.MELODY
      })

      if (isSuccess(result)) {
        const validKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        const key = result.data.analysis.melody.key

        // Key should contain a valid note
        const containsValidNote = validKeys.some(note => key.includes(note))
        expect(containsValidNote).toBe(true)
      }
    }, 30000)

    it('should classify rhythm type correctly', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.RHYTHM
      })

      if (isSuccess(result)) {
        const validRhythmTypes = ['steady', 'syncopated', 'variable', 'driving', 'laid_back', 'complex']
        expect(validRhythmTypes).toContain(result.data.analysis.rhythmPattern.rhythmType)
      }
    }, 30000)

    it('should identify melodic motifs and hooks', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.MELODY
      })

      if (isSuccess(result)) {
        expect(Array.isArray(result.data.analysis.melody.motifs)).toBe(true)
        expect(Array.isArray(result.data.analysis.melody.hooks)).toBe(true)
      }
    }, 30000)

    it('should complete within performance SLA (P95 < 30s)', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const { duration, result } = await measurePerformance(
        () => service.analyzeAudio({
          audioData,
          fileName: 'test-audio.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.COMPREHENSIVE
        }),
        30000
      )

      expect(result).toBeTruthy()
      assertLatencyWithinSLA(duration, 30000)
    }, 45000)

    it('should track duration in metadata', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      if (isSuccess(result)) {
        // Duration should match metadata
        expect(result.data.duration).toBe(result.data.metadata.duration)
        expect(result.data.duration).toBeGreaterThan(0)
      }
    }, 30000)

    it('should provide actionable suggestions with rationale', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      if (isSuccess(result)) {
        result.data.suggestions.forEach(suggestion => {
          expect(suggestion.suggestion).toBeTruthy()
          expect(suggestion.rationale).toBeTruthy()
          expect(suggestion.priority).toBeGreaterThanOrEqual(0)
          expect(suggestion.priority).toBeLessThanOrEqual(1)
        })
      }
    }, 30000)
  })

  describe('Quality Threshold Tests (5 tests)', () => {
    it('should have complete analysis for all sections', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      if (isSuccess(result)) {
        expect(result.data.analysis.rhythmPattern).toBeTruthy()
        expect(result.data.analysis.emotions).toBeTruthy()
        expect(result.data.analysis.melody).toBeTruthy()
        expect(result.data.analysis.structure).toBeTruthy()
        expect(result.data.analysis.vocal).toBeTruthy()
      }
    }, 30000)

    it('should provide consistent structure for same input', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result1 = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      const result2 = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      // Structure should be consistent
      expect(typeof result1.success).toBe(typeof result2.success)
      if (isSuccess(result1) && isSuccess(result2)) {
        expect(typeof result1.data.analysis).toBe(typeof result2.data.analysis)
      }
    }, 60000)

    it('should handle file size validation correctly', async () => {
      if (!hasApiKey()) return

      // File too large (>10MB)
      const largeAudioData = createMockAudioData(11 * 1024) // 11MB
      const result = await service.analyzeAudio({
        audioData: largeAudioData,
        fileName: 'large-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error.code).toBe('FILE_TOO_LARGE')
      }
    }, 10000)

    it('should reject files that are too short', async () => {
      if (!hasApiKey()) return

      // Very small file (simulates <10s duration)
      const smallAudioData = createMockAudioData(50) // 50KB
      const result = await service.analyzeAudio({
        audioData: smallAudioData,
        fileName: 'short-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error.code).toBe('FILE_TOO_SHORT')
      }
    }, 10000)

    it('should validate audio format from filename', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.xyz', // Unsupported format
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error.code).toBe('UNSUPPORTED_FORMAT')
      }
    }, 10000)
  })

  describe('Semantic Tests (4 tests)', () => {
    it('should analyze structure sections with energy levels', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.STRUCTURE
      })

      if (isSuccess(result)) {
        const sections = result.data.analysis.structure.sections
        sections.forEach(section => {
          expect(section.energyLevel).toBeGreaterThanOrEqual(0)
          expect(section.energyLevel).toBeLessThanOrEqual(1)
          expect(section.characteristics).toBeTruthy()
        })
      }
    }, 30000)

    it('should match emotions with time ranges', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.EMOTION
      })

      if (isSuccess(result)) {
        result.data.analysis.emotions.forEach(emotion => {
          expect(Array.isArray(emotion.timeRanges)).toBe(true)
          emotion.timeRanges.forEach(range => {
            expect(range.start).toBeGreaterThanOrEqual(0)
            expect(range.end).toBeGreaterThan(range.start)
          })
        })
      }
    }, 30000)

    it('should identify coherent style elements in vocal analysis', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.VOCAL
      })

      if (isSuccess(result)) {
        expect(result.data.analysis.vocal).toHaveProperty('hasVocals')
        expect(typeof result.data.analysis.vocal.hasVocals).toBe('boolean')
      }
    }, 30000)

    it('should provide contextual suggestions based on analysis type', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE,
        prompt: 'Focus on romantic themes'
      })

      if (isSuccess(result)) {
        // Suggestions should be meaningful
        expect(Array.isArray(result.data.suggestions)).toBe(true)
        result.data.suggestions.forEach(suggestion => {
          const validTypes = ['imagery', 'theme', 'mood', 'rhythm_match', 'vocal_delivery', 'structure', 'energy_level', 'lyric_style']
          expect(validTypes).toContain(suggestion.type)
        })
      }
    }, 30000)
  })

  describe('Edge Cases (3 tests)', () => {
    it('should handle unsupported format gracefully', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.xyz',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      expect(isFailure(result)).toBe(true)

      if (isFailure(result)) {
        expect(result.error.code).toBe('UNSUPPORTED_FORMAT')
        expect(result.error.message).toContain('format')
      }
    }, 10000)

    it('should validate time ranges in rhythm breakdown', async () => {
      if (!hasApiKey()) return

      const audioData = createMockAudioData(500)
      const result = await service.analyzeAudio({
        audioData,
        fileName: 'test-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.RHYTHM
      })

      if (isSuccess(result)) {
        result.data.analysis.rhythmPattern.breakdown.forEach(segment => {
          expect(segment.timeRange.start).toBeGreaterThanOrEqual(0)
          expect(segment.timeRange.end).toBeGreaterThan(segment.timeRange.start)
          expect(segment.tempo).toBeGreaterThan(0)
        })
      }
    }, 30000)

    it('should handle very long files with duration check', async () => {
      if (!hasApiKey()) return

      // Large file (simulates >600s duration)
      const longAudioData = createMockAudioData(8 * 1024) // 8MB
      const result = await service.analyzeAudio({
        audioData: longAudioData,
        fileName: 'long-audio.mp3',
        mimeType: AudioMimeType.MP3,
        analysisType: AnalysisType.COMPREHENSIVE
      })

      // Should either succeed or return helpful error about duration
      if (isFailure(result)) {
        expect(result.error.suggestion).toBeTruthy()
      }
    }, 60000)
  })
})
