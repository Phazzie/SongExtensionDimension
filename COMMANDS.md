# Command Infrastructure Documentation

**Updated**: 2025-11-17
**Status**: Complete

## Overview

This document describes the complete command infrastructure for the Songwriting Assistant VSCode extension. All 5 primary commands are now registered, configured, and have handlers ready for implementation.

## Registered Commands

### 1. songwriting.generateSong
**Title**: Songwriter: Generate New Song
**Description**: Generate a complete song from a prompt using AI
**Category**: Songwriting
**Keybinding**: Ctrl+Shift+G (Windows/Linux), Cmd+Shift+G (Mac)

**Handler**: `/src/commands/generateSong.ts`
- Prompts user for song inspiration/theme
- Validates input using InputValidation service
- Generates song using SongGeneration service
- Shows success dialog with follow-up options

**Features**:
- Input validation with minimum length checking
- Progress notification during generation
- Quality feedback messages
- Quick actions to critique, revise, or export

### 2. songwriting.critiqueSong
**Title**: Songwriter: Critique Current Song
**Description**: Analyze the current song for quality and provide detailed feedback
**Category**: Songwriting
**Keybinding**: Ctrl+Shift+C (Windows/Linux), Cmd+Shift+C (Mac)

**Handler**: `/src/commands/critiqueSong.ts`
- Allows selection of critique level (casual, professional, gold-standard)
- Analyzes song using CritiqueEngine service
- Returns detailed quality report with issues and suggestions

**Features**:
- Multiple critique levels for different needs
- Progress notification
- Comprehensive quality analysis
- Actionable feedback with scores

### 3. songwriting.reviseSong
**Title**: Songwriter: Revise Current Song
**Description**: Improve the current song based on critique feedback
**Category**: Songwriting
**Keybinding**: Ctrl+Shift+R (Windows/Linux), Cmd+Shift+R (Mac)

**Handler**: `/src/commands/reviseSong.ts`
- Allows selection of revision strategy
  - Conservative: Minimal changes
  - Moderate: Balanced fixes
  - Aggressive: Major rewrites
  - Surgical: Targeted fixes
  - Creative: Explore new directions
- Uses RevisionEngine to improve song
- Maintains voice consistency

**Features**:
- Multiple revision strategies
- Progress notification
- Voice preservation
- Improvement metrics

### 4. songwriting.exportSong
**Title**: Songwriter: Export Song
**Description**: Export the current song to various file formats
**Category**: Songwriting
**Keybinding**: Ctrl+Shift+E (Windows/Linux), Cmd+Shift+E (Mac)

**Handler**: `/src/commands/exportSong.ts`
- Supports 6 export formats:
  - Text (.txt): Plain text lyrics
  - Markdown (.md): Formatted markdown
  - JSON (.json): Complete song data
  - PDF (.pdf): Professional document
  - HTML (.html): Interactive format
  - Suno (.txt): Ready for Suno platform
- File dialog for location selection
- Uses Export service for format conversion

**Features**:
- Multiple export formats
- Standard file save dialog
- Progress notification
- Format-specific validation

### 5. songwriting.showHistory
**Title**: Songwriter: Show Song History
**Description**: View version history, compare versions, and rollback changes
**Category**: Songwriting
**Keybinding**: Ctrl+Shift+H (Windows/Linux), Cmd+Shift+H (Mac)

**Handler**: `/src/commands/showHistory.ts`
- Uses History service to retrieve version data
- Displays all saved versions of current song
- Allows comparison between versions
- Enables rollback to previous versions

**Features**:
- Version timeline view
- Version comparison
- Rollback capability
- Quality score history
- Export version history

## Configuration Settings

All settings are in the `songwriting` namespace. Access via VSCode settings UI or JSON:

```json
{
  "songwriting.showWelcome": true,
  "songwriting.aiProvider": "gemini",
  "songwriting.critiqueLevel": "professional",
  "songwriting.revisionStrategy": "moderate",
  "songwriting.exportFormat": "text",
  "songwriting.defaultExportDirectory": "${userHome}/Music/Songwriting Assistant",
  "songwriting.preserveVoice": true,
  "songwriting.autoSaveVersions": true,
  "songwriting.maxVersionsPerSong": 50,
  "songwriting.generationTemperature": 0.7,
  "songwriting.qualityThreshold": 0.75,
  "songwriting.enableTelemetry": false,
  "songwriting.debugMode": false
}
```

### Configuration Groups

#### AI Provider Settings
- `songwriting.aiProvider`: Choose between "gemini" or "openai"
- `songwriting.geminiApiKey`: Google Gemini API key (machine-scoped)
- `songwriting.openaiApiKey`: OpenAI API key (machine-scoped)

#### Quality Settings
- `songwriting.critiqueLevel`: Default critique level (casual, professional, gold-standard)
- `songwriting.qualityThreshold`: Minimum quality threshold (0-1)

#### Generation Settings
- `songwriting.generationTemperature`: Creativity level (0 = deterministic, 1 = creative)
- `songwriting.revisionStrategy`: Default revision approach

#### Export Settings
- `songwriting.exportFormat`: Default export format
- `songwriting.defaultExportDirectory`: Default save location

#### Voice & Preservation
- `songwriting.preserveVoice`: Auto-preserve voice during revisions
- `songwriting.autoSaveVersions`: Auto-save versions after each change

