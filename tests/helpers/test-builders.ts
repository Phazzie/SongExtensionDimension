/**
 * @fileoverview Test Data Builders
 * @purpose Builder pattern for creating test data
 */

import type { ValidatedPrompt, PromptId } from '../../src/contracts/InputValidation'
import type { Song, SongId, Verse, Chorus, VerseId, ChorusId, Line } from '../../src/contracts/types/song'
import type { StructureConstraints, StyleConfig } from '../../src/contracts/types/song'

/**
 * Create a validated prompt for testing
 */
export function createValidatedPrompt(
  text: string,
  overrides?: Partial<ValidatedPrompt>
): ValidatedPrompt {
  const id = `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as PromptId

  return {
    id,
    prompt: text,
    context: {
      genre: 'pop',
      mood: 'calm', // Must be a valid mood from SUPPORTED_MOODS
      theme: 'general',
      targetAudience: 'adults',
      ...overrides?.context
    },
    constraints: {
      verseCount: 3,
      linesPerVerse: 4,
      chorusCount: 1,
      linesPerChorus: 4,
      includeBridge: false,
      rhymeScheme: 'ABAB' as const,
      minSyllablesPerLine: 6,
      maxSyllablesPerLine: 12,
      ...overrides?.constraints
    },
    style: {
      genre: 'pop',
      mood: 'calm', // Must be a valid mood from SUPPORTED_MOODS
      ...overrides?.style
    },
    sanitized: true,
    validatedAt: new Date(),
    ...overrides
  }
}

/**
 * Create structure constraints for testing
 */
export function createConstraints(
  overrides?: Partial<StructureConstraints>
): StructureConstraints {
  return {
    verseCount: 3,
    linesPerVerse: 4,
    chorusCount: 1,
    linesPerChorus: 4,
    includeBridge: false,
    rhymeScheme: 'ABAB' as const,
    minSyllablesPerLine: 6,
    maxSyllablesPerLine: 12,
    ...overrides
  }
}

/**
 * Create style config for testing
 */
export function createStyleConfig(
  overrides?: Partial<StyleConfig>
): StyleConfig {
  return {
    genre: 'pop',
    mood: 'neutral',
    ...overrides
  }
}

/**
 * Create a test song
 */
export function createTestSong(overrides?: Partial<Song>): Song {
  const songId = `song_${Date.now()}` as SongId

  const verse1: Verse = {
    id: 'verse_1' as VerseId,
    number: 1,
    lines: [
      createLine('Line 1 of verse one', 1),
      createLine('Line 2 of verse one', 2),
      createLine('Line 3 of verse one', 3),
      createLine('Line 4 of verse one', 4)
    ],
    rhymeScheme: 'ABAB',
    syllablePattern: [6, 6, 6, 6]
  }

  const verse2: Verse = {
    id: 'verse_2' as VerseId,
    number: 2,
    lines: [
      createLine('Line 1 of verse two', 1),
      createLine('Line 2 of verse two', 2),
      createLine('Line 3 of verse two', 3),
      createLine('Line 4 of verse two', 4)
    ],
    rhymeScheme: 'ABAB',
    syllablePattern: [6, 6, 6, 6]
  }

  const chorus: Chorus = {
    id: 'chorus_1' as ChorusId,
    lines: [
      createLine('Chorus line one', 1),
      createLine('Chorus line two', 2),
      createLine('Chorus line three', 3),
      createLine('Chorus line four', 4)
    ],
    rhymeScheme: 'AABB',
    syllablePattern: [5, 5, 5, 5],
    isMainChorus: true
  }

  return {
    id: songId,
    title: 'Test Song',
    verses: [verse1, verse2],
    choruses: [chorus],
    metadata: {
      version: 1,
      genre: 'pop',
      mood: 'neutral',
      theme: 'test',
      tags: ['test']
    },
    generatedAt: new Date(),
    ...overrides
  }
}

/**
 * Create a test line
 */
function createLine(text: string, lineNumber: number): Line {
  const syllables = estimateSyllables(text)
  // Generate a simple stress pattern based on syllable count (alternating x/)
  const stressPattern = Array(syllables).fill(0).map((_, i) => i % 2 === 0 ? 'x' : '/').join('')

  return {
    text,
    syllables,
    stressPattern,
    lineNumber
  }
}

/**
 * Estimate syllables in text (simple heuristic)
 */
function estimateSyllables(text: string): number {
  const vowels = text.toLowerCase().match(/[aeiou]/g)
  return vowels ? vowels.length : 1
}

/**
 * Extract all lyrics from a song
 */
export function extractAllLyrics(song: Song): string {
  const lines: string[] = []

  // Add null checks for safety
  if (song.verses) {
    song.verses.forEach(v => v.lines?.forEach(l => lines.push(l.text)))
  }
  if (song.choruses) {
    song.choruses.forEach(c => c.lines?.forEach(l => lines.push(l.text)))
  }
  if (song.bridge?.lines) {
    song.bridge.lines.forEach(l => lines.push(l.text))
  }

  return lines.join(' ')
}

/**
 * Check if API key is available
 */
export function hasApiKey(): boolean {
  return !!process.env.GROK_API_KEY
}

/**
 * Skip test if no API key
 *
 * NOTE: This function does NOT actually skip tests - it only logs a warning.
 * To properly skip tests based on API key availability, use:
 *
 * @example
 * // Use conditional test definition:
 * (hasApiKey() ? test : test.skip)('test name', () => { ... })
 *
 * // Or use early return in test:
 * test('test name', () => {
 *   if (!hasApiKey()) { return; }
 *   // ... test code
 * })
 */
export function skipIfNoApiKey(): void {
  if (!hasApiKey()) {
    console.warn('⚠️  Skipping test: GROK_API_KEY not set')
    return
  }
}

/**
 * Create test prompt for specific scenarios
 */
export const TestPrompts = {
  simple: () => createValidatedPrompt('Write a simple love song'),

  complex: () => createValidatedPrompt(
    'Write a melancholic rock ballad about loss and redemption with vivid imagery',
    {
      context: {
        genre: 'rock',
        mood: 'melancholic',
        theme: 'loss and redemption',
        targetAudience: 'adults'
      }
    }
  ),

  shortPrompt: () => createValidatedPrompt('Short rain song'),

  withConstraints: () => createValidatedPrompt('Write a song', {
    constraints: {
      verseCount: 4,
      linesPerVerse: 6,
      chorusCount: 2,
      linesPerChorus: 4,
      includeBridge: true,
      rhymeScheme: 'AABB' as const,
      minSyllablesPerLine: 8,
      maxSyllablesPerLine: 10
    }
  }),

  edgeCase: () => createValidatedPrompt(
    'A song about quantum physics and existentialism in hip-hop style'
  )
}
