/**
 * @fileoverview Example: Using RealSunoFormatterService
 * @purpose Demonstrates AI-powered Suno formatting in real-world scenarios
 */

import { RealSunoFormatterService } from '../src/services/real/RealSunoFormatterService'
import { SunoVersion, TrimStrategy } from '../src/contracts/SunoFormatter'
import { TempoType, VocalStyle } from '../src/contracts/types/song'
import { isSuccess, isFailure } from '../src/contracts/types/common'
import type { Song } from '../src/contracts/types/song'
import { createSongId, createVerseId, createChorusId } from '../src/contracts/types/song'

/**
 * Example 1: Basic Song Formatting
 */
async function example1_BasicFormatting() {
  console.log('=== Example 1: Basic Song Formatting ===\n')

  // Initialize service (requires GEMINI_API_KEY environment variable)
  const formatter = new RealSunoFormatterService()

  // Create a simple song
  const song: Song = {
    id: createSongId('song-001'),
    title: 'Summer Days',
    verses: [
      {
        id: createVerseId('v1'),
        number: 1,
        lines: [
          { text: 'Walking down the beach at sunset', syllables: 8, stressPattern: 'x/x/x/x/' },
          { text: 'Feeling the warm sand beneath my feet', syllables: 9, stressPattern: 'x/x/x/x/x/' },
          { text: 'The ocean waves are calling', syllables: 7, stressPattern: 'x/x/x/x/' },
          { text: 'To a rhythm so sweet', syllables: 5, stressPattern: 'x/x/x/' }
        ],
        rhymeScheme: 'ABCB',
        syllablePattern: [8, 9, 7, 5]
      }
    ],
    choruses: [
      {
        id: createChorusId('c1'),
        lines: [
          { text: 'Summer days, summer nights', syllables: 6, stressPattern: 'x/x/x/' },
          { text: 'Everything feels so right', syllables: 6, stressPattern: 'x/x/x/' },
          { text: 'Living in the moment', syllables: 6, stressPattern: 'x/x/x/' },
          { text: 'Under the moonlight', syllables: 5, stressPattern: 'x/x/x/' }
        ],
        rhymeScheme: 'AABA',
        syllablePattern: [6, 6, 6, 5],
        isMainChorus: true
      }
    ],
    metadata: {
      genre: 'pop',
      mood: 'upbeat',
      theme: 'summer romance'
    },
    generatedAt: new Date()
  }

  // Format for Suno v5.0
  const result = await formatter.formatSong(song, {
    version: SunoVersion.V5_0,
    includeTags: true,
    style: {
      genre: 'pop',
      tempo: TempoType.MID,
      mood: 'upbeat',
      vocalStyle: VocalStyle.MELODIC
    }
  })

  if (isSuccess(result)) {
    console.log('✅ Formatted successfully!\n')
    console.log('=== FORMATTED TEXT ===')
    console.log(result.data.formattedText)
    console.log('\n=== METADATA ===')
    console.log(`Character count: ${result.data.characterCount}/3000`)
    console.log(`Applied tags: ${result.data.appliedTags.join(', ')}`)
    console.log(`Valid: ${result.data.validation.valid}`)

    if (result.data.suggestions.length > 0) {
      console.log('\n=== SUGGESTIONS ===')
      result.data.suggestions.forEach(s => {
        console.log(`• ${s.tag} (${s.confidence}): ${s.reason}`)
      })
    }
  } else {
    console.error('❌ Formatting failed:', result.error.message)
  }
}

/**
 * Example 2: Getting AI Tag Suggestions
 */
async function example2_TagSuggestions() {
  console.log('\n\n=== Example 2: AI Tag Suggestions ===\n')

  const formatter = new RealSunoFormatterService()

  const song: Song = {
    id: createSongId('song-002'),
    title: 'Midnight Drive',
    verses: [
      {
        id: createVerseId('v1'),
        number: 1,
        lines: [
          { text: 'City lights blur as we race through the night', syllables: 10, stressPattern: 'x/x/x/x/x/' },
          { text: 'Radio loud, windows down, feeling free', syllables: 9, stressPattern: 'x/x/x/x/x/' }
        ],
        rhymeScheme: 'AB',
        syllablePattern: [10, 9]
      }
    ],
    choruses: [
      {
        id: createChorusId('c1'),
        lines: [
          { text: 'This is our escape', syllables: 5, stressPattern: 'x/x/x/' },
          { text: 'From everything we hate', syllables: 6, stressPattern: 'x/x/x/' }
        ],
        rhymeScheme: 'AA',
        syllablePattern: [5, 6],
        isMainChorus: true
      }
    ],
    metadata: {
      genre: 'rock',
      mood: 'rebellious',
      theme: 'freedom'
    },
    generatedAt: new Date()
  }

  // Get tag suggestions
  const result = await formatter.suggestTags(song, {
    genre: 'alternative rock',
    tempo: TempoType.FAST,
    mood: 'rebellious',
    vocalStyle: VocalStyle.POWERFUL
  })

  if (isSuccess(result)) {
    console.log('✅ Got tag suggestions!\n')
    result.data.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.tag}`)
      console.log(`   Section: ${suggestion.section}`)
      console.log(`   Type: ${suggestion.tagType}`)
      console.log(`   Reason: ${suggestion.reason}`)
      console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`)
      console.log()
    })
  } else {
    console.error('❌ Failed to get suggestions:', result.error.message)
  }
}

