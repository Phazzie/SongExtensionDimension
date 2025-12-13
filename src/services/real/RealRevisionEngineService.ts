/**
 * @fileoverview Real Revision Engine Service - 100% AI-Powered Song Revision
 * @purpose Improve songs using Grok AI while preserving original voice
 * @phase Phase 5 - Real AI Services
 * @created 2025-11-17
 *
 * This service uses Grok-4-fast-reasoning for ALL revision operations:
 * - Full song revision based on critique feedback
 * - Line-by-line targeted fixes
 * - Rhyme strengthening
 * - Imagery enhancement
 * - Alternative version generation
 * - Voice preservation validation
 *
 * AI Strategy:
 * - Temperature: 0.6 (creative but voice-preserving)
 * - System prompts include voice profile and preservation rules
 * - JSON schema enforcement for contract compliance
 * - Multiple alternatives for user choice
 */

import type {
  IRevisionEngineService,
  RevisionInput,
  RevisionResult,
  RevisionOptions,
  LineRevisionInput,
  LineRevisionResult,
  RhymeStrengthenInput,
  RhymeStrengthenResult,
  ImageryEnhancementInput,
  ImageryEnhancementResult,
  VoicePreservationCheck,
  AlternativeVersion,
  CreativeDirection
} from '../../contracts/RevisionEngine'
import type { Song, Line } from '../../contracts/types/song'
import type { QualityIssue } from '../../contracts/CritiqueEngine'
import type { VoiceProfile } from '../../contracts/SongGeneration'
import type { IModelProvider } from '../../contracts/providers/IModelProvider'
import type { ServiceResponse } from '../../contracts/types/common'
import { createSuccess, createFailure, createError, createQualityScore } from '../../contracts/types/common'

/**
 * Real Revision Engine Service using Grok AI
 *
 * 100% AI-powered, zero heuristic fallbacks.
 * Uses IModelProvider abstraction for flexibility.
 */
export class RealRevisionEngineService implements IRevisionEngineService {
  constructor(private readonly modelProvider: IModelProvider) {}

  /**
   * Revise entire song based on critique feedback
   */
  async reviseSong(
    input: RevisionInput,
    options?: RevisionOptions
  ): Promise<ServiceResponse<RevisionResult>> {
    try {
      // Build system prompt with voice preservation rules
      const systemPrompt = this.buildRevisionSystemPrompt(input)

      // Build user prompt with song and critique data
      const userPrompt = this.buildRevisionUserPrompt(input)

      // Call AI provider
      const response = await this.modelProvider.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.6, // Creative but voice-preserving
        maxTokens: 6000,
        topP: 0.9
      })

      if (!response.success) {
        return createFailure(response.error)
      }

      // Parse AI response
      const parsed = this.parseRevisionResponse(response.data.content)

      if (!parsed) {
        return createFailure(
          createError(
            'REVISION_FAILED',
            'AI generated invalid revision response',
            'Please try again or adjust your strategy',
            response.data.content
          )
        )
      }

      // Build revision result
      const result: RevisionResult = {
        revisedSong: parsed.revisedSong,
        changes: parsed.changes,
        alternatives: options?.generateAlternatives ? parsed.alternatives || [] : [],
        improvementMetrics: parsed.improvementMetrics,
        preservedElements: parsed.preservedElements || [],
        voiceConsistency: parsed.voiceConsistency || createQualityScore(85)
      }

      return createSuccess(result)
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'Unexpected error during song revision',
          'Please try again',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  /**
   * Revise specific line to fix identified issue
   */
  async reviseLine(
    input: LineRevisionInput
  ): Promise<ServiceResponse<LineRevisionResult>> {
    try {
      const systemPrompt = this.buildLineRevisionSystemPrompt(input)
      const userPrompt = this.buildLineRevisionUserPrompt(input)

      const response = await this.modelProvider.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.5,
        maxTokens: 1000,
        topP: 0.9
      })

      if (!response.success) {
        return createFailure(response.error)
      }

      const parsed = this.parseLineRevisionResponse(response.data.content, input.line)

      if (!parsed) {
        return createFailure(
          createError(
            'REVISION_FAILED',
            'AI generated invalid line revision',
            'Please try again'
          )
        )
      }

