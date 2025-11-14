# Data Boundaries - VSCode Songwriting Assistant

**Created**: 2025-11-14
**Phase**: IDENTIFY
**Status**: Complete Data Flow Analysis

## Purpose

This document identifies ALL data transformation points (seams) in the VSCode Songwriting Assistant. Every place where data crosses a boundary between systems, components, or services must be documented here BEFORE any code is written.

## Complete User Journey & Data Flows

### Journey 1: Generate New Song from Prompt

```
[User Input]
  → Seam #1: InputValidationSeam
    Input: Raw user text, optional context
    Output: ValidatedPrompt

[Validated Prompt]
  → Seam #2: SongGenerationSeam
    Input: ValidatedPrompt, constraints, style context
    Output: RawSong (structure, verses, choruses)

[Raw Song]
  → Seam #3: CritiqueEngineSeam
    Input: RawSong
    Output: QualityReport (scores, issues, suggestions)

[Quality Report + Raw Song]
  → Decision Point: Pass Gold Standard?
    If NO → Seam #4: RevisionEngineSeam
    If YES → Continue to formatting

[Song + Feedback]
  → Seam #4: RevisionEngineSeam
    Input: Song, CritiqueReport, target improvements
    Output: ImprovedSong

[Improved Song]
  → Loop back to CritiqueEngineSeam (iterate until gold standard)

[Approved Song]
  → Seam #5: SunoFormatterSeam
    Input: Song structure, target version (v4.0/v4.5/v5.0)
    Output: FormattedSunoText (with meta-tags)

[Formatted Song]
  → Seam #9: ExportSeam
    Input: FormattedSong, export format
    Output: File (txt, md, json, pdf)
```

### Journey 2: Analyze Existing Lyrics

```
[User Selects Text in Editor]
  → Seam #6: RhymeAnalysisSeam
    Input: Text selection
    Output: RhymePattern, quality scores, suggestions

[User Selects Text]
  → Seam #7: SyllableCountingSeam
    Input: Text lines
    Output: SyllableCounts, StressPatterns, rhythm analysis
```

### Journey 3: Audio-Driven Songwriting

```
[User Uploads Audio File]
  → Seam #8: GeminiAudioSeam
    Input: Audio file buffer, analysis prompt
    Output: AudioAnalysis (rhythm, emotion, melody, suggestions)

[Audio Analysis]
  → Seam #2: SongGenerationSeam
    Input: AudioAnalysis as context
    Output: Lyrics matching audio characteristics
```

### Journey 4: Revision & History Management

```
[User Requests Revision]
  → Seam #4: RevisionEngineSeam
    Input: Current song, specific feedback
    Output: Multiple alternative versions

[All Versions]
  → Seam #10: HistorySeam
    Input: Song versions, timestamps, metadata
    Output: Stored versions, comparison data
```

## Identified Seams (Complete List)

### Seam #1: InputValidationSeam
**Purpose**: Transform raw user input into validated, structured prompts
**Data Flow**: `RawUserInput → ValidatedPrompt`
**Boundary**: User interaction layer → Application logic layer
**Complexity**: Low
**Dependencies**: None
**Priority**: P0 (foundation for all other seams)

**Input Data**:
- Raw prompt text (string)
- Optional context (genre, mood, theme, artist reference)
- Optional constraints (verse count, rhyme scheme, length)

**Output Data**:
- Validated prompt object
- Sanitized input
- Error messages if validation fails

**Validation Rules**:
- Min prompt length: 10 characters
- Max prompt length: 1000 characters
- Genre must be from allowed list
- Constraints must be realistic (e.g., verseCount 1-10)

**Error Cases**:
- Empty prompt
- Prompt too short/long
- Invalid genre
- Conflicting constraints

---

### Seam #2: SongGenerationSeam
**Purpose**: Transform validated prompts into structured songs
**Data Flow**: `ValidatedPrompt → RawSong`
**Boundary**: Application logic → AI generation service (Gemini API)
**Complexity**: High
**Dependencies**: Seam #1 (requires validated input)
**Priority**: P0 (core feature)