/**
 * Example 3: Enhancement Suggestions
 */
async function example3_Enhancements() {
  console.log('\n\n=== Example 3: Enhancement Suggestions ===\n')

  const formatter = new RealSunoFormatterService()

  // Song without intro or outro
  const song: Song = {
    id: createSongId('song-003'),
    title: 'Incomplete Song',
    verses: [
      {
        id: createVerseId('v1'),
        number: 1,
        lines: [
          { text: 'Just a simple verse', syllables: 5, stressPattern: 'x/x/x/' }
        ],
        rhymeScheme: 'A',
        syllablePattern: [5]
      }
    ],
    choruses: [
      {
        id: createChorusId('c1'),
        lines: [
          { text: 'Simple chorus too', syllables: 5, stressPattern: 'x/x/x/' }
        ],
        rhymeScheme: 'A',
        syllablePattern: [5],
        isMainChorus: true
      }
    ],
    metadata: {},
    generatedAt: new Date()
  }

  const result = await formatter.suggestEnhancements(song)

  if (isSuccess(result)) {
    console.log('✅ Got enhancement suggestions!\n')
    result.data.forEach((enhancement, index) => {
      console.log(`${index + 1}. ${enhancement.type.toUpperCase()}`)
      console.log(`   Section: ${enhancement.section}`)
      console.log(`   Suggestion: ${enhancement.suggestion}`)
      console.log(`   Example: ${enhancement.example}`)
      console.log(`   Impact: ${enhancement.impact}`)
      console.log()
    })
  } else {
    console.error('❌ Failed to get enhancements:', result.error.message)
  }
}

/**
 * Example 4: Version Conversion
 */
async function example4_VersionConversion() {
  console.log('\n\n=== Example 4: Version Conversion ===\n')

  const formatter = new RealSunoFormatterService()

  // v4.0 formatted text
  const v4Text = `[Verse 1]
Simple verse here
Just plain text

[Chorus]
Simple chorus
Nothing fancy`

  console.log('Original (v4.0):')
  console.log(v4Text)
  console.log()

  // Convert to v5.0
  const result = await formatter.convertVersion(
    v4Text,
    SunoVersion.V4_0,
    SunoVersion.V5_0
  )

  if (isSuccess(result)) {
    console.log('✅ Converted to v5.0:')
    console.log(result.data)
  } else {
    console.error('❌ Conversion failed:', result.error.message)
  }
}

/**
 * Example 5: Trimming Long Songs
 */
async function example5_Trimming() {
  console.log('\n\n=== Example 5: Trimming Long Songs ===\n')

  const formatter = new RealSunoFormatterService()

  // Create a song with lots of verses
  const longSong: Song = {
    id: createSongId('song-004'),
    title: 'Epic Long Song',
    verses: Array(10).fill(null).map((_, i) => ({
      id: createVerseId(`v${i + 1}`),
      number: i + 1,
      lines: [
        { text: `This is verse ${i + 1} line 1 with lots of words to make it long`, syllables: 15, stressPattern: 'x/x/x/x/x/x/x/' },
        { text: `This is verse ${i + 1} line 2 with lots of words to make it long`, syllables: 15, stressPattern: 'x/x/x/x/x/x/x/' },
        { text: `This is verse ${i + 1} line 3 with lots of words to make it long`, syllables: 15, stressPattern: 'x/x/x/x/x/x/x/' },
        { text: `This is verse ${i + 1} line 4 with lots of words to make it long`, syllables: 15, stressPattern: 'x/x/x/x/x/x/x/' }
      ],
      rhymeScheme: 'AAAA',
      syllablePattern: [15, 15, 15, 15]
    })),
    choruses: [
      {
        id: createChorusId('c1'),
        lines: [
          { text: 'Chorus with many words', syllables: 5, stressPattern: 'x/x/x/' }
        ],
        rhymeScheme: 'A',
        syllablePattern: [5],
        isMainChorus: true
      }
    ],
    metadata: {
      genre: 'epic',
      mood: 'grandiose',
      theme: 'adventure',
      version: 1,
      author: 'AI',
      tags: ['long', 'epic', 'adventure']
    },
    generatedAt: new Date()
  }

  console.log(`Original song has ${longSong.verses.length} verses`)

  // Trim to 500 characters by removing metadata
  const result = await formatter.trimToFit(
    longSong,
    500,
    TrimStrategy.REMOVE_METADATA
  )

  if (isSuccess(result)) {
    console.log('✅ Trimmed successfully!\n')
    console.log(`Original length: ${result.data.trimResult.originalLength}`)
    console.log(`Trimmed length: ${result.data.trimResult.trimmedLength}`)
    console.log(`Strategy used: ${result.data.trimResult.strategy}`)
    console.log(`Removed content: ${result.data.trimResult.removedContent.join(', ')}`)
    console.log(`Verses in trimmed song: ${result.data.song.verses.length}`)
  } else {
    console.error('❌ Trimming failed:', result.error.message)
  }
}