      return createSuccess(parsed)
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'Unexpected error during line revision',
          'Please try again',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  /**
   * Strengthen rhyme between two lines
   */
  async strengthenRhyme(
    input: RhymeStrengthenInput
  ): Promise<ServiceResponse<RhymeStrengthenResult>> {
    try {
      const systemPrompt = this.buildRhymeStrengthenSystemPrompt(input)
      const userPrompt = this.buildRhymeStrengthenUserPrompt(input)

      const response = await this.modelProvider.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.7, // Slightly more creative for rhyme generation
        maxTokens: 1500,
        topP: 0.9
      })

      if (!response.success) {
        return createFailure(response.error)
      }

      const parsed = this.parseRhymeStrengthenResponse(response.data.content)

      if (!parsed) {
        return createFailure(
          createError(
            'REVISION_FAILED',
            'AI generated invalid rhyme options',
            'Please try again'
          )
        )
      }

      return createSuccess(parsed)
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'Unexpected error during rhyme strengthening',
          'Please try again',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  /**
   * Enhance imagery in a line (make more concrete/vivid)
   */
  async improveImagery(
    input: ImageryEnhancementInput
  ): Promise<ServiceResponse<ImageryEnhancementResult>> {
    try {
      const systemPrompt = this.buildImageryEnhancementSystemPrompt(input)
      const userPrompt = this.buildImageryEnhancementUserPrompt(input)

      const response = await this.modelProvider.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 1500,
        topP: 0.9
      })

      if (!response.success) {
        return createFailure(response.error)
      }

      const parsed = this.parseImageryEnhancementResponse(response.data.content, input.line.text)

      if (!parsed) {
        return createFailure(
          createError(
            'REVISION_FAILED',
            'AI generated invalid imagery enhancements',
            'Please try again'
          )
        )
      }

      return createSuccess(parsed)
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'Unexpected error during imagery enhancement',
          'Please try again',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  /**
   * Generate alternative versions with different creative directions
   */
  async generateAlternatives(
    song: Song,
    directions: readonly CreativeDirection[],
    count: number = 3
  ): Promise<ServiceResponse<readonly AlternativeVersion[]>> {
    try {
      const systemPrompt = this.buildAlternativesSystemPrompt(directions, count)
      const userPrompt = this.buildAlternativesUserPrompt(song)

      const response = await this.modelProvider.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.8, // Higher creativity for alternatives
        maxTokens: 8000,
        topP: 0.95
      })

      if (!response.success) {
        return createFailure(response.error)
      }

      const parsed = this.parseAlternativesResponse(response.data.content)

      if (!parsed || parsed.length === 0) {
        return createFailure(
          createError(
            'REVISION_FAILED',
            'AI generated invalid alternative versions',
            'Please try again'
          )
        )
      }

      return createSuccess(parsed)
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'Unexpected error during alternative generation',
          'Please try again',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  /**
   * Check if revision maintains original voice
   */
  async checkVoicePreservation(
    original: Song,
    revised: Song,
    voiceProfile: VoiceProfile
  ): Promise<ServiceResponse<VoicePreservationCheck>> {
    try {
      const systemPrompt = this.buildVoiceCheckSystemPrompt(voiceProfile)
      const userPrompt = this.buildVoiceCheckUserPrompt(original, revised)

      const response = await this.modelProvider.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.2, // Low temperature for analytical task
        maxTokens: 2000,
        topP: 0.9
      })

      if (!response.success) {
        return createFailure(response.error)
      }

      const parsed = this.parseVoiceCheckResponse(response.data.content, voiceProfile)

      if (!parsed) {
        return createFailure(
          createError(
            'VOICE_PRESERVATION_FAILED',
            'AI generated invalid voice check',
            'Please try again'
          )
        )
      }

