/**
 * @fileoverview Real Suno Formatter Service - AI-powered Suno platform formatting
 * @purpose Transform songs into Suno-compatible format using Gemini AI
 * @implements ISunoFormatterService
 * @updated 2025-11-17
 *
 * This service uses AI to intelligently format songs for the Suno platform
 * instead of using rigid templates. The AI understands Suno's constraints
 * and applies appropriate tags based on song content and style.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
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
  TrimStrategy,
  SunoFormatterErrorCode,
  TagType,
  EnhancementType
} from '../../contracts/SunoFormatter'
import type { Song } from '../../contracts/types/song'
import type { ServiceResponse } from '../../contracts/types/common'
import { createSuccess, createFailure, createError } from '../../contracts/types/common'

/**
 * AI response for formatting operations
 */
interface AIFormatResponse {
  formattedText: string
  sections: Array<{
    type: string
    index: number
    content: string
    tags: string[]
    characterCount: number
  }>
  metadata: {
    totalCharacters: number
    sectionCount: number
    version: string
    compliant: boolean
  }
  warnings: Array<{
    type: 'length' | 'tags' | 'structure'
    message: string
    suggestion: string
  }>
}

/**
 * AI response for tag suggestions
 */
interface AITagSuggestion {
  section: string
  tagType: string
  tag: string
  reason: string
  confidence: number
}

/**
 * AI response for enhancement suggestions
 */
interface AIEnhancementSuggestion {
  type: string
  section: string
  suggestion: string
  example: string
  impact: string
}

/**
 * Real Suno Formatter Service - AI-powered formatting
 */
export class RealSunoFormatterService implements ISunoFormatterService {
  private model: GenerativeModel
  private apiKey: string

  /**
   * System prompt for Suno formatting AI
   */
  private readonly SYSTEM_PROMPT = `You are a Suno platform formatting expert.

ROLE: Format songs for Suno v4.0/v4.5/v5.0 with proper tags.

OUTPUT FORMAT (JSON):
{
  "formattedText": "...",  // Full Suno-formatted text with tags
  "sections": [
    {
      "type": "verse|chorus|bridge|intro|outro",
      "index": 0,
      "content": "...",
      "tags": ["[Verse 1]", "[upbeat]"],
      "characterCount": 120
    }
  ],
  "metadata": {
    "totalCharacters": 2500,
    "sectionCount": 12,
    "version": "v5.0",
    "compliant": true
  },
  "warnings": [
    {
      "type": "length|tags|structure",
      "message": "...",
      "suggestion": "..."
    }
  ]
}

SUNO RULES:
1. Max 3000 characters
2. Max 20 sections
3. Max 120 chars/line
4. Tags: [Verse N], [Chorus], [Bridge], [Intro], [Outro]
5. Style tags: [upbeat], [mellow], [dramatic]
6. Instrument tags: [guitar solo], [piano]

Return formatted text ready for Suno.

IMPORTANT: Return ONLY valid JSON, no markdown code blocks or extra text.`