/**
 * Example 6: Validation
 */
async function example6_Validation() {
  console.log('\n\n=== Example 6: Format Validation ===\n')

  const formatter = new RealSunoFormatterService()

  // Test various formatted texts
  const testCases = [
    {
      name: 'Valid short text',
      text: '[Verse 1]\nSimple song\n\n[Chorus]\nSimple chorus'
    },
    {
      name: 'Text exceeding character limit',
      text: 'a'.repeat(3001)
    },
    {
      name: 'Text without section tags',
      text: 'Just plain text without any Suno tags'
    },
    {
      name: 'Empty text',
      text: ''
    }
  ]

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`)
    const result = await formatter.validateFormat(testCase.text, SunoVersion.V5_0)

    if (isSuccess(result)) {
      console.log(`  Valid: ${result.data.valid}`)
      console.log(`  Within limit: ${result.data.withinLimit}`)
      if (result.data.errors.length > 0) {
        console.log(`  Errors: ${result.data.errors.join(', ')}`)
      }
      if (result.data.warnings.length > 0) {
        console.log(`  Warnings: ${result.data.warnings.join(', ')}`)
      }
    }
    console.log()
  }
}

/**
 * Example 7: Complete Workflow
 */
async function example7_CompleteWorkflow() {
  console.log('\n\n=== Example 7: Complete Workflow ===\n')

  const formatter = new RealSunoFormatterService()

  // 1. Create song
  const song: Song = {
    id: createSongId('workflow-song'),
    title: 'Workflow Example',
    verses: [
      {
        id: createVerseId('v1'),
        number: 1,
        lines: [
          { text: 'Creating songs with AI', syllables: 6, stressPattern: 'x/x/x/' },
          { text: 'Making music come alive', syllables: 6, stressPattern: 'x/x/x/' }
        ],
        rhymeScheme: 'AA',
        syllablePattern: [6, 6]
      }
    ],
    choruses: [
      {
        id: createChorusId('c1'),
        lines: [
          { text: 'Format it for Suno', syllables: 6, stressPattern: 'x/x/x/' },
          { text: 'Watch the magic flow', syllables: 5, stressPattern: 'x/x/x/' }
        ],
        rhymeScheme: 'AA',
        syllablePattern: [6, 5],
        isMainChorus: true
      }
    ],
    metadata: {
      genre: 'electronic',
      mood: 'futuristic',
      theme: 'technology'
    },
    generatedAt: new Date()
  }

  console.log('Step 1: Get enhancement suggestions')
  const enhanceResult = await formatter.suggestEnhancements(song)
  if (isSuccess(enhanceResult)) {
    console.log(`  Found ${enhanceResult.data.length} suggestions`)
  }

  console.log('\nStep 2: Get tag suggestions')
  const tagResult = await formatter.suggestTags(song, {
    genre: 'electronic',
    tempo: TempoType.FAST
  })
  if (isSuccess(tagResult)) {
    console.log(`  Found ${tagResult.data.length} tag suggestions`)
  }

  console.log('\nStep 3: Format song')
  const formatResult = await formatter.formatSong(song, {
    version: SunoVersion.V5_0,
    includeTags: true,
    style: {
      genre: 'electronic',
      tempo: TempoType.FAST,
      mood: 'futuristic'
    },
    trimToFit: true
  })

  if (isSuccess(formatResult)) {
    console.log('  ✅ Formatted successfully!')
    console.log(`  Character count: ${formatResult.data.characterCount}`)

    console.log('\nStep 4: Validate format')
    const validateResult = await formatter.validateFormat(
      formatResult.data.formattedText,
      SunoVersion.V5_0
    )

    if (isSuccess(validateResult)) {
      console.log(`  Valid: ${validateResult.data.valid}`)
      console.log(`  Within limit: ${validateResult.data.withinLimit}`)
    }

    console.log('\nStep 5: Convert to v4.0 (for compatibility)')
    const convertResult = await formatter.convertVersion(
      formatResult.data.formattedText,
      SunoVersion.V5_0,
      SunoVersion.V4_0
    )

    if (isSuccess(convertResult)) {
      console.log('  ✅ Converted to v4.0')
      console.log('  Ready for older Suno versions!')
    }
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await example1_BasicFormatting()
    await example2_TagSuggestions()
    await example3_Enhancements()
    await example4_VersionConversion()
    await example5_Trimming()
    await example6_Validation()
    await example7_CompleteWorkflow()

    console.log('\n\n=== All Examples Complete! ===')
  } catch (error) {
    console.error('\n❌ Error running examples:', error)
    console.error('\nMake sure GEMINI_API_KEY environment variable is set!')
  }
}

// Export for use in other files
export {
  example1_BasicFormatting,
  example2_TagSuggestions,
  example3_Enhancements,
  example4_VersionConversion,
  example5_Trimming,
  example6_Validation,
  example7_CompleteWorkflow,
  runAllExamples
}

// Run if executed directly
if (require.main === module) {
  runAllExamples()
}