#### Storage & Performance
- `songwriting.maxVersionsPerSong`: Maximum versions to keep (5-1000)

#### Developer Settings
- `songwriting.debugMode`: Enable debug logging
- `songwriting.enableTelemetry`: Enable usage analytics

## Keybindings

| Command | Windows/Linux | Mac |
|---------|---------------|-----|
| Generate Song | Ctrl+Shift+G | Cmd+Shift+G |
| Critique Song | Ctrl+Shift+C | Cmd+Shift+C |
| Revise Song | Ctrl+Shift+R | Cmd+Shift+R |
| Export Song | Ctrl+Shift+E | Cmd+Shift+E |
| Show History | Ctrl+Shift+H | Cmd+Shift+H |

All keybindings are context-aware and work whether in editor or elsewhere.

## File Structure

```
/src/
├── extension.ts                 # Extension entry point
├── config.ts                    # Configuration management
├── commands/
│   ├── index.ts                 # Command registration
│   ├── generateSong.ts          # Generate command handler
│   ├── critiqueSong.ts          # Critique command handler
│   ├── reviseSong.ts            # Revise command handler
│   ├── exportSong.ts            # Export command handler
│   └── showHistory.ts           # History command handler
├── services/
│   └── factory.ts               # Service initialization
└── ...
```

## Service Integration

All commands use the service factory (`/src/services/factory.ts`) to access services:

```typescript
export interface Services {
  readonly inputValidation: IInputValidationService
  readonly songGeneration: ISongGenerationService
  readonly critiqueEngine: ICritiqueEngineService
  readonly revisionEngine: IRevisionEngineService
  readonly export: IExportService
  readonly history: IHistoryService
  readonly rhymeAnalysis: IRhymeAnalysisService
  readonly syllableCounting: ISyllableCountingService
  readonly geminiAudio: IGeminiAudioService
  readonly sunoFormatter: ISunoFormatterService
}
```

Currently using mock services (Phase 3-4). In Phase 5, will switch to real implementations.

## Extension Activation

The extension is activated by:
1. `onCommand:songwriting.generateSong` - First command invocation
2. `onView:songwritingPanel` - When sidebar panel is viewed

## Configuration Flow

1. **Initialization** (`extension.ts` activation)
   - Load configuration via `getConfiguration()` in `config.ts`
   - Validate API keys if configured
   - Initialize services via factory
   - Register all commands

2. **Command Execution** (when user invokes command)
   - Get latest configuration
   - Validate required settings
   - Show user UI (input box, quick pick, save dialog)
   - Call appropriate service
   - Handle result and show feedback

3. **Error Handling**
   - All commands include try-catch
   - User-friendly error messages
   - Console logging for debugging

## Configuration Management API

### Functions in `/src/config.ts`

```typescript
// Get all settings
getConfiguration(): ExtensionConfig

// Get/set individual values
getConfigValue<T>(key: string, defaultValue: T): T
setConfigValue(key: string, value: unknown): Promise<void>

// Validation
validateApiKeys(): { valid: boolean; error?: string }
ensureConfigured(): Promise<boolean>

// Path expansion
expandPath(path: string): string
```

## Usage Examples

### User generates a song:
1. Press Ctrl+Shift+G (or Cmd+Shift+G on Mac)
2. Enter song prompt in input box
3. Extension validates prompt
4. Shows "Generating..." progress
5. Returns song with title
6. User can choose to critique, revise, or export

### User exports a song:
1. Press Ctrl+Shift+E
2. Select export format from quick pick
3. Choose save location
4. Extension generates file
5. Success message shows file path

### User changes settings:
1. Press Ctrl+Comma to open settings
2. Search for "songwriting"
3. Configure settings (API keys, defaults, etc.)
4. Changes apply immediately to next command

## Next Steps

After this infrastructure is complete, the next phases are:

**Phase 4**: Build UI panels (currently have panel files, need completion)
- SongwritingPanel: Main workspace for song creation
- GeneratePanel: Song generation UI
- CritiquePanel: Detailed critique visualization
- RevisionPanel: Revision workflow UI
- ExportPanel: Export options and preview

**Phase 5**: Implement real services
- Replace mock services with real Gemini/OpenAI calls
- Add real file I/O for export
- Add VSCode storage for history
- Implement real critique analysis

## Testing

Commands can be tested by:
1. Running extension in debug mode (F5 in VS Code)
2. Opening command palette (Ctrl+Shift+P)
3. Typing command name (e.g., "Generate New Song")
4. Following UI prompts

Keybindings work automatically after extension loads.

## Troubleshooting

### Command not appearing
- Check extension is activated (check Output tab)
- Ensure package.json is correct
- Reload VSCode window

### Settings not applying
- Check settings key is correct (songwriting.*)
- Ensure value matches expected type
- Check scope (user vs workspace)

### API key errors
- Check API key is set in settings
- Verify correct key for selected provider
- Check key is valid (not expired)

## Compliance

This implementation follows all project standards:
- ✅ Zero TypeScript errors (command files)
- ✅ No 'any' types in new code
- ✅ Service contracts respected
- ✅ ServiceResponse pattern for error handling
- ✅ Type-safe configuration
- ✅ Proper error messages with suggestions