**Input Data**:
- ValidatedPrompt
- Generation context (style, mood, constraints)
- Optional audio analysis data (from Seam #8)

**Output Data**:
- Song object (verses, choruses, bridge, metadata)
- Alternative suggestions
- Confidence score
- Generation metadata (model, timestamp, tokens used)

**Transformation Rules**:
- Generate 3-5 verses (configurable)
- Include at least 1 chorus
- Optional bridge
- Each verse has consistent line count
- Rhyme scheme follows request or defaults to ABAB

**Error Cases**:
- Generation timeout
- API failure
- Inappropriate content filtering
- Unable to meet constraints

---

### Seam #3: CritiqueEngineSeam
**Purpose**: Analyze song quality against professional standards
**Data Flow**: `RawSong → QualityReport`
**Boundary**: Song structure → Quality analysis engine
**Complexity**: Very High
**Dependencies**: Seam #2 (requires song), Seam #6 (uses rhyme analysis), Seam #7 (uses syllable analysis)
**Priority**: P0 (quality gatekeeper)

**Input Data**:
- Complete Song object
- Optional target quality level (casual, professional, gold-standard)

**Output Data**:
- Overall quality score (0-100)
- Category scores (rhyme, flow, imagery, authenticity, originality, voice)
- List of quality issues (severity, location, description, suggestion)
- List of strengths
- Pass/fail for gold standard
- Line-by-line analysis

**Analysis Dimensions**:
1. Rhyme Quality (forced rhymes, imperfect matches, creative rhymes)
2. Flow Consistency (syllable patterns, stress patterns, rhythm breaks)
3. Imagery Vividness (concrete vs. abstract, sensory details, specificity)
4. Emotional Authenticity (clichés, genuine voice, character consistency)
5. Originality (overused phrases, unique perspectives, fresh metaphors)
6. Voice Consistency (POV stability, vocabulary level, tone)

**Error Cases**:
- Song too short to analyze
- Missing required sections
- Analysis timeout

---

### Seam #4: RevisionEngineSeam
**Purpose**: Transform songs with feedback into improved versions
**Data Flow**: `(Song + CritiqueReport) → ImprovedSong`
**Boundary**: Current version → Revised version
**Complexity**: Very High
**Dependencies**: Seam #2 (song structure), Seam #3 (critique feedback)
**Priority**: P0 (quality improvement)

**Input Data**:
- Current Song
- CritiqueReport with specific issues
- Revision strategy (conservative, moderate, aggressive)
- Optional: specific lines/sections to revise

**Output Data**:
- Revised Song
- Change log (what was changed and why)
- Multiple alternative versions (typically 3-5)
- Improvement metrics (before/after scores)

**Revision Strategies**:
- Line-by-line surgical editing (preserve most, fix specific issues)
- Section regeneration (rewrite entire verse/chorus)
- Alternative exploration (multiple creative directions)
- Voice preservation (maintain original style while improving quality)

**Error Cases**:
- Unable to improve without destroying original intent
- Revision creates new issues
- All alternatives fail quality check

---

### Seam #5: SunoFormatterSeam
**Purpose**: Transform songs into Suno-compatible format with meta-tags
**Data Flow**: `Song → SunoFormattedText`
**Boundary**: Internal song structure → Platform-specific format
**Complexity**: Medium
**Dependencies**: Seam #2 (song structure)
**Priority**: P0 (required for output)

**Input Data**:
- Song structure
- Target Suno version (v4.0, v4.5, v5.0)
- Style preferences (vocal style, tempo, mood, effects)
- Optional meta-tag suggestions from analysis

**Output Data**:
- Formatted text string with meta-tags
- Character count (must be ≤3000)
- Validation result
- Suggested enhancements

**Format Requirements**:
- Section tags: [Intro], [Verse 1], [Chorus], [Bridge], [Outro]
- Style tags: [genre: rock], [tempo: mid], [mood: dark]
- v5.0 advanced tags: [beat-drop], [key-change: up-step], [vocal-effects: autotune]
- Character limit: 3000 for v4.5 and v5.0
- Max sections: 20
- Max line length: 120 characters

**Error Cases**:
- Exceeds character limit
- Invalid meta-tag syntax
- Too many sections
- Incompatible tags for version

---

### Seam #6: RhymeAnalysisSeam
**Purpose**: Analyze rhyme patterns and quality in text
**Data Flow**: `TextLines → RhymeAnalysis`
**Boundary**: Raw text → Phonetic analysis
**Complexity**: Medium
**Dependencies**: None (standalone utility)
**Priority**: P1 (used by Seam #3)

**Input Data**:
- Array of text lines
- Optional: expected rhyme scheme (ABAB, AABB, etc.)

**Output Data**:
- Detected rhyme scheme
- Rhyme quality scores (perfect, near, forced, none)
- Rhyme suggestions for improvement
- Phonetic transcriptions
- Alternative rhyming words

**Analysis Types**:
- Perfect rhymes (identical sounds)
- Near rhymes (slant rhymes, assonance)
- Forced rhymes (awkward word choice for rhyme)
- Internal rhymes (within lines)
- Multi-syllable rhymes

**Error Cases**:
- Too few lines to analyze
- Non-English text (if not supported)
- Unclear pronunciation

---

### Seam #7: SyllableCountingSeam
**Purpose**: Analyze syllable counts and stress patterns
**Data Flow**: `TextLines → SyllableAnalysis`
**Boundary**: Raw text → Prosodic analysis
**Complexity**: Medium
**Dependencies**: None (standalone utility)
**Priority**: P1 (used by Seam #3)

**Input Data**:
- Text lines
- Optional: target meter (iambic, trochaic, etc.)

**Output Data**:
- Syllable count per line
- Stress patterns (x/ notation)
- Rhythm consistency score
- Meter detection
- Flow issues

**Analysis Features**:
- Syllable counting (with dictionary lookup)
- Stress pattern detection
- Meter identification
- Flow consistency checking
- Rhythm break detection

**Error Cases**:
- Ambiguous word pronunciation
- Non-standard words
- Empty input

---

### Seam #8: GeminiAudioSeam
**Purpose**: Analyze audio files using Gemini AI
**Data Flow**: `AudioFile → AudioAnalysis`
**Boundary**: Audio data → AI analysis service
**Complexity**: High
**Dependencies**: None (but feeds into Seam #2)
**Priority**: P1 (advanced feature)

**Input Data**:
- Audio file buffer (mp3, wav, etc.)
- Analysis prompt (rhythm, emotion, melody, improvement suggestions)
- Optional: existing lyrics for comparison

**Output Data**:
- Emotional tone analysis
- Rhythm pattern description
- Melody characteristics
- Suggested vocal delivery style
- Lyric improvement suggestions
- Timing analysis

**Analysis Prompts**:
- "What is the predominant emotion conveyed in this recording?"
- "Identify the rhythm pattern and suggest lyrical stress patterns that would match"
- "What vocal delivery style would best complement this instrumental?"
- "Are there any timing issues between the lyrics and the melody?"
- "What imagery or themes would enhance the mood of this track?"

**Error Cases**:
- Unsupported audio format
- File too large
- API timeout
- Audio quality too poor to analyze

---

### Seam #9: ExportSeam
**Purpose**: Export songs to various file formats
**Data Flow**: `FormattedSong → FileOutput`
**Boundary**: Internal data → File system
**Complexity**: Low
**Dependencies**: Seam #5 (formatted song)
**Priority**: P1 (user output)

**Input Data**:
- Formatted song (from Seam #5)
- Raw song structure (for JSON export)
- Export format (txt, md, json, pdf)
- Optional: include metadata, history, critique report

**Output Data**:
- File saved to user-specified location
- Success confirmation
- File path

**Export Formats**:
- TXT: Plain text with Suno formatting
- Markdown: Formatted with sections and metadata
- JSON: Complete song structure with all data
- PDF: Formatted document with styling

**Error Cases**:
- Write permission denied
- Disk full
- Invalid file path
- Format conversion error

---

### Seam #10: HistorySeam
**Purpose**: Store and retrieve song versions and history
**Data Flow**: `SongVersions ↔ Storage`
**Boundary**: Runtime data → Persistent storage
**Complexity**: Medium
**Dependencies**: All seams (stores all outputs)
**Priority**: P1 (user experience)

**Input Data** (Save):
- Song version
- Timestamp
- Change description
- Associated critique report
- User notes

**Output Data** (Save):
- Version ID
- Storage confirmation

**Input Data** (Retrieve):
- Song ID
- Optional: version number, date range, filter criteria

**Output Data** (Retrieve):
- List of versions
- Full version data
- Comparison data (diffs between versions)
- Timeline visualization data

**Storage Requirements**:
- Max 50 versions per song (configurable)
- Auto-cleanup of old versions
- Export history with song
- Search/filter capabilities

**Error Cases**:
- Storage quota exceeded
- Corrupted version data
- Version not found
- Storage access denied

---

## Data Transformation Matrix

| From Seam | To Seam | Data Type | Validation Required |
|-----------|---------|-----------|---------------------|
| #1 InputValidation | #2 SongGeneration | ValidatedPrompt | Yes - schema validation |
| #2 SongGeneration | #3 CritiqueEngine | Song | Yes - structure validation |
| #3 CritiqueEngine | #4 RevisionEngine | CritiqueReport | No - informational |
| #2 SongGeneration | #4 RevisionEngine | Song | Yes - structure validation |
| #4 RevisionEngine | #3 CritiqueEngine | Song | Yes - structure validation |
| #2 SongGeneration | #5 SunoFormatter | Song | Yes - structure validation |
| #5 SunoFormatter | #9 Export | FormattedText | Yes - length/format check |
| #8 GeminiAudio | #2 SongGeneration | AudioAnalysis | No - optional context |
| Any seam | #10 History | Any output | Yes - serialization check |

## Open Questions & Resolutions

### Q1: Should rhyme analysis be synchronous or asynchronous?
**Resolution**: Asynchronous for full analysis, synchronous for simple lookups
**Rationale**: Full phonetic analysis is expensive; UI needs instant feedback for typing
**Impact**: Seam #6 has two modes: quick (sync) and deep (async)

### Q2: How do we handle the iterative revision loop?
**Resolution**: Max 5 iterations, then require manual intervention
**Rationale**: Prevents infinite loops, maintains user control
**Impact**: RevisionEngineSeam includes iteration counter

### Q3: What happens if Gemini API fails during generation?
**Resolution**: Graceful degradation with local fallback (simpler generation)
**Rationale**: Extension should work offline in limited mode
**Impact**: SongGenerationSeam needs offline mode

### Q4: Can users override gold standard criteria?
**Resolution**: Yes, configurable quality thresholds in settings
**Rationale**: Different users have different quality needs
**Impact**: CritiqueEngineSeam reads from config

### Q5: How do we maintain voice consistency across revisions?
**Resolution**: Extract "voice profile" on first generation, use as constraint
**Rationale**: Revisions should improve quality without losing character
**Impact**: RevisionEngineSeam includes voice preservation logic

### Q6: Should history be stored locally or in cloud?
**Resolution**: Phase 1 = local only, Phase 2 = optional cloud sync
**Rationale**: Privacy first, cloud is optional feature
**Impact**: HistorySeam uses local VSCode storage initially

## Cross-Cutting Concerns

### Authentication & Authorization
- **Gemini API**: Requires API key from user settings
- **Storage**: Local VSCode storage (no auth needed)
- **Future**: Optional cloud sync requires OAuth

### Error Handling Strategy
- All seams return `ServiceResponse<T>` with success/error union type
- Errors include: code, message (user-friendly), technical details, recovery suggestions
- No throwing exceptions across seam boundaries
- Graceful degradation where possible

### Performance Requirements
- SongGeneration: < 3 seconds target
- CritiqueEngine: < 1 second target
- RevisionEngine: < 2 seconds target
- UI responsiveness: No blocking operations on main thread

### Data Validation Strategy
- Input validation at seam entry points
- Schema validation using TypeScript types
- Runtime validation with type guards
- Contract tests ensure seam compliance

### Logging & Observability
- Every seam logs: input size, output size, duration, success/failure
- Errors logged with full context
- Performance metrics tracked
- User analytics (opt-in): feature usage, quality scores

## Seam Dependency Graph

```
[#1 InputValidation]
        ↓
[#2 SongGeneration] ←─── [#8 GeminiAudio]
        ↓
[#3 CritiqueEngine] ←─── [#6 RhymeAnalysis]
        ↓                  [#7 SyllableCounting]
[#4 RevisionEngine]
        ↓
[#5 SunoFormatter]
        ↓
[#9 Export]

[#10 History] ← All seams write here
```

**Critical Path**: #1 → #2 → #3 → #4 → #5 → #9
**Support Seams**: #6, #7 (used by #3)
**Optional Seams**: #8 (enhances #2), #10 (persistence)

## Implementation Priority Order

### Must Have (P0) - Phase 1
1. Seam #1: InputValidation (foundation)
2. Seam #2: SongGeneration (core feature)
3. Seam #3: CritiqueEngine (quality gate)
4. Seam #4: RevisionEngine (quality improvement)
5. Seam #5: SunoFormatter (output format)

### Should Have (P1) - Phase 2
6. Seam #6: RhymeAnalysis (improves #3)
7. Seam #7: SyllableCounting (improves #3)
8. Seam #9: Export (user output)
9. Seam #10: History (user experience)

### Nice to Have (P2) - Phase 3
10. Seam #8: GeminiAudio (advanced feature)

## Next Steps

1. ✅ Complete this DATA-BOUNDARIES.md document
2. ⏭️ Create SEAMSLIST.md with prioritized seam definitions
3. ⏭️ Begin Phase 2: DEFINE - Create immutable contracts for each seam
4. ⏭️ Validate all contracts with TypeScript compiler
5. ⏭️ Proceed to Phase 3: BUILD mocks only after contracts are frozen

---

**Document Status**: ✅ COMPLETE
**Ready for Phase 2**: YES
**All Seams Identified**: 10/10
**All Questions Resolved**: 6/6
**Dependencies Mapped**: YES
**Priority Assigned**: YES