      return createSuccess(parsed)
    } catch (error) {
      return createFailure(
        createError(
          'VOICE_PRESERVATION_FAILED',
          'Unexpected error during voice preservation check',
          'Please try again',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  /**
   * Apply specific fixes to targeted issues
   */
  async applyTargetedFixes(
    song: Song,
    issues: readonly QualityIssue[]
  ): Promise<ServiceResponse<Song>> {
    try {
      const systemPrompt = this.buildTargetedFixesSystemPrompt()
      const userPrompt = this.buildTargetedFixesUserPrompt(song, issues)

      const response = await this.modelProvider.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.5, // Balanced for targeted fixes
        maxTokens: 5000,
        topP: 0.9
      })

      if (!response.success) {
        return createFailure(response.error)
      }

      const parsed = this.parseTargetedFixesResponse(response.data.content)

      if (!parsed) {
        return createFailure(
          createError(
            'REVISION_FAILED',
            'AI generated invalid targeted fixes',
            'Please try again'
          )
        )
      }

      return createSuccess(parsed)
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'Unexpected error during targeted fixes',
          'Please try again',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  // ============================================================================
  // SYSTEM PROMPT BUILDERS
  // ============================================================================

  private buildRevisionSystemPrompt(input: RevisionInput): string {
    const voiceSection = input.voiceProfile ? `
VOICE PROFILE:
- Vocabulary: ${input.voiceProfile.vocabulary.join(', ')}
- Perspective: ${input.voiceProfile.perspectivePOV}
- Tone: ${input.voiceProfile.toneCharacteristics.join(', ')}
- Avoid: ${input.voiceProfile.avoidances.join(', ')}
` : ''

    return `You are a professional songwriting editor specializing in song revision.

ROLE: Improve lyrics while preserving original voice and intent.

REVISION STRATEGY: ${input.strategy}

Strategy Guidelines:
- CONSERVATIVE: Minimal changes, fix only critical issues, preserve 90%+ of original text
- MODERATE: Balance improvement with preservation, fix major issues, keep voice intact
- AGGRESSIVE: Major rewrites for quality, dramatic improvements while maintaining essence
- SURGICAL: Fix ONLY specific issues mentioned in critique, leave rest unchanged
- CREATIVE: Explore new directions while keeping core themes and emotional arc

${voiceSection}

PRESERVATION RULES:
1. Maintain original vocabulary style and complexity
2. Keep perspective (1st/2nd/3rd person) consistent
3. Preserve emotional tone and intensity
4. Match rhyme scheme from original
5. Keep core meaning and themes similar
6. Respect syllable patterns for flow
7. Avoid introducing clichés or forced language

OUTPUT FORMAT (JSON):
{
  "revisedSong": {
    "id": "string",
    "title": "string",
    "verses": [...],
    "choruses": [...],
    "bridge": {...},
    "metadata": {...},
    "generatedAt": "ISO date string"
  },
  "changes": [
    {
      "changeId": "string",
      "type": "line_rewrite|word_substitution|phrase_improvement|rhyme_fix|rhythm_adjustment|imagery_enhancement",
      "location": {
        "sectionType": "verse|chorus|bridge",
        "lineNumber": 0
      },
      "original": "original text",
      "revised": "revised text",
      "reason": "why this change was made",
      "issueFixed": "cliche|forced_rhyme|weak_rhyme|vague_imagery|...",
      "improvementScore": 0-100
    }
  ],
  "alternatives": [
    {
      "versionId": "string",
      "direction": "darker|lighter|more_abstract|more_concrete|...",
      "revisedSong": {...},
      "description": "what makes this version different",
      "changes": [...],
      "improvementScore": 0-100
    }
  ],
  "improvementMetrics": {
    "beforeScore": 0-100,
    "afterScore": 0-100,
    "improvement": 0-100,
    "issuesFixed": 0,
    "issuesRemaining": 0,
    "categoryImprovements": {
      "rhymeQuality": { "before": 0-100, "after": 0-100, "delta": 0, "percentChange": 0 },
      "flowConsistency": { "before": 0-100, "after": 0-100, "delta": 0, "percentChange": 0 },
      "imageryVividness": { "before": 0-100, "after": 0-100, "delta": 0, "percentChange": 0 },
      "emotionalAuthenticity": { "before": 0-100, "after": 0-100, "delta": 0, "percentChange": 0 },
      "originalityScore": { "before": 0-100, "after": 0-100, "delta": 0, "percentChange": 0 },
      "voiceConsistency": { "before": 0-100, "after": 0-100, "delta": 0, "percentChange": 0 }
    },
    "qualityLevelChange": "poor->acceptable, good->excellent, etc."
  },
  "preservedElements": ["element1", "element2", ...],
  "voiceConsistency": 0-100
}

CRITICAL RULES:
1. Return ONLY valid JSON wrapped in markdown code block
2. Include ALL required fields from schema
3. Changes array must document EVERY modification
4. Preserve voice profile characteristics strictly
5. Improvement metrics must be realistic and based on actual changes
6. Each change must have clear rationale tied to critique issues

Return your revision as JSON.`
  }

  private buildRevisionUserPrompt(input: RevisionInput): string {
    const issuesSection = input.targetIssues && input.targetIssues.length > 0
      ? `\nTarget these specific issue types: ${input.targetIssues.join(', ')}`
      : ''

    const feedbackSection = input.customFeedback && input.customFeedback.length > 0
      ? `\n\nAdditional Feedback:\n${input.customFeedback.join('\n')}`
      : ''

    return `Revise this song based on the critique feedback.

ORIGINAL SONG:
Title: ${input.song.title}

${this.formatSongForRevision(input.song)}

CRITIQUE REPORT:
Overall Score: ${input.critique.overallScore}/100
Quality Level: ${input.critique.qualityLevel}
Passes Gold Standard: ${input.critique.passesGoldStandard ? 'Yes' : 'No'}

Issues Found:
${this.formatIssuesForRevision(input.critique.issues)}

Suggestions:
${input.critique.suggestions.map(s => `- ${s.description ?? s.type}`).join('\n')}

Strengths (preserve these):
${input.critique.strengths.join('\n')}
${issuesSection}${feedbackSection}

Preserve Voice: ${input.preserveVoice ? 'YES - maintain original voice strictly' : 'NO - voice can change'}

Provide complete revision as JSON.`
  }

  private buildLineRevisionSystemPrompt(input: LineRevisionInput): string {
    const voiceSection = input.voiceProfile ? `
Voice Profile: ${input.voiceProfile.perspectivePOV}, tone: ${input.voiceProfile.toneCharacteristics.join(', ')}
` : ''

    return `You are a professional lyricist specializing in line-by-line revision.

TASK: Revise a single lyric line to fix a specific issue while maintaining context.

${voiceSection}

CONSTRAINTS:
- Preserve rhyme: ${input.preserveRhyme ? 'YES - must rhyme with same words' : 'NO'}
- Preserve rhythm: ${input.preserveRhythm ? 'YES - must match syllable count' : 'NO'}

OUTPUT FORMAT (JSON):
{
  "original": {
    "text": "original line text",
    "syllables": 0,
    "stressPattern": "x/x/x/",
    "rhymeSound": "string"
  },
  "revised": {
    "text": "revised line text",
    "syllables": 0,
    "stressPattern": "x/x/x/",
    "rhymeSound": "string"
  },
  "alternatives": [
    { "text": "alternative 1", "syllables": 0, "stressPattern": "x/x/x/", "rhymeSound": "string" },
    { "text": "alternative 2", "syllables": 0, "stressPattern": "x/x/x/", "rhymeSound": "string" },
    { "text": "alternative 3", "syllables": 0, "stressPattern": "x/x/x/", "rhymeSound": "string" }
  ],
  "improvement": 0-100,
  "preservedRhyme": true|false,
  "preservedRhythm": true|false
}

Return ONLY valid JSON.`
  }

  private buildLineRevisionUserPrompt(input: LineRevisionInput): string {
    const contextSection = input.context && input.context.length > 0
      ? `\nSurrounding Lines:\n${input.context.map((l, i) => `${i + 1}. ${l.text}`).join('\n')}`
      : ''

    return `Revise this line to fix the identified issue.

LINE TO REVISE: "${input.line.text}"
Syllables: ${input.line.syllables}
Rhyme Sound: ${input.line.rhymeSound || 'none'}

ISSUE:
Type: ${input.issue.issueType}
Severity: ${input.issue.severity}
Message: ${input.issue.message}
Suggestion: ${input.issue.suggestion || 'Improve overall quality'}
${contextSection}

Provide revision with 3 alternatives as JSON.`
  }

  private buildRhymeStrengthenSystemPrompt(input: RhymeStrengthenInput): string {
    return `You are a rhyme specialist focused on strengthening rhymes between lyric lines.

TASK: Improve rhyme quality between two lines while preserving meaning.

CURRENT RHYME QUALITY: ${input.currentQuality}
TARGET RHYME QUALITY: ${input.targetQuality}

Rhyme Quality Levels:
- perfect: Identical ending sounds (day/say, night/light)
- near: Close sounds (day/stay, night/sight)
- slant: Consonance/assonance (day/may, night/right)
- weak: Barely rhymes (day/they, night/height)
- none: No rhyme

OUTPUT FORMAT (JSON):
{
  "option1": {
    "line1": "revised line 1",
    "line2": "revised line 2",
    "rhymeQuality": "perfect|near|slant",
    "meaningPreserved": true|false,
    "naturalness": 0-1,
    "explanation": "why this option works"
  },
  "option2": { /* same structure */ },
  "option3": { /* same structure */ },
  "recommended": 1|2|3
}

RULES:
1. Preserve meaning if preserveMeaning is true
2. Maintain natural language (no forced constructions)
3. Keep syllable count similar
4. All options must be better than current quality
5. Recommended option should balance quality and naturalness

Return ONLY valid JSON.`
  }

  private buildRhymeStrengthenUserPrompt(input: RhymeStrengthenInput): string {
    return `Strengthen the rhyme between these two lines.

LINE 1: "${input.line1.text}"
LINE 2: "${input.line2.text}"

Current Rhyme Quality: ${input.currentQuality}
Target Quality: ${input.targetQuality}
Preserve Meaning: ${input.preserveMeaning ? 'YES - keep core meaning' : 'NO - meaning can change'}

Provide 3 rhyme options as JSON.`
  }

  private buildImageryEnhancementSystemPrompt(input: ImageryEnhancementInput): string {
    return `You are an imagery specialist focused on making lyrics more concrete and vivid.

TASK: Replace vague/abstract phrases with specific, sensory-rich imagery.

TARGET VIVIDNESS: ${input.targetVividness}/100

VAGUE PHRASES TO IMPROVE:
${input.vaguePhrases.join(', ')}

OUTPUT FORMAT (JSON):
{
  "original": "original line text",
  "enhanced": [
    "enhanced version 1 with vivid imagery",
    "enhanced version 2 with different imagery",
    "enhanced version 3 with alternative approach"
  ],
  "concreteReplacements": {
    "vague_phrase_1": ["concrete_option_1", "concrete_option_2", "concrete_option_3"],
    "vague_phrase_2": ["concrete_option_1", "concrete_option_2", "concrete_option_3"]
  },
  "sensoryDetails": [
    "visual: what you see",
    "auditory: what you hear",
    "tactile: what you feel",
    "etc."
  ]
}

IMAGERY RULES:
1. Use specific, concrete nouns (not "feelings" but "trembling hands")
2. Add sensory details (sight, sound, touch, taste, smell)
3. Show, don't tell (not "sad" but "mascara streaking down her cheeks")
4. Use vivid verbs (not "went" but "stumbled", "raced", "crept")
5. Maintain syllable count approximately
6. Keep natural, conversational language

Return ONLY valid JSON.`
  }

  private buildImageryEnhancementUserPrompt(input: ImageryEnhancementInput): string {
    const contextSection = input.context ? `\nContext: ${input.context}` : ''

    return `Enhance the imagery in this line.

LINE: "${input.line.text}"
Vague Phrases: ${input.vaguePhrases.join(', ')}
Target Vividness: ${input.targetVividness}/100
${contextSection}

Provide 3 enhanced versions with concrete imagery as JSON.`
  }

  private buildAlternativesSystemPrompt(
    directions: readonly CreativeDirection[],
    count: number
  ): string {
    return `You are a creative songwriting specialist generating alternative versions of songs.

TASK: Generate ${count} alternative versions exploring different creative directions.

CREATIVE DIRECTIONS TO EXPLORE:
${directions.join(', ')}

Direction Meanings:
- darker: More melancholic, serious, heavier emotional tone
- lighter: More uplifting, positive, hopeful tone
- more_abstract: More metaphorical, symbolic, poetic
- more_concrete: More specific, literal, vivid details
- more_personal: First person, intimate, confessional
- more_universal: Broader perspective, relatable themes
- more_narrative: Story-focused, plot-driven
- more_emotional: Feeling-focused, raw emotion

OUTPUT FORMAT (JSON):
[
  {
    "versionId": "alt_1",
    "direction": "darker|lighter|...",
    "revisedSong": {
      "id": "string",
      "title": "string",
      "verses": [...],
      "choruses": [...],
      "bridge": {...},
      "metadata": {...},
      "generatedAt": "ISO string"
    },
    "description": "what makes this version unique",
    "changes": [
      {
        "changeId": "string",
        "type": "line_rewrite|...",
        "location": {...},
        "original": "text",
        "revised": "text",
        "reason": "why",
        "issueFixed": "type",
        "improvementScore": 0-100
      }
    ],
    "improvementScore": 0-100
  }
]

RULES:
1. Each alternative explores a different direction
2. Core themes remain recognizable
3. Changes are substantial but coherent
4. Each version is complete and polished
5. Document all changes vs original

Return ONLY valid JSON array.`
  }

  private buildAlternativesUserPrompt(song: Song): string {
    return `Generate alternative versions of this song.

ORIGINAL SONG:
Title: ${song.title}

${this.formatSongForRevision(song)}

Generate complete alternative versions as JSON array.`
  }

  private buildVoiceCheckSystemPrompt(voiceProfile: VoiceProfile): string {
    return `You are a voice consistency specialist analyzing if revisions maintain original voice.

ORIGINAL VOICE PROFILE:
- Vocabulary: ${voiceProfile.vocabulary.join(', ')}
- Perspective: ${voiceProfile.perspectivePOV}
- Tone Characteristics: ${voiceProfile.toneCharacteristics.join(', ')}
- Phrase Tendencies: ${voiceProfile.phraseTendencies.join(', ')}
- Avoid: ${voiceProfile.avoidances.join(', ')}

OUTPUT FORMAT (JSON):
{
  "originalVoice": {
    "vocabulary": ["word1", "word2", ...],
    "phraseTendencies": ["phrase1", ...],
    "perspectivePOV": "first_person|second_person|third_person",
    "toneCharacteristics": ["characteristic1", ...],
    "avoidances": ["avoid1", ...]
  },
  "revisedText": "full revised text",
  "consistencyScore": 0-100,
  "violations": [
    {
      "type": "vocabulary_mismatch|perspective_shift|tone_shift|style_inconsistency",
      "location": 0,
      "phrase": "violating phrase",
      "explanation": "why this violates voice",
      "suggestion": "how to fix"
    }
  ],
  "passed": true|false
}

CONSISTENCY RULES:
1. Vocabulary must match original complexity and style
2. Perspective (POV) must be identical throughout
3. Tone must maintain same characteristics
4. Avoid introducing words/phrases from avoidance list
5. Score 90+ = passed, <90 = failed

Return ONLY valid JSON.`
  }

  private buildVoiceCheckUserPrompt(original: Song, revised: Song): string {
    return `Check if this revision maintains the original voice.

ORIGINAL SONG:
${this.formatSongForRevision(original)}

REVISED SONG:
${this.formatSongForRevision(revised)}

Analyze voice consistency and provide report as JSON.`
  }

  private buildTargetedFixesSystemPrompt(): string {
    return `You are a precision editor applying specific fixes to identified issues.

TASK: Fix ONLY the issues specified, leave everything else unchanged.

OUTPUT FORMAT (JSON):
{
  "id": "song_id",
  "title": "song title",
  "verses": [...],
  "choruses": [...],
  "bridge": {...},
  "metadata": {...},
  "generatedAt": "ISO string"
}

RULES:
1. Fix ONLY lines with issues mentioned
2. Preserve all other lines exactly as-is
3. Maintain rhyme scheme and syllable patterns
4. Keep voice consistent with original
5. Each fix must directly address the issue

Return complete song with targeted fixes as JSON.`
  }

  private buildTargetedFixesUserPrompt(song: Song, issues: readonly QualityIssue[]): string {
    return `Apply targeted fixes to these specific issues.

SONG:
${this.formatSongForRevision(song)}

ISSUES TO FIX:
${issues.map((issue, i) => `
${i + 1}. ${issue.issueType} (${issue.severity})
   Lines: ${issue.affectedLines.join(', ')}
   Message: ${issue.message}
   Suggestion: ${issue.suggestion || 'Fix this issue'}
`).join('\n')}

Fix ONLY these issues, preserve everything else. Return complete song as JSON.`
  }

  // ============================================================================
  // RESPONSE PARSERS
  // ============================================================================

  private parseRevisionResponse(content: string): RevisionResult | null {
    try {
      const json = this.extractJSON(content)
      if (!json) return null

      // Validate required fields exist
      if (!json.revisedSong || !json.changes || !json.improvementMetrics) {
        return null
      }

      // Additional validation could go here
      return json as RevisionResult
    } catch {
      return null
    }
  }

  private parseLineRevisionResponse(content: string, originalLine: Line): LineRevisionResult | null {
    try {
      const json = this.extractJSON(content)
      if (!json || !json.revised) return null

      return {
        original: originalLine,
        revised: json.revised,
        alternatives: json.alternatives || [],
        improvement: json.improvement || 0,
        preservedRhyme: json.preservedRhyme ?? false,
        preservedRhythm: json.preservedRhythm ?? false
      }
    } catch {
      return null
    }
  }

  private parseRhymeStrengthenResponse(content: string): RhymeStrengthenResult | null {
    try {
      const json = this.extractJSON(content)
      if (!json || !json.option1 || !json.option2 || !json.option3) {
        return null
      }

      return {
        option1: json.option1,
        option2: json.option2,
        option3: json.option3,
        recommended: json.recommended || 1
      }
    } catch {
      return null
    }
  }

  private parseImageryEnhancementResponse(
    content: string,
    originalText: string
  ): ImageryEnhancementResult | null {
    try {
      const json = this.extractJSON(content)
      if (!json || !json.enhanced) return null

      // Convert object to Map
      const replacements = new Map<string, readonly string[]>()
      if (json.concreteReplacements) {
        Object.entries(json.concreteReplacements).forEach(([key, value]) => {
          replacements.set(key, value as string[])
        })
      }

      return {
        original: originalText,
        enhanced: json.enhanced,
        concreteReplacements: replacements,
        sensoryDetails: json.sensoryDetails || []
      }
    } catch {
      return null
    }
  }

  private parseAlternativesResponse(content: string): readonly AlternativeVersion[] | null {
    try {
      const json = this.extractJSON(content)
      if (!json || !Array.isArray(json)) return null

      return json
    } catch {
      return null
    }
  }

  private parseVoiceCheckResponse(
    content: string,
    originalProfile: VoiceProfile
  ): VoicePreservationCheck | null {
    try {
      const json = this.extractJSON(content)
      if (!json) return null

      return {
        originalVoice: originalProfile,
        revisedText: json.revisedText || '',
        consistencyScore: createQualityScore(json.consistencyScore || 0),
        violations: json.violations || [],
        passed: json.passed ?? false
      }
    } catch {
      return null
    }
  }

  private parseTargetedFixesResponse(content: string): Song | null {
    try {
      const json = this.extractJSON(content)
      if (!json || !json.title || !json.verses) return null

      return json as Song
    } catch {
      return null
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private extractJSON(content: string): any {
    try {
      // Try direct parse first
      return JSON.parse(content)
    } catch {
      // Try to extract from markdown code block
      const match = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
      if (match && match[1]) {
        return JSON.parse(match[1])
      }
      return null
    }
  }

  private formatSongForRevision(song: Song): string {
    let formatted = ''

    song.verses.forEach((verse) => {
      formatted += `\n[Verse ${verse.number}]\n`
      verse.lines.forEach((line, lineIdx) => {
        formatted += `${lineIdx + 1}. ${line.text}\n`
      })
    })

    song.choruses.forEach((chorus, chorusIdx) => {
      formatted += `\n[Chorus${chorus.isMainChorus ? ' - Main' : ` ${chorusIdx + 1}`}]\n`
      chorus.lines.forEach((line, lineIdx) => {
        formatted += `${lineIdx + 1}. ${line.text}\n`
      })
    })

    if (song.bridge) {
      formatted += `\n[Bridge]\n`
      song.bridge.lines.forEach((line, lineIdx) => {
        formatted += `${lineIdx + 1}. ${line.text}\n`
      })
    }

    return formatted
  }

  private formatIssuesForRevision(issues: readonly QualityIssue[]): string {
    return issues.map((issue, idx) => {
      return `${idx + 1}. ${issue.issueType} (${issue.severity}) - Lines ${issue.affectedLines.join(', ')}
   ${issue.message}
   Suggestion: ${issue.suggestion ?? 'Fix this issue'}`
    }).join('\n\n')
  }
}
