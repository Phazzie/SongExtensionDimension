/**
 * @fileoverview Golden Test Set - Continuous Quality Validation
 * @purpose Run curated test cases weekly to detect AI quality regression
 * @integration @golden-set
 *
 * Test Count: Variable (based on golden-test-cases.json)
 * Frequency: Weekly (automated via CI/CD)
 * Purpose: Detect AI model drift and quality degradation
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import { readFileSync } from 'fs'
import { join } from 'path'
import { RealSongGenerationService } from '../../../src/services/real/RealSongGenerationService'
import { RealCritiqueEngineService } from '../../../src/services/real/RealCritiqueEngineService'
import { GrokProvider } from '../../../src/services/providers/GrokProvider'
import { isSuccess } from '../../../src/contracts/types/common'
import { createValidatedPrompt, extractAllLyrics, hasApiKey } from '../../helpers/test-builders'
import { assertSongQuality, assertContainsTheme, assertDoesNotContainClichés } from '../../helpers/assertion-helpers'

interface GoldenTestCase {
  readonly id: string
  readonly category: string
  readonly prompt: string
  readonly context: {
    readonly genre: string
    readonly mood: string
    readonly theme: string
  }
  readonly expectedQuality: {
    readonly minOverallScore: number
    readonly minRhymeScore: number
    readonly minFlowScore: number
    readonly minImageryScore: number
    readonly passesGoldStandard: boolean
  }
  readonly expectedBehavior: {
    readonly verseCount: { min: number; max: number }
    readonly hasChorus: boolean
    readonly hasBridge?: boolean
    readonly rhymeScheme?: string
  }
  readonly semanticExpectations: {
    readonly requiredThemes: readonly string[]
    readonly forbiddenPhrases: readonly string[]
    readonly emotionalTone: string
  }
  readonly revisionTarget?: {
    readonly targetIssues: readonly string[]
    readonly expectedImprovement: number
  }
}

interface GoldenTestData {
  readonly version: string
  readonly testCases: readonly GoldenTestCase[]
}

// Load test cases synchronously at module level (required for describe-time iteration)
function loadGoldenTestCases(): readonly GoldenTestCase[] {
  try {
    const testDataPath = join(__dirname, 'golden-test-cases.json')
    const testData: GoldenTestData = JSON.parse(readFileSync(testDataPath, 'utf-8'))
    return testData.testCases
  } catch {
    // Return empty array if file doesn't exist
    return []
  }
}

const testCases = loadGoldenTestCases()

describe('Golden Test Set - Quality Validation', () => {
  let songService: RealSongGenerationService
  let critiqueService: RealCritiqueEngineService
  let results: Map<string, {
    passed: boolean
    score: number
    issues: string[]
  }>

  beforeAll(() => {
    if (!hasApiKey()) {
      console.warn('⚠️  Skipping Golden Set tests: GROK_API_KEY not set')
      return
    }

    const provider = new GrokProvider({
      apiKey: process.env.GROK_API_KEY!,
      timeout: 45000,
      maxRetries: 3,
      enableCache: false // Don't cache golden tests
    })

    songService = new RealSongGenerationService(provider)
    critiqueService = new RealCritiqueEngineService(provider)

    results = new Map()
  })

  describe('Golden Test Cases', () => {
    testCases.forEach(testCase => {
      it(`should meet quality standards for: ${testCase.id} - ${testCase.prompt}`, async () => {
        if (!hasApiKey()) return

        // Generate song
        const genResult = await songService.generate({
          prompt: createValidatedPrompt(testCase.prompt, {
            context: testCase.context
          })
        })

        expect(isSuccess(genResult)).toBe(true)
        if (!isSuccess(genResult)) {
          results.set(testCase.id, {
            passed: false,
            score: 0,
            issues: ['Generation failed']
          })
          return
        }

        const { song } = genResult.data

        // Validate behavioral expectations
        assertSongQuality(song, {
          minVerses: testCase.expectedBehavior.verseCount.min,
          maxVerses: testCase.expectedBehavior.verseCount.max,
          hasChorus: testCase.expectedBehavior.hasChorus,
          hasBridge: testCase.expectedBehavior.hasBridge
        })

        // Run critique
        const critiqueResult = await critiqueService.analyzeSong(song)
        expect(isSuccess(critiqueResult)).toBe(true)
        if (!isSuccess(critiqueResult)) {
          results.set(testCase.id, {
            passed: false,
            score: 0,
            issues: ['Critique failed']
          })
          return
        }

        const { scores, overallScore, passesGoldStandard } = critiqueResult.data

        // Validate quality thresholds
        const issues: string[] = []

        if (overallScore < testCase.expectedQuality.minOverallScore) {
          issues.push(`Overall score ${overallScore} below min ${testCase.expectedQuality.minOverallScore}`)
        }

        if (scores.rhymeQuality < testCase.expectedQuality.minRhymeScore) {
          issues.push(`Rhyme score ${scores.rhymeQuality} below min ${testCase.expectedQuality.minRhymeScore}`)
        }

        if (scores.flowConsistency < testCase.expectedQuality.minFlowScore) {
          issues.push(`Flow score ${scores.flowConsistency} below min ${testCase.expectedQuality.minFlowScore}`)
        }

        if (scores.imageryVividness < testCase.expectedQuality.minImageryScore) {
          issues.push(`Imagery score ${scores.imageryVividness} below min ${testCase.expectedQuality.minImageryScore}`)
        }

        // Validate semantic expectations
        const lyrics = extractAllLyrics(song)

        testCase.semanticExpectations.requiredThemes.forEach(theme => {
          assertContainsTheme(lyrics, theme)
        })

        if (testCase.semanticExpectations.forbiddenPhrases.length > 0) {
          assertDoesNotContainClichés(lyrics, [...testCase.semanticExpectations.forbiddenPhrases])
        }

        // Record results
        const passed = issues.length === 0
        results.set(testCase.id, {
          passed,
          score: overallScore,
          issues
        })

        // Log result for tracking
        console.log(`${passed ? '✓' : '✗'} ${testCase.id}: Overall=${overallScore}, Rhyme=${scores.rhymeQuality}, Flow=${scores.flowConsistency}`)

        // Assert all checks passed
        expect(issues.length).toBe(0)
      }, 60000)
    })
  })

  describe('Aggregate Golden Set Metrics', () => {
    it('should have ≥95% pass rate across all golden tests', () => {
      if (!hasApiKey()) return

      const totalTests = results.size
      const passedTests = Array.from(results.values()).filter(r => r.passed).length
      const passRate = passedTests / totalTests

      console.log(`\n📊 Golden Set Results:`)
      console.log(`   Total Tests: ${totalTests}`)
      console.log(`   Passed: ${passedTests}`)
      console.log(`   Failed: ${totalTests - passedTests}`)
      console.log(`   Pass Rate: ${(passRate * 100).toFixed(1)}%`)

      expect(passRate).toBeGreaterThanOrEqual(0.95)
    })

    it('should have stable average quality (no regression)', () => {
      if (!hasApiKey()) return

      const scores = Array.from(results.values()).map(r => r.score)
      const avgQuality = scores.reduce((a, b) => a + b, 0) / scores.length

      console.log(`   Average Quality: ${avgQuality.toFixed(1)}`)

      // Load baseline (would be from previous run)
      const baseline = { avgQuality: 65 } // Placeholder

      // Average quality should not degrade >10 points
      expect(avgQuality).toBeGreaterThanOrEqual(baseline.avgQuality - 10)
    })

    it('should have no critical regressions', () => {
      if (!hasApiKey()) return

      const failedTests = Array.from(results.entries())
        .filter(([_, result]) => !result.passed)
        .map(([id, result]) => ({ id, ...result }))

      if (failedTests.length > 0) {
        console.log(`\n⚠️  Failed Tests:`)
        failedTests.forEach(test => {
          console.log(`   ${test.id}: Score=${test.score}`)
          test.issues.forEach(issue => console.log(`      - ${issue}`))
        })
      }

      // Should have <5% failures
      expect(failedTests.length).toBeLessThan(results.size * 0.05)
    })
  })
})
