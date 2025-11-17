/**
 * @fileoverview Mock Implementation of Suno Formatter Service
 * @purpose Provide realistic mock for UI development and testing
 * @phase Phase 3 - BUILD (TDD)
 * @updated 2025-11-15
 *
 * This mock implementation:
 * - Formats songs using template-based formatting (no AI)
 * - Supports Suno v4.0, v4.5, and v5.0 formats
 * - Enforces 3000 character limit
 * - Returns realistic data that matches the contract exactly
 * - Handles all error cases defined in the contract
 * - Never throws exceptions - always returns ServiceResponse
 * - Uses readonly properties correctly (build values BEFORE creating objects)
 * - Passes all tests in SunoFormatter.test.ts
 */

import type {
  ISunoFormatterService,
  SunoFormatResult,
  SunoValidationResult,
  FormatOptions,
  StylePreferences,
  TagSuggestion,
  EnhancementSuggestion,
  TrimResult
} from '../../contracts/SunoFormatter'
import {
  SunoVersion,
  CHARACTER_LIMITS,
  getCharacterLimit,
  supportsAdvancedTags,
  formatStyleTag,
  formatSectionTag,
  HarmonyPreference,
  TrimStrategy,
  SunoFormatterErrorCode,
  TagType,
  EnhancementType
} from '../../contracts/SunoFormatter'
import {
  createSuccess,
  createFailure,
  createError,
  type ServiceResponse
} from '../../contracts/types/common'
import type { Song } from '../../contracts/types/song'

/**
 * Mock implementation of Suno Formatter Service
 *
 * Formats songs into Suno-compatible text with meta-tags.
 * This mock provides realistic formatting behavior for testing and UI development.
 */
