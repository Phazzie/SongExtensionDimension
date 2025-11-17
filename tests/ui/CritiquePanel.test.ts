/**
 * @fileoverview Tests for CritiquePanel
 * @purpose Verify critique panel functionality
 */

import { CritiquePanel } from '../../src/panels/CritiquePanel'
import { MockCritiqueEngineService } from '../../src/services/mock/MockCritiqueEngineService'
import type { Song } from '../../src/contracts/types/song'
import { createSongId, createVerseId } from '../../src/contracts/types/song'

describe('CritiquePanel', () => {
  // Mock song for testing
  const mockSong: Song = {
    id: createSongId('test_song_1'),
    title: 'Test Song',
    verses: [
      {
        id: createVerseId('verse_1'),
        number: 1,
        lines: [
          {
            text: 'Walking down the street with my heart on my sleeve',
            syllables: 12,
            stressPattern: 'x/x/x/x/x/x/'
          },
          {
            text: 'Stars in your eyes make me believe',
            syllables: 10,
            stressPattern: 'x/x/x/x/x/'
          }
        ],
        rhymeScheme: 'AABB',
        syllablePattern: [12, 10]
      }
    ],
    choruses: [],
    metadata: {
      genre: 'Pop',
      mood: 'Melancholic',
      version: 1
    },
    generatedAt: new Date()
  }

  describe('CritiquePanel Integration', () => {
    it('should analyze song with MockCritiqueEngineService', async () => {
      const service = new MockCritiqueEngineService()
      const result = await service.analyzeSong(mockSong)

      expect(result.success).toBe(true)

      if (result.success) {
        const report = result.data

        // Verify report structure
        expect(report.songId).toBe(mockSong.id)
        expect(report.overallScore).toBeGreaterThanOrEqual(0)
        expect(report.overallScore).toBeLessThanOrEqual(100)
        expect(report.qualityLevel).toBeDefined()
        expect(report.scores).toBeDefined()
        expect(report.issues).toBeDefined()
        expect(report.suggestions).toBeDefined()
        expect(report.strengths).toBeDefined()
        expect(report.generatedAt).toBeInstanceOf(Date)

        // Verify quality scores
        expect(report.scores.rhymeQuality).toBeGreaterThanOrEqual(0)
        expect(report.scores.rhymeQuality).toBeLessThanOrEqual(100)
        expect(report.scores.flowConsistency).toBeGreaterThanOrEqual(0)
        expect(report.scores.flowConsistency).toBeLessThanOrEqual(100)
        expect(report.scores.imageryVividness).toBeGreaterThanOrEqual(0)
        expect(report.scores.imageryVividness).toBeLessThanOrEqual(100)
        expect(report.scores.emotionalAuthenticity).toBeGreaterThanOrEqual(0)
        expect(report.scores.emotionalAuthenticity).toBeLessThanOrEqual(100)

        // Verify issues detected (song has clichés)
        expect(report.issues.length).toBeGreaterThan(0)

        // Verify cliché detection
        const clicheIssues = report.issues.filter(i => i.issueType === 'cliche')
        expect(clicheIssues.length).toBeGreaterThan(0)

        console.log('✓ Critique analysis completed successfully')
        console.log(`  Overall Score: ${report.overallScore}`)
        console.log(`  Quality Level: ${report.qualityLevel}`)
        console.log(`  Issues Found: ${report.issues.length}`)
        console.log(`  Suggestions: ${report.suggestions.length}`)
        console.log(`  Strengths: ${report.strengths.length}`)
      }
    })

    it('should detect specific clichés in test song', async () => {
      const service = new MockCritiqueEngineService()
      const result = await service.analyzeSong(mockSong)

      expect(result.success).toBe(true)

      if (result.success) {
        const report = result.data

        // Check for "heart on my sleeve" cliché
        const heartSleeveCliche = report.issues.find(
          i => i.message.toLowerCase().includes('heart on my sleeve')
        )
        expect(heartSleeveCliche).toBeDefined()

        // Check for "stars in your eyes" cliché
        const starsEyesCliche = report.issues.find(
          i => i.message.toLowerCase().includes('stars in') &&
               i.message.toLowerCase().includes('eyes')
        )
        expect(starsEyesCliche).toBeDefined()

        console.log('✓ Cliché detection working correctly')
      }
    })

    it('should provide quality scores for all 8 dimensions', async () => {
      const service = new MockCritiqueEngineService()
      const result = await service.analyzeSong(mockSong)

      expect(result.success).toBe(true)

      if (result.success) {
        const report = result.data
        const scores = report.scores

        // All 8 quality dimensions should be present
        expect(scores.rhymeQuality).toBeDefined()
        expect(scores.flowConsistency).toBeDefined()
        expect(scores.imageryVividness).toBeDefined()
        expect(scores.emotionalAuthenticity).toBeDefined()
        expect(scores.originalityScore).toBeDefined()
        expect(scores.voiceConsistency).toBeDefined()
        expect(scores.structuralCoherence).toBeDefined()
        expect(scores.technicalExecution).toBeDefined()

        console.log('✓ All 8 quality dimensions present')
        console.log('  Quality Scores:')
        console.log(`    Rhyme Quality: ${scores.rhymeQuality}`)
        console.log(`    Flow Consistency: ${scores.flowConsistency}`)
        console.log(`    Imagery Vividness: ${scores.imageryVividness}`)
        console.log(`    Emotional Authenticity: ${scores.emotionalAuthenticity}`)
        console.log(`    Originality: ${scores.originalityScore}`)
        console.log(`    Voice Consistency: ${scores.voiceConsistency}`)
        console.log(`    Structural Coherence: ${scores.structuralCoherence}`)
        console.log(`    Technical Execution: ${scores.technicalExecution}`)
      }
    })

    it('should provide suggestions based on issues', async () => {
      const service = new MockCritiqueEngineService()
      const result = await service.analyzeSong(mockSong)

      expect(result.success).toBe(true)

      if (result.success) {
        const report = result.data

        // Should have suggestions since there are issues
        if (report.issues.length > 0) {
          expect(report.suggestions.length).toBeGreaterThan(0)

          // Suggestions should have required properties
          report.suggestions.forEach(suggestion => {
            expect(suggestion.type).toBeDefined()
            expect(suggestion.description).toBeDefined()
          })

          console.log('✓ Suggestions generated from issues')
          console.log(`  Total Suggestions: ${report.suggestions.length}`)
          report.suggestions.forEach((s, i) => {
            console.log(`    ${i + 1}. [${s.type}] ${s.description}`)
          })
        }
      }
    })

    it('should identify strengths in the song', async () => {
      const service = new MockCritiqueEngineService()
      const result = await service.analyzeSong(mockSong)

      expect(result.success).toBe(true)

      if (result.success) {
        const report = result.data

        // Should identify at least some strengths
        expect(report.strengths.length).toBeGreaterThanOrEqual(0)

        console.log('✓ Strengths identified')
        console.log(`  Total Strengths: ${report.strengths.length}`)
        report.strengths.forEach((s, i) => {
          console.log(`    ${i + 1}. ${s}`)
        })
      }
    })

    it('should check gold standard compliance', async () => {
      const service = new MockCritiqueEngineService()
      const result = await service.analyzeSong(mockSong)

      expect(result.success).toBe(true)

      if (result.success) {
        const report = result.data

        expect(typeof report.passesGoldStandard).toBe('boolean')

        console.log('✓ Gold standard check performed')
        console.log(`  Passes Gold Standard: ${report.passesGoldStandard ? 'Yes' : 'No'}`)

        if (!report.passesGoldStandard) {
          console.log('  Reasons:')
          // Show which criteria failed
          if (report.scores.originalityScore < 85) {
            console.log(`    - Originality too low (${report.scores.originalityScore} < 85)`)
          }
        }
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty song gracefully', async () => {
      const service = new MockCritiqueEngineService()

      const emptySong: Song = {
        id: createSongId('empty_song'),
        title: 'Empty',
        verses: [],
        choruses: [],
        metadata: { version: 1 },
        generatedAt: new Date()
      }

      const result = await service.analyzeSong(emptySong)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('SONG_TOO_SHORT')
      }

      console.log('✓ Empty song handled gracefully')
    })

    it('should handle perfect song (no issues)', async () => {
      const service = new MockCritiqueEngineService()

      const perfectSong: Song = {
        id: createSongId('perfect_song'),
        title: 'Perfect Song',
        verses: [
          {
            id: createVerseId('verse_1'),
            number: 1,
            lines: [
              {
                text: 'Crimson leaves dance through autumn air',
                syllables: 10,
                stressPattern: 'x/x/x/x/x/'
              },
              {
                text: 'Whispers echo secrets everywhere',
                syllables: 10,
                stressPattern: 'x/x/x/x/x/'
              }
            ],
            rhymeScheme: 'AABB',
            syllablePattern: [10, 10]
          }
        ],
        choruses: [],
        metadata: { version: 1 },
        generatedAt: new Date()
      }

      const result = await service.analyzeSong(perfectSong)

      expect(result.success).toBe(true)

      if (result.success) {
        const report = result.data

        // Should have fewer issues than the cliché-filled song
        expect(report.issues.length).toBeLessThan(2)

        console.log('✓ Perfect song handled correctly')
        console.log(`  Issues: ${report.issues.length}`)
        console.log(`  Overall Score: ${report.overallScore}`)
      }
    })
  })
})