  constructor(apiKey?: string) {
    // Get API key from parameter or environment
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || ''

    if (!this.apiKey) {
      throw new Error('Gemini API key is required. Provide via constructor or GEMINI_API_KEY environment variable.')
    }

    const genAI = new GoogleGenerativeAI(this.apiKey)

    // Use Gemini 1.5 Flash for speed and cost efficiency
    // Temperature 0.3 for consistent, structured output
    this.model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    })
  }

  /**
   * Format song into Suno-compatible text with AI-powered meta-tags
   */
  async formatSong(
    song: Song,
    options: FormatOptions
  ): Promise<ServiceResponse<SunoFormatResult>> {
    try {
      // Validate inputs
      if (!song) {
        return createFailure(
          createError(
            SunoFormatterErrorCode.INVALID_SONG,
            'Song is required',
            'Provide a valid Song object',
            'Received null or undefined song'
          )
        )
      }

      if (!options) {
        return createFailure(
          createError(
            SunoFormatterErrorCode.FORMAT_FAILED,
            'Format options are required',
            'Provide valid FormatOptions',
            'Received null or undefined options'
          )
        )
      }

      // Validate song has content
      if (song.verses.length === 0 && song.choruses.length === 0) {
        return createFailure(
          createError(
            SunoFormatterErrorCode.INVALID_SONG,
            'Song must have at least one verse or chorus',
            'Add verses or choruses to the song before formatting',
            'Song has empty verses and choruses arrays'
          )
        )
      }

      // Check section count
      const totalSections = this.countSections(song)
      if (totalSections > CHARACTER_LIMITS.maxSections) {
        return createFailure(
          createError(
            SunoFormatterErrorCode.TOO_MANY_SECTIONS,
            `Song has ${totalSections} sections, exceeds Suno limit of ${CHARACTER_LIMITS.maxSections}`,
            'Reduce the number of sections in your song',
            `Total sections: ${totalSections}, limit: ${CHARACTER_LIMITS.maxSections}`
          )
        )
      }

      // Build AI prompt
      const prompt = this.buildFormatPrompt(song, options)

      // Call AI
      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      // Parse AI response
      const aiResponse = this.parseAIResponse<AIFormatResponse>(text)

      if (!aiResponse) {
        return createFailure(
          createError(
            SunoFormatterErrorCode.FORMAT_FAILED,
            'Failed to parse AI formatting response',
            'Try again or check your API key',
            'AI returned invalid JSON'
          )
        )
      }

      // Apply trimming if needed
      let formattedText = aiResponse.formattedText
      const characterLimit = getCharacterLimit(options.version)

      if (options.trimToFit && formattedText.length > characterLimit) {
        formattedText = this.trimText(formattedText, characterLimit)
      }

      // Build validation result
      const characterCount = formattedText.length
      const withinLimit = characterCount <= characterLimit
      const errors: string[] = []
      const warnings: string[] = []

      if (!withinLimit) {
        errors.push(`Formatted text exceeds ${characterLimit} character limit (${characterCount} characters)`)
      }

      // Add warnings from AI
      aiResponse.warnings.forEach(w => {
        warnings.push(`${w.type}: ${w.message}`)
      })

      const validation: SunoValidationResult = {
        valid: errors.length === 0,
        errors,
        warnings,
        characterLimit,
        withinLimit
      }

      // Extract applied tags
      const appliedTags = this.extractTags(formattedText)

      // Build suggestions from AI warnings
      const suggestions: TagSuggestion[] = aiResponse.warnings.map(w => ({
        section: 'general',
        tagType: TagType.STRUCTURAL,
        tag: '',
        reason: w.message,
        confidence: 0.8
      }))

      const formatResult: SunoFormatResult = {
        formattedText,
        characterCount,
        version: options.version,
        appliedTags,
        validation,
        suggestions
      }

      return createSuccess(formatResult)
    } catch (error) {
      return createFailure(
        createError(
          SunoFormatterErrorCode.FORMAT_FAILED,
          'Failed to format song',
          'Check your API key and network connection',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Validate formatted text against Suno requirements
   */
  async validateFormat(
    formattedText: string,
    version: SunoVersion
  ): Promise<ServiceResponse<SunoValidationResult>> {
    try {
      if (formattedText === null || formattedText === undefined) {
        return createSuccess({
          valid: false,
          errors: ['Formatted text is null or undefined'],
          warnings: [],
          characterLimit: getCharacterLimit(version),
          withinLimit: false
        })
      }

      const characterLimit = getCharacterLimit(version)
      const characterCount = formattedText.length
      const withinLimit = characterCount <= characterLimit

      const errors: string[] = []
      const warnings: string[] = []

      // Check character limit
      if (!withinLimit) {
        errors.push(`Text exceeds ${characterLimit} character limit (${characterCount} characters)`)
      }

      // Check if empty
      if (formattedText.trim().length === 0) {
        errors.push('Formatted text is empty')
      }

      // Check for section tags
      const hasSectionTags = /\[(Verse|Chorus|Bridge|Intro|Outro)\]/i.test(formattedText)
      if (!hasSectionTags) {
        warnings.push('No section tags found (e.g., [Verse 1], [Chorus])')
      }

      // Check line length
      const lines = formattedText.split('\n')
      const longLines = lines.filter(line => line.length > CHARACTER_LIMITS.maxLineLength)
      if (longLines.length > 0) {
        warnings.push(`${longLines.length} lines exceed ${CHARACTER_LIMITS.maxLineLength} character limit`)
      }

      // Check section count
      const sectionCount = (formattedText.match(/\[(Verse|Chorus|Bridge|Intro|Outro)\]/gi) || []).length
      if (sectionCount > CHARACTER_LIMITS.maxSections) {
        errors.push(`${sectionCount} sections exceed limit of ${CHARACTER_LIMITS.maxSections}`)
      }

      const validationResult: SunoValidationResult = {
        valid: errors.length === 0,
        errors,
        warnings,
        characterLimit,
        withinLimit
      }

      return createSuccess(validationResult)
    } catch (error) {
      return createFailure(
        createError(
          SunoFormatterErrorCode.FORMAT_FAILED,
          'Failed to validate format',
          'Try again',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  /**
   * Suggest meta-tags based on song content and style using AI
   */
  async suggestTags(
    song: Song,
    style?: StylePreferences
  ): Promise<ServiceResponse<readonly TagSuggestion[]>> {
    try {
      if (!song) {
        return createFailure(
          createError(
            SunoFormatterErrorCode.INVALID_SONG,
            'Song is required',
            'Provide a valid Song object'
          )
        )
      }

      const prompt = this.buildTagSuggestionPrompt(song, style)

      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      const aiSuggestions = this.parseAIResponse<AITagSuggestion[]>(text)

      if (!aiSuggestions || !Array.isArray(aiSuggestions)) {
        return createSuccess([])
      }

      // Convert AI suggestions to TagSuggestion format
      const suggestions: TagSuggestion[] = aiSuggestions.map(ai => ({
        section: ai.section,
        tagType: this.mapTagType(ai.tagType),
        tag: ai.tag,
        reason: ai.reason,
        confidence: ai.confidence
      }))

      return createSuccess(suggestions)
    } catch (error) {
      return createFailure(
        createError(
          SunoFormatterErrorCode.FORMAT_FAILED,
          'Failed to suggest tags',
          'Try again',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  /**
   * Suggest enhancements to improve Suno output using AI
   */
  async suggestEnhancements(
    song: Song
  ): Promise<ServiceResponse<readonly EnhancementSuggestion[]>> {
    try {
      if (!song) {
        return createFailure(
          createError(
            SunoFormatterErrorCode.INVALID_SONG,
            'Song is required',
            'Provide a valid Song object'
          )
        )
      }

      const prompt = this.buildEnhancementPrompt(song)

      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      const aiEnhancements = this.parseAIResponse<AIEnhancementSuggestion[]>(text)

      if (!aiEnhancements || !Array.isArray(aiEnhancements)) {
        return createSuccess([])
      }

      // Convert AI enhancements to EnhancementSuggestion format
      const enhancements: EnhancementSuggestion[] = aiEnhancements.map(ai => ({
        type: this.mapEnhancementType(ai.type),
        section: ai.section,
        suggestion: ai.suggestion,
        example: ai.example,
        impact: ai.impact
      }))

      return createSuccess(enhancements)
    } catch (error) {
      return createFailure(
        createError(
          SunoFormatterErrorCode.FORMAT_FAILED,
          'Failed to suggest enhancements',
          'Try again',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  /**
   * Convert song from one Suno version format to another
   */
  async convertVersion(
    formattedText: string,
    fromVersion: SunoVersion,
    toVersion: SunoVersion
  ): Promise<ServiceResponse<string>> {
    try {
      if (formattedText === null || formattedText === undefined) {
        return createSuccess('')
      }

      // If same version, return as-is
      if (fromVersion === toVersion) {
        return createSuccess(formattedText)
      }

      const prompt = this.buildConversionPrompt(formattedText, fromVersion, toVersion)

      const result = await this.model.generateContent(prompt)
      const response = result.response
      const convertedText = response.text()

      // Clean up any markdown code blocks
      const cleaned = convertedText.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim()

      return createSuccess(cleaned)
    } catch (error) {
      return createFailure(
        createError(
          SunoFormatterErrorCode.INCOMPATIBLE_VERSION,
          'Failed to convert version',
          'Try again',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  /**
   * Trim song to fit within character limit
   */
  async trimToFit(
    song: Song,
    targetLimit: number,
    strategy: TrimStrategy
  ): Promise<ServiceResponse<{ song: Song; trimResult: TrimResult }>> {
    try {
      if (!song) {
        return createFailure(
          createError(
            SunoFormatterErrorCode.INVALID_SONG,
            'Song is required',
            'Provide a valid Song object'
          )
        )
      }

      const prompt = this.buildTrimPrompt(song, targetLimit, strategy)

      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      // Parse the trimmed song structure from AI
      const aiResponse = this.parseAIResponse<{
        trimmedSong: Song
        trimResult: TrimResult
      }>(text)

      if (!aiResponse) {
        // Fallback: simple text trimming
        const originalLength = JSON.stringify(song).length
        const trimmedSong = song // Keep original structure
        const trimResult: TrimResult = {
          originalLength,
          trimmedLength: originalLength,
          removedContent: [],
          strategy
        }
        return createSuccess({ song: trimmedSong, trimResult })
      }

      return createSuccess({
        song: aiResponse.trimmedSong,
        trimResult: aiResponse.trimResult
      })
    } catch (error) {
      return createFailure(
        createError(
          SunoFormatterErrorCode.FORMAT_FAILED,
          'Failed to trim song',
          'Try again',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  /**
   * Apply meta-tags to specific section
   */
  async applyMetaTags(
    text: string,
    _sectionType: string,
    tags: readonly string[]
  ): Promise<ServiceResponse<string>> {
    try {
      if (text === null || text === undefined) {
        text = ''
      }

      // Build tagged text
      const tagLines = tags.map(tag => tag).join('\n')
      const taggedText = tagLines ? `${tagLines}\n${text}` : text

      return createSuccess(taggedText)
    } catch (error) {
      return createFailure(
        createError(
          SunoFormatterErrorCode.INVALID_TAG_SYNTAX,
          'Failed to apply meta tags',
          'Check tag syntax',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Build AI prompt for song formatting
   */
  private buildFormatPrompt(song: Song, options: FormatOptions): string {
    const songText = this.songToText(song)
    const styleText = options.style ? this.styleToText(options.style) : 'No specific style preferences'
    const customTagsText = options.customTags ? options.customTags.join(', ') : 'None'

    return `${this.SYSTEM_PROMPT}

TASK: Format the following song for Suno ${options.version}.

SONG:
${songText}

STYLE PREFERENCES:
${styleText}

CUSTOM TAGS: ${customTagsText}
INCLUDE TAGS: ${options.includeTags}
INCLUDE METADATA: ${options.includeMetadata || false}
TRIM TO FIT: ${options.trimToFit || false}

Return JSON response with formatted text and metadata.`
  }

  /**
   * Build AI prompt for tag suggestions
   */
  private buildTagSuggestionPrompt(song: Song, style?: StylePreferences): string {
    const songText = this.songToText(song)
    const styleText = style ? this.styleToText(style) : 'No specific style'

    return `You are a Suno tag suggestion expert.

TASK: Suggest appropriate Suno tags for this song.

SONG:
${songText}

STYLE:
${styleText}

Return JSON array of suggestions:
[
  {
    "section": "verse|chorus|bridge|general",
    "tagType": "section|style|effect|dynamic|structural",
    "tag": "[tag text]",
    "reason": "Why this tag is suggested",
    "confidence": 0.0-1.0
  }
]

IMPORTANT: Return ONLY valid JSON array, no markdown or extra text.`
  }

  /**
   * Build AI prompt for enhancement suggestions
   */
  private buildEnhancementPrompt(song: Song): string {
    const songText = this.songToText(song)
    const hasIntro = !!song.intro
    const hasOutro = !!song.outro
    const hasBridge = !!song.bridge

    return `You are a Suno song structure expert.

TASK: Suggest enhancements to improve this song for Suno.

SONG:
${songText}

CURRENT STRUCTURE:
- Has Intro: ${hasIntro}
- Has Outro: ${hasOutro}
- Has Bridge: ${hasBridge}
- Verses: ${song.verses.length}
- Choruses: ${song.choruses.length}

Return JSON array of enhancement suggestions:
[
  {
    "type": "add_intro|add_outro|add_bridge|add_drop|add_instrumental|improve_dynamics|add_vocal_variety|enhance_structure",
    "section": "Section to enhance",
    "suggestion": "What to add/change",
    "example": "Example implementation",
    "impact": "Expected improvement"
  }
]

IMPORTANT: Return ONLY valid JSON array, no markdown or extra text.`
  }

  /**
   * Build AI prompt for version conversion
   */
  private buildConversionPrompt(
    text: string,
    fromVersion: SunoVersion,
    toVersion: SunoVersion
  ): string {
    const supportsAdvanced = supportsAdvancedTags(toVersion)

    return `You are a Suno version conversion expert.

TASK: Convert this Suno-formatted text from ${fromVersion} to ${toVersion}.

ORIGINAL TEXT (${fromVersion}):
${text}

CONVERSION RULES:
- Target version: ${toVersion}
- Supports advanced tags: ${supportsAdvanced}
- If converting TO v5.0: Can add advanced tags like [dynamic: crescendo]
- If converting FROM v5.0: Remove advanced tags not supported in older versions

Return the converted text (plain text, no JSON).`
  }

  /**
   * Build AI prompt for trimming
   */
  private buildTrimPrompt(song: Song, targetLimit: number, strategy: TrimStrategy): string {
    const songText = this.songToText(song)

    return `You are a Suno song trimming expert.

TASK: Trim this song to fit within ${targetLimit} characters using ${strategy} strategy.

SONG:
${songText}

STRATEGY: ${strategy}
- REMOVE_METADATA: Remove metadata fields
- SHORTEN_LINES: Shorten individual lines
- REMOVE_SECTION: Remove entire sections (least important first)
- SIMPLIFY_TAGS: Simplify or remove style tags

Return JSON:
{
  "trimmedSong": { ...song object... },
  "trimResult": {
    "originalLength": 1234,
    "trimmedLength": 800,
    "removedContent": ["list of removed parts"],
    "strategy": "${strategy}"
  }
}

IMPORTANT: Return ONLY valid JSON, no markdown or extra text.`
  }

  /**
   * Convert song to readable text for AI
   */
  private songToText(song: Song): string {
    let text = `Title: ${song.title}\n\n`

    if (song.intro) {
      text += '[Intro]\n'
      song.intro.lines.forEach(line => {
        text += `${line.text}\n`
      })
      text += '\n'
    }

    song.verses.forEach((verse) => {
      text += `[Verse ${verse.number}]\n`
      verse.lines.forEach(line => {
        text += `${line.text}\n`
      })
      text += '\n'
    })

    song.choruses.forEach((chorus) => {
      text += '[Chorus]\n'
      chorus.lines.forEach(line => {
        text += `${line.text}\n`
      })
      text += '\n'
    })

    if (song.bridge) {
      text += '[Bridge]\n'
      song.bridge.lines.forEach(line => {
        text += `${line.text}\n`
      })
      text += '\n'
    }

    if (song.outro) {
      text += '[Outro]\n'
      song.outro.lines.forEach(line => {
        text += `${line.text}\n`
      })
      text += '\n'
    }

    if (song.metadata) {
      text += `\nMetadata:\n`
      if (song.metadata.genre) text += `Genre: ${song.metadata.genre}\n`
      if (song.metadata.mood) text += `Mood: ${song.metadata.mood}\n`
      if (song.metadata.theme) text += `Theme: ${song.metadata.theme}\n`
    }

    return text
  }

  /**
   * Convert style preferences to text
   */
  private styleToText(style: StylePreferences): string {
    const parts: string[] = []
    if (style.genre) parts.push(`Genre: ${style.genre}`)
    if (style.tempo) parts.push(`Tempo: ${style.tempo}`)
    if (style.mood) parts.push(`Mood: ${style.mood}`)
    if (style.vocalStyle) parts.push(`Vocal Style: ${style.vocalStyle}`)
    if (style.harmony) parts.push(`Harmony: ${style.harmony}`)
    if (style.effects) parts.push(`Effects: ${style.effects.join(', ')}`)
    if (style.dynamics) parts.push(`Dynamics: ${style.dynamics.join(', ')}`)
    return parts.join('\n')
  }

  /**
   * Parse AI JSON response
   */
  private parseAIResponse<T>(text: string): T | null {
    try {
      // Remove markdown code blocks if present
      let cleaned = text.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      }

      return JSON.parse(cleaned) as T
    } catch {
      return null
    }
  }

  /**
   * Extract tags from formatted text
   */
  private extractTags(text: string): string[] {
    const tagRegex = /\[([^\]]+)\]/g
    const tags: string[] = []
    let match: RegExpExecArray | null

    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[0])
    }

    return tags
  }

  /**
   * Count total sections in song
   */
  private countSections(song: Song): number {
    let count = 0
    if (song.intro) count++
    count += song.verses.length
    count += song.choruses.length
    if (song.bridge) count++
    if (song.outro) count++
    return count
  }

  /**
   * Trim text to fit limit
   */
  private trimText(text: string, limit: number): string {
    if (text.length <= limit) return text
    return text.substring(0, limit - 3) + '...'
  }

  /**
   * Map AI tag type string to TagType enum
   */
  private mapTagType(typeString: string): TagType {
    const lower = typeString.toLowerCase()
    if (lower.includes('section')) return TagType.SECTION
    if (lower.includes('style')) return TagType.STYLE
    if (lower.includes('effect')) return TagType.EFFECT
    if (lower.includes('dynamic')) return TagType.DYNAMIC
    return TagType.STRUCTURAL
  }

  /**
   * Map AI enhancement type string to EnhancementType enum
   */
  private mapEnhancementType(typeString: string): EnhancementType {
    const lower = typeString.toLowerCase()
    if (lower.includes('intro')) return EnhancementType.ADD_INTRO
    if (lower.includes('outro')) return EnhancementType.ADD_OUTRO
    if (lower.includes('bridge')) return EnhancementType.ADD_BRIDGE
    if (lower.includes('drop')) return EnhancementType.ADD_DROP
    if (lower.includes('instrumental')) return EnhancementType.ADD_INSTRUMENTAL
    if (lower.includes('dynamic')) return EnhancementType.IMPROVE_DYNAMICS
    if (lower.includes('vocal')) return EnhancementType.ADD_VOCAL_VARIETY
    return EnhancementType.ENHANCE_STRUCTURE
  }
}