export class MockSunoFormatterService implements ISunoFormatterService {
  /**
   * Format song into Suno-compatible text with meta-tags
   */
  async formatSong(
    song: Song,
    options: FormatOptions
  ): Promise<ServiceResponse<SunoFormatResult>> {
    // Validate inputs
    if (!song || typeof song !== 'object') {
      return createFailure(
        createError(
          SunoFormatterErrorCode.INVALID_SONG,
          'Song is required',
          'Please provide a valid song object'
        )
      )
    }

    if (!options || typeof options !== 'object') {
      return createFailure(
        createError(
          SunoFormatterErrorCode.FORMAT_FAILED,
          'Format options are required',
          'Please provide valid format options'
        )
      )
    }

    // Check if song has content
    if ((!song.verses || song.verses.length === 0) &&
        (!song.choruses || song.choruses.length === 0)) {
      return createFailure(
        createError(
          SunoFormatterErrorCode.INVALID_SONG,
          'Song must have at least one verse or chorus',
          'Please provide a song with verses or choruses'
        )
      )
    }

    // Check section count - warn but don't fail
    const totalSections = (song.verses?.length || 0) +
                         (song.choruses?.length || 0) +
                         (song.bridge ? 1 : 0) +
                         (song.intro ? 1 : 0) +
                         (song.outro ? 1 : 0)

    const sectionWarnings: string[] = []
    if (totalSections > CHARACTER_LIMITS.maxSections) {
      sectionWarnings.push(`Song has ${totalSections} sections, exceeding recommended maximum of ${CHARACTER_LIMITS.maxSections}`)
    }

    // Build formatted text
    const parts: string[] = []
    const appliedTags: string[] = []

    // Add metadata if requested
    if (options.includeMetadata && song.title) {
      parts.push(`# ${song.title}`)
      parts.push('')
    }

    // Add style tags if requested
    if (options.includeTags && options.style) {
      const styleTags = this.buildStyleTags(options.style, options.version)
      styleTags.forEach(tag => {
        parts.push(tag)
        appliedTags.push(tag)
      })
      if (styleTags.length > 0) {
        parts.push('')
      }
    }

    // Add custom tags if provided
    if (options.customTags && options.customTags.length > 0) {
      options.customTags.forEach(tag => {
        parts.push(tag)
        appliedTags.push(tag)
      })
      parts.push('')
    }

    // Format intro
    if (song.intro) {
      const introTag = '[Intro]'
      parts.push(introTag)
      appliedTags.push(introTag)
      song.intro.lines.forEach(line => parts.push(line.text))
      parts.push('')
    }

    // Format verses and choruses in typical song structure
    const maxVerses = song.verses.length
    const hasChorus = song.choruses.length > 0

    for (let i = 0; i < maxVerses; i++) {
      // Add verse
      const verse = song.verses[i]
      if (verse) {
        const verseTag = formatSectionTag('Verse', verse.number)
        parts.push(verseTag)
        appliedTags.push(verseTag)
        verse.lines.forEach(line => parts.push(line.text))
        parts.push('')
      }

      // Add chorus after each verse (typical structure)
      if (hasChorus && (i === 0 || i === maxVerses - 1 || i === Math.floor(maxVerses / 2))) {
        const chorus = song.choruses.find(c => c.isMainChorus) || song.choruses[0]
        if (chorus) {
          const chorusTag = '[Chorus]'
          parts.push(chorusTag)
          if (!appliedTags.includes(chorusTag)) {
            appliedTags.push(chorusTag)
          }
          chorus.lines.forEach(line => parts.push(line.text))
          parts.push('')
        }
      }

      // Add bridge after middle verse
      if (song.bridge && i === Math.floor(maxVerses / 2)) {
        const bridgeTag = '[Bridge]'
        parts.push(bridgeTag)
        appliedTags.push(bridgeTag)
        song.bridge.lines.forEach(line => parts.push(line.text))
        parts.push('')
      }
    }

    // Format outro
    if (song.outro) {
      const outroTag = '[Outro]'
      parts.push(outroTag)
      appliedTags.push(outroTag)
      song.outro.lines.forEach(line => parts.push(line.text))
      parts.push('')
    }

    // Join all parts
    let formattedText = parts.join('\n').trim()

    // Check character limit
    const characterCount = formattedText.length
    const characterLimit = getCharacterLimit(options.version)

    // Auto-trim if requested and over limit
    if (options.trimToFit && characterCount > characterLimit) {
      // Try multiple strategies in order of preference
      const strategies = [
        TrimStrategy.SIMPLIFY_TAGS,
        TrimStrategy.REMOVE_METADATA,
        TrimStrategy.REMOVE_SECTION,
        TrimStrategy.SHORTEN_LINES
      ]

      for (const strategy of strategies) {
        const trimResult = await this.trimToFit(song, characterLimit, strategy)
        if (trimResult.success && trimResult.data.trimResult.trimmedLength <= characterLimit) {
          // Re-format the trimmed song
          const reformatResult = await this.formatSong(trimResult.data.song, {
            ...options,
            includeTags: strategy !== TrimStrategy.SIMPLIFY_TAGS, // Remove tags if that was the strategy
            trimToFit: false // Prevent infinite loop
          })
          if (reformatResult.success && reformatResult.data.characterCount <= characterLimit) {
            return reformatResult
          }
        }
      }
      // If all trimming strategies failed, continue with validation warnings
    }

    // Build validation result
    const withinLimit = characterCount <= characterLimit
    const errors: string[] = []
    const warnings: string[] = [...sectionWarnings]

    if (!withinLimit && !options.trimToFit) {
      warnings.push(`Character count ${characterCount} exceeds limit of ${characterLimit}`)
    }

    // Check for missing section tags
    if (!formattedText.includes('[Verse') && !formattedText.includes('[Chorus]')) {
      warnings.push('No section tags found in formatted text')
    }

    const validation: SunoValidationResult = Object.freeze({
      valid: withinLimit && errors.length === 0,
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings),
      characterLimit,
      withinLimit
    })

    // Build suggestions
    const suggestions = await this.suggestTags(song, options.style)
    const suggestionList = suggestions.success ? suggestions.data : []

