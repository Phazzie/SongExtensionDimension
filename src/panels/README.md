# Webview Panels Documentation

This directory contains VSCode webview panel implementations for the Songwriting Assistant extension.

## CritiquePanel

The **CritiquePanel** displays comprehensive song quality analysis in a visually appealing, interactive webview.

### Features

- **Overall Quality Score**: Large, color-coded score circle with quality level badge
- **8-Dimension Quality Breakdown**: Visual bars for each quality metric
  - Rhyme Quality
  - Flow Consistency
  - Imagery Vividness
  - Emotional Authenticity
  - Originality
  - Voice Consistency
  - Structural Coherence
  - Technical Execution
- **Issues Display**: Grouped by severity (Critical, Major, Minor, Info)
- **Suggestions Panel**: Actionable recommendations for improvement
- **Strengths Summary**: Highlights what's working well
- **Action Buttons**: Apply Suggestions and Revise Song

### Color Coding

The panel uses color coding to indicate quality levels:

- **Gold** (90-100): #ffd700 - Gold Standard, publication-ready
- **Excellent** (80-89): #4caf50 - Very good, minor improvements needed
- **Good** (70-79): #8bc34a - Solid work, some improvements needed
- **Acceptable** (60-69): #ff9800 - Meets minimum standards
- **Needs Work** (40-59): #ff5722 - Significant improvements needed
- **Poor** (0-39): #f44336 - Major problems, needs rewrite

### Usage Example

```typescript
import { CritiquePanel } from './panels/CritiquePanel'
import type { Song } from './contracts/types/song'

// In your extension activation or command handler
export function activate(context: vscode.ExtensionContext) {
  // Register command to show critique
  const critiqueSongCommand = vscode.commands.registerCommand(
    'songwriting-assistant.critiqueSong',
    async (song: Song) => {
      // Create or show the critique panel
      const panel = CritiquePanel.createOrShow(context.extensionUri)

      // Display critique for the song
      await panel.displayCritique(song)
    }
  )

  context.subscriptions.push(critiqueSongCommand)
}
```

### Integration with Generation Panel

```typescript
// After generating a song, automatically show critique
const generationResult = await songGenerationService.generateSong(input)

if (isSuccess(generationResult)) {
  const song = generationResult.data

  // Show the song in generation panel
  GenerationPanel.createOrShow(context.extensionUri)
  await GenerationPanel.currentPanel?.displaySong(song)

  // Automatically show critique in adjacent column
  const critiquePanel = CritiquePanel.createOrShow(context.extensionUri)
  await critiquePanel.displayCritique(song)
}
```

### Message Handling

The panel handles the following messages from the webview:

- `applySuggestions`: User wants to apply the suggested improvements
- `revise`: User wants to revise the song based on critique
- `close`: User wants to close the panel

### Styling

The panel uses VSCode theme variables for consistent appearance:

- Respects user's color theme (dark/light)
- Uses VSCode font family and sizing
- Matches VSCode UI patterns and conventions
- Fully responsive (works on narrow panels)

### Files

- **CritiquePanel.ts**: Main panel implementation
- **src/ui/styles/critique.css**: Styles for critique display
- **src/ui/critique-demo.html**: Standalone demo of the UI

### Testing the UI

You can preview the critique UI design by opening `src/ui/critique-demo.html` in a browser. This standalone file demonstrates the visual design without requiring VSCode extension runtime.

### Future Enhancements

- [ ] Click on issue to highlight affected line in editor
- [ ] Interactive suggestions (click to apply)
- [ ] Export critique report as PDF/Markdown
- [ ] Compare multiple critique reports over time
- [ ] Real-time critique as user types
- [ ] Integration with revision panel for one-click improvements