    // Build the format result
    const formatResult: SunoFormatResult = Object.freeze({
      formattedText,
      characterCount,
      version: options.version,
      appliedTags: Object.freeze(appliedTags),
      validation,
      suggestions: Object.freeze(suggestionList)
    })

    return createSuccess(formatResult)
  }

  /**
   * Validate formatted text against Suno requirements
   */
  async validateFormat(
    formattedText: string,
    version: SunoVersion
  ): Promise<ServiceResponse<SunoValidationResult>> {
    // Handle null/undefined
    if (formattedText === null || formattedText === undefined) {
      formattedText = ''
    }

    const characterLimit = getCharacterLimit(version)
    const characterCount = formattedText.length
    const withinLimit = characterCount <= characterLimit

    const errors: string[] = []
    const warnings: string[] = []

    // Check if empty
    if (formattedText.length === 0) {
      errors.push('Formatted text is empty')
    }

    // Check character limit
    if (!withinLimit) {
      errors.push(`Character count ${characterCount} exceeds limit of ${characterLimit}`)
    }

    // Check for section tags
    const hasSectionTags = /\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Drop|Break|Instrumental)\s?\d?\]/i.test(formattedText)
    if (!hasSectionTags && formattedText.length > 0) {
      warnings.push('No section tags found - consider adding [Verse], [Chorus], etc.')
    }

    // Check for lines that are too long
    const lines = formattedText.split('\n')
    const longLines = lines.filter(line => line.length > CHARACTER_LIMITS.maxLineLength)
    if (longLines.length > 0) {
      warnings.push(`${longLines.length} line(s) exceed maximum length of ${CHARACTER_LIMITS.maxLineLength} characters`)
    }

    const validation: SunoValidationResult = Object.freeze({
      valid: errors.length === 0 && withinLimit,
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings),
      characterLimit,
      withinLimit
    })

    return createSuccess(validation)
  }

  /**
   * Suggest meta-tags based on song content and style
   */
  async suggestTags(
    song: Song,
    style?: StylePreferences
  ): Promise<ServiceResponse<readonly TagSuggestion[]>> {
    // Validate song
    if (!song || typeof song !== 'object') {
      return createFailure(
        createError(
          SunoFormatterErrorCode.INVALID_SONG,
          'Song is required',
          'Please provide a valid song object'
        )
      )
    }

    const suggestions: TagSuggestion[] = []

    // Suggest genre tag
    if (style?.genre) {
      suggestions.push({
        section: 'header',
        tagType: TagType.STYLE,
        tag: formatStyleTag('genre', style.genre),
        reason: `Genre "${style.genre}" specified in style preferences`,
        confidence: 1.0
      })
    } else if (song.metadata?.genre) {
      suggestions.push({
        section: 'header',
        tagType: TagType.STYLE,
        tag: formatStyleTag('genre', song.metadata.genre),
        reason: `Genre "${song.metadata.genre}" found in song metadata`,
        confidence: 0.9
      })
    }

    // Suggest tempo tag
    if (style?.tempo) {
      suggestions.push({
        section: 'header',
        tagType: TagType.STYLE,
        tag: formatStyleTag('tempo', style.tempo),
        reason: `Tempo "${style.tempo}" specified in style preferences`,
        confidence: 1.0
      })
    }

    // Suggest mood tag
    if (style?.mood) {
      suggestions.push({
        section: 'header',
        tagType: TagType.STYLE,
        tag: formatStyleTag('mood', style.mood),
        reason: `Mood "${style.mood}" specified in style preferences`,
        confidence: 1.0
      })
    } else if (song.metadata?.mood) {
      suggestions.push({
        section: 'header',
        tagType: TagType.STYLE,
        tag: formatStyleTag('mood', song.metadata.mood),
        reason: `Mood "${song.metadata.mood}" found in song metadata`,
        confidence: 0.8
      })
    }

    // Suggest vocal style tag
    if (style?.vocalStyle) {
      suggestions.push({
        section: 'header',
        tagType: TagType.STYLE,
        tag: formatStyleTag('vocal-style', style.vocalStyle),
        reason: `Vocal style "${style.vocalStyle}" specified`,
        confidence: 1.0
      })
    }

    // Suggest harmony tag
    if (style?.harmony && style.harmony !== HarmonyPreference.NONE) {
      suggestions.push({
        section: 'header',
        tagType: TagType.STYLE,
        tag: formatStyleTag('harmony', style.harmony),
        reason: `Harmony "${style.harmony}" specified`,
        confidence: 1.0
      })
    }

    // Suggest effect tags
    if (style?.effects && style.effects.length > 0) {
      style.effects.forEach(effect => {
        suggestions.push({
          section: 'header',
          tagType: TagType.EFFECT,
          tag: formatStyleTag('effect', effect),
          reason: `Effect "${effect}" specified`,
          confidence: 1.0
        })
      })
    }

    // Suggest dynamic tags
    if (style?.dynamics && style.dynamics.length > 0) {
      style.dynamics.forEach((dynamic, index) => {
        const section = index === 0 ? 'intro' : index === style.dynamics!.length - 1 ? 'outro' : 'bridge'
        suggestions.push({
          section,
          tagType: TagType.DYNAMIC,
          tag: formatStyleTag('dynamic', dynamic),
          reason: `Dynamic "${dynamic}" specified for ${section}`,
          confidence: 0.9
        })
      })
    }

    return createSuccess(suggestions)
  }

  /**
   * Suggest enhancements to improve Suno output
   */
  async suggestEnhancements(
    song: Song
  ): Promise<ServiceResponse<readonly EnhancementSuggestion[]>> {
    // Validate song
    if (!song || typeof song !== 'object') {
      return createFailure(
        createError(
          SunoFormatterErrorCode.INVALID_SONG,
          'Song is required',
          'Please provide a valid song object'
        )
      )
    }

    const suggestions: EnhancementSuggestion[] = []

    // Suggest intro if missing
    if (!song.intro) {
      suggestions.push({
        type: EnhancementType.ADD_INTRO,
        section: 'intro',
        suggestion: 'Add an intro to set the mood before the first verse',
        example: '[Intro]\nInstrumental buildup or atmospheric sounds',
        impact: 'Creates a strong opening and builds anticipation'
      })
    }

    // Suggest outro if missing
    if (!song.outro) {
      suggestions.push({
        type: EnhancementType.ADD_OUTRO,
        section: 'outro',
        suggestion: 'Add an outro to provide a satisfying conclusion',
        example: '[Outro]\nFade out on the chorus or add a final melodic phrase',
        impact: 'Provides closure and leaves a lasting impression'
      })
    }

    // Suggest bridge if missing
    if (!song.bridge) {
      suggestions.push({
        type: EnhancementType.ADD_BRIDGE,
        section: 'bridge',
        suggestion: 'Add a bridge to provide contrast and maintain interest',
        example: '[Bridge]\nA different perspective or emotional shift',
        impact: 'Breaks up repetition and adds musical variety'
      })
    }

    // Suggest dynamics if song seems static
    if (song.verses.length > 2 && !song.bridge) {
      suggestions.push({
        type: EnhancementType.IMPROVE_DYNAMICS,
        section: 'overall',
        suggestion: 'Add dynamic variations to prevent monotony',
        example: 'Use [crescendo] or [diminuendo] tags in strategic places',
        impact: 'Creates emotional peaks and valleys'
      })
    }

    return createSuccess(suggestions)
  }

  /**
   * Convert song from one Suno version format to another
   */
  async convertVersion(
    formattedText: string,
    fromVersion: SunoVersion,
    toVersion: SunoVersion
  ): Promise<ServiceResponse<string>> {
    // Handle null/undefined
    if (formattedText === null || formattedText === undefined) {
      return createSuccess('')
    }

    // Handle empty string
    if (formattedText.length === 0) {
      return createSuccess('')
    }

    // If same version, return as-is
    if (fromVersion === toVersion) {
      return createSuccess(formattedText)
    }

    let converted = formattedText

    // Converting TO v4.0 or v4.5 (remove v5.0-only features)
    if ((toVersion === SunoVersion.V4_0 || toVersion === SunoVersion.V4_5) &&
        fromVersion === SunoVersion.V5_0) {
      // Remove v5.0-only tags (dynamics, advanced features)
      converted = converted.replace(/\[dynamic:\s*[^\]]+\]/gi, '')
      converted = converted.replace(/\[key-change:\s*[^\]]+\]/gi, '')
      converted = converted.replace(/\[tempo-change:\s*[^\]]+\]/gi, '')
      converted = converted.replace(/\[beat-drop\]/gi, '')

      // Clean up extra blank lines
      converted = converted.replace(/\n{3,}/g, '\n\n')
    }

    // Converting TO v5.0 (no changes needed, v5.0 supports everything)
    // Just return the text as-is

    return createSuccess(converted.trim())
  }

  /**
   * Trim song to fit within character limit
   */
  async trimToFit(
    song: Song,
    targetLimit: number,
    strategy: TrimStrategy
  ): Promise<ServiceResponse<{ song: Song; trimResult: TrimResult }>> {
    // Validate song
    if (!song || typeof song !== 'object') {
      return createFailure(
        createError(
          SunoFormatterErrorCode.INVALID_SONG,
          'Song is required',
          'Please provide a valid song object'
        )
      )
    }

    // Format original to get character count
    const originalFormat = await this.formatSong(song, {
      version: SunoVersion.V5_0,
      includeTags: true,
      trimToFit: false
    })

    if (!originalFormat.success) {
      return createFailure(originalFormat.error)
    }

    const originalLength = originalFormat.data.characterCount

    // If already within limit, return original
    if (originalLength <= targetLimit) {
      const trimResult: TrimResult = Object.freeze({
        originalLength,
        trimmedLength: originalLength,
        removedContent: Object.freeze([]),
        strategy
      })

      return createSuccess({
        song,
        trimResult
      })
    }

    // Apply trimming strategy
    let trimmedSong = { ...song }
    const removedContent: string[] = []

    switch (strategy) {
      case TrimStrategy.REMOVE_METADATA:
        // Remove metadata, title, optional sections, and reduce chorus repetition
        removedContent.push('metadata')
        // Keep only one chorus with fewer lines if needed to hit target
        const targetRatioMeta = targetLimit / originalLength
        const firstChorus = song.choruses[0]
        const chorusLinesToKeep = firstChorus
          ? Math.max(1, Math.floor(firstChorus.lines.length * targetRatioMeta))
          : 1

        trimmedSong = {
          ...trimmedSong,
          title: '',
          metadata: {},
          intro: undefined,
          outro: undefined,
          bridge: undefined,
          choruses: song.choruses.slice(0, 1).map(c => ({
            ...c,
            lines: c.lines.slice(0, chorusLinesToKeep)
          }))
        }
        break

      case TrimStrategy.REMOVE_SECTION:
        // Remove optional sections (outro first, then intro, then bridge)
        if (song.outro) {
          removedContent.push('outro')
          trimmedSong = {
            ...trimmedSong,
            outro: undefined
          }
        }
        if (song.intro) {
          removedContent.push('intro')
          trimmedSong = {
            ...trimmedSong,
            intro: undefined
          }
        }
        if (song.bridge) {
          removedContent.push('bridge')
          trimmedSong = {
            ...trimmedSong,
            bridge: undefined
          }
        }
        break

      case TrimStrategy.SHORTEN_LINES:
        // Aggressively reduce content - remove verses and/or lines
        // Use a more aggressive ratio to ensure we hit the target
        const targetRatio = (targetLimit / originalLength) * 0.8 // 80% of calculated ratio for safety margin

        // First, try to reduce number of verses
        let versesToKeep = Math.max(1, Math.floor(song.verses.length * targetRatio))

        // If we need to trim more, reduce lines per verse
        const newVerses = song.verses.slice(0, versesToKeep).map(verse => {
          const linesToKeep = Math.max(1, Math.floor(verse.lines.length * targetRatio))
          if (linesToKeep < verse.lines.length) {
            removedContent.push(`${verse.lines.length - linesToKeep} lines from verse ${verse.number}`)
          }
          return {
            ...verse,
            lines: verse.lines.slice(0, linesToKeep)
          }
        })

        // Also reduce choruses
        const newChoruses = song.choruses.slice(0, 1).map(chorus => {
          const linesToKeep = Math.max(1, Math.floor(chorus.lines.length * targetRatio))
          return {
            ...chorus,
            lines: chorus.lines.slice(0, linesToKeep)
          }
        })

        if (song.verses.length > versesToKeep) {
          removedContent.push(`${song.verses.length - versesToKeep} verses`)
        }

        trimmedSong = {
          ...trimmedSong,
          verses: newVerses,
          choruses: newChoruses,
          bridge: undefined,
          intro: undefined,
          outro: undefined
        }
        break

      case TrimStrategy.SIMPLIFY_TAGS:
        // This is handled in formatting - just note it
        removedContent.push('style tags')
        break
    }

    // Re-format to get new length
    const trimmedFormat = await this.formatSong(trimmedSong, {
      version: SunoVersion.V5_0,
      includeTags: strategy !== TrimStrategy.SIMPLIFY_TAGS,
      trimToFit: false
    })

    const trimmedLength = trimmedFormat.success ?
      trimmedFormat.data.characterCount : originalLength

    const trimResult: TrimResult = Object.freeze({
      originalLength,
      trimmedLength,
      removedContent: Object.freeze(removedContent),
      strategy
    })

    return createSuccess({
      song: trimmedSong,
      trimResult
    })
  }

  /**
   * Apply meta-tags to specific section
   */
  async applyMetaTags(
    text: string,
    _sectionType: string,
    tags: readonly string[]
  ): Promise<ServiceResponse<string>> {
    // Handle null/undefined
    if (text === null || text === undefined) {
      text = ''
    }

    // Handle empty tags
    if (!tags || tags.length === 0) {
      return createSuccess(text)
    }

    // Build tagged text
    const parts: string[] = []

    // Add tags first
    tags.forEach(tag => parts.push(tag))

    // Add original text if not empty
    if (text.length > 0) {
      parts.push(text)
    }

    return createSuccess(parts.join('\n'))
  }

  /**
   * Private helper to build style tags
   */
  private buildStyleTags(style: StylePreferences, version: SunoVersion): string[] {
    const tags: string[] = []

    // Genre
    if (style.genre) {
      tags.push(formatStyleTag('genre', style.genre))
    }

    // Tempo
    if (style.tempo) {
      tags.push(formatStyleTag('tempo', style.tempo))
    }

    // Mood
    if (style.mood) {
      tags.push(formatStyleTag('mood', style.mood))
    }

    // Vocal style
    if (style.vocalStyle) {
      tags.push(formatStyleTag('vocal-style', style.vocalStyle))
    }

    // Harmony
    if (style.harmony && style.harmony !== HarmonyPreference.NONE) {
      tags.push(formatStyleTag('harmony', style.harmony))
    }

    // Effects (v5.0+)
    if (style.effects && supportsAdvancedTags(version)) {
      style.effects.forEach(effect => {
        tags.push(formatStyleTag('effect', effect))
      })
    }

    // Dynamics (v5.0 only)
    if (style.dynamics && version === SunoVersion.V5_0) {
      style.dynamics.forEach(dynamic => {
        tags.push(formatStyleTag('dynamic', dynamic))
      })
    }

    return tags
  }
}
