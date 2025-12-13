/**
 * @fileoverview Song Generation WebviewPanel
 * @purpose Primary UI for song generation, critique, and export
 * @phase Phase 4 - UI Development
 * @updated 2025-11-17
 *
 * This panel:
 * - Displays song generation form
 * - Handles user interactions via message passing
 * - Integrates with MockSongGenerationService
 * - Provides critique and export functionality
 * - Manages webview state and lifecycle
 */

import * as vscode from 'vscode'
import type { Song } from '../contracts/types/song'
import type {
  GenerateSongInput
} from '../contracts/SongGeneration'
import type {
  RawPromptInput
} from '../contracts/InputValidation'
import type {
  CritiqueReport
} from '../contracts/CritiqueEngine'
import type {
  ExportOptions,
  ExportFormat
} from '../contracts/Export'
import { SunoVersion } from '../contracts/SunoFormatter'
import { isFailure } from '../contracts/types/common'

// Import mock services
import {
  MockInputValidationService,
  MockSongGenerationService,
  MockCritiqueEngineService,
  MockExportService,
  MockSunoFormatterService
} from '../services/mock'

/**
 * Message types for webview communication
 */
enum MessageType {
  GENERATE = 'generate',
  CRITIQUE = 'critique',
  EXPORT = 'export',
  EXPORT_SUNO = 'exportSuno',
  UPDATE_SONG = 'updateSong',
  ERROR = 'error',
  LOADING = 'loading',
  READY = 'ready'
}

/**
 * Message payload interface
 */
interface WebviewMessage {
  type: MessageType
  payload?: unknown
}

/**
 * Song generation form data from webview
 */
interface GenerationFormData {
  prompt: string
  genre?: string
  mood?: string
  theme?: string
  verseCount?: number
  linesPerVerse?: number
  chorusCount?: number
  linesPerChorus?: number
  includeBridge?: boolean
  includeIntro?: boolean
  includeOutro?: boolean
}

/**
 * Panel state
 */
interface PanelState {
  currentSong?: Song
  currentCritique?: CritiqueReport
  isGenerating: boolean
  lastError?: string
}

/**
 * Song Generation Panel
 *
 * Manages the webview panel for song generation and displays results.
 */
export class SongGenerationPanel {
  public static currentPanel: SongGenerationPanel | undefined

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private _disposables: vscode.Disposable[] = []

  // Services
  private readonly _inputValidation: MockInputValidationService
  private readonly _songGeneration: MockSongGenerationService
  private readonly _critique: MockCritiqueEngineService
  private readonly _export: MockExportService
  private readonly _sunoFormatter: MockSunoFormatterService

  // State
  private _state: PanelState = {
    isGenerating: false
  }

  /**
   * Create or show the song generation panel
   */
  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it
    if (SongGenerationPanel.currentPanel) {
      SongGenerationPanel.currentPanel._panel.reveal(column)
      return
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'songGeneration',
      'Song Generation',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src', 'ui')
        ]
      }
    )

    SongGenerationPanel.currentPanel = new SongGenerationPanel(panel, extensionUri)
  }

  /**
   * Private constructor
   */
  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._extensionUri = extensionUri

    // Initialize services
    this._inputValidation = new MockInputValidationService()
    this._songGeneration = new MockSongGenerationService()
    this._critique = new MockCritiqueEngineService()
    this._export = new MockExportService()
    this._sunoFormatter = new MockSunoFormatterService()

    // Set the webview's initial html content
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview)

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => this._handleMessage(message),
      null,
      this._disposables
    )

    // Send ready message
    this._postMessage({ type: MessageType.READY })
  }

  /**
   * Handle messages from webview
   */
  private async _handleMessage(message: WebviewMessage): Promise<void> {
    try {
      switch (message.type) {
        case MessageType.GENERATE:
          await this._handleGenerate(message.payload as GenerationFormData)
          break

        case MessageType.CRITIQUE:
          await this._handleCritique()
          break

        case MessageType.EXPORT:
          await this._handleExport(message.payload as { format: ExportFormat })
          break

        case MessageType.EXPORT_SUNO:
          await this._handleExportSuno()
          break

        default:
          console.warn('Unknown message type:', message.type)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this._postMessage({
        type: MessageType.ERROR,
        payload: { message: errorMessage }
      })
    }
  }

  /**
   * Handle song generation request
   */
  private async _handleGenerate(formData: GenerationFormData): Promise<void> {
    // Set loading state
    this._state.isGenerating = true
    this._postMessage({
      type: MessageType.LOADING,
      payload: { message: 'Generating song...' }
    })

    try {
      // Step 1: Validate input
      const rawInput: RawPromptInput = {
        prompt: formData.prompt,
        context: {
          genre: formData.genre,
          mood: formData.mood,
          theme: formData.theme
        },
        constraints: {
          verseCount: formData.verseCount,
          linesPerVerse: formData.linesPerVerse,
          chorusCount: formData.chorusCount,
          linesPerChorus: formData.linesPerChorus,
          includeBridge: formData.includeBridge,
          includeIntro: formData.includeIntro,
          includeOutro: formData.includeOutro
        }
      }

      const validationResult = await this._inputValidation.validate(rawInput)

      if (isFailure(validationResult)) {
        this._postMessage({
          type: MessageType.ERROR,
          payload: {
            message: validationResult.error.message,
            suggestion: validationResult.error.suggestion
          }
        })
        this._state.isGenerating = false
        return
      }

      // Step 2: Generate song
      const generateInput: GenerateSongInput = {
        prompt: validationResult.data.validatedPrompt,
        style: validationResult.data.validatedPrompt.style,
        constraints: validationResult.data.validatedPrompt.constraints
      }

      const generationResult = await this._songGeneration.generate(generateInput)

      if (isFailure(generationResult)) {
        this._postMessage({
          type: MessageType.ERROR,
          payload: {
            message: generationResult.error.message,
            suggestion: generationResult.error.suggestion
          }
        })
        this._state.isGenerating = false
        return
      }

      // Step 3: Update state and send to webview
      this._state.currentSong = generationResult.data.song
      this._state.isGenerating = false

      this._postMessage({
        type: MessageType.UPDATE_SONG,
        payload: {
          song: this._serializeSong(generationResult.data.song),
          metadata: generationResult.data.generationMetadata,
          confidence: generationResult.data.confidence
        }
      })

      vscode.window.showInformationMessage('Song generated successfully!')

    } catch (error) {
      this._state.isGenerating = false
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate song'

      this._postMessage({
        type: MessageType.ERROR,
        payload: { message: errorMessage }
      })

      vscode.window.showErrorMessage(`Generation failed: ${errorMessage}`)
    }
  }

  /**
   * Handle critique request
   */
  private async _handleCritique(): Promise<void> {
    if (!this._state.currentSong) {
      vscode.window.showWarningMessage('No song to critique. Generate a song first.')
      return
    }

    this._postMessage({
      type: MessageType.LOADING,
      payload: { message: 'Analyzing song quality...' }
    })

    try {
      const critiqueResult = await this._critique.analyzeSong(
        this._state.currentSong,
        'professional' as any
      )

      if (isFailure(critiqueResult)) {
        this._postMessage({
          type: MessageType.ERROR,
          payload: {
            message: critiqueResult.error.message,
            suggestion: critiqueResult.error.suggestion
          }
        })
        return
      }

      this._state.currentCritique = critiqueResult.data

      this._postMessage({
        type: MessageType.CRITIQUE,
        payload: {
          critique: this._serializeCritique(critiqueResult.data)
        }
      })

      // Show summary in notification
      const score = critiqueResult.data.overallScore
      const level = critiqueResult.data.qualityLevel
      vscode.window.showInformationMessage(
        `Critique complete: ${score}/100 (${level})`
      )

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to critique song'
      this._postMessage({
        type: MessageType.ERROR,
        payload: { message: errorMessage }
      })
    }
  }

  /**
   * Handle export request
   */
  private async _handleExport(payload: { format: ExportFormat }): Promise<void> {
    if (!this._state.currentSong) {
      vscode.window.showWarningMessage('No song to export. Generate a song first.')
      return
    }

    try {
      const exportOptions: ExportOptions = {
        format: payload.format,
        includeMetadata: true,
        includeCritique: !!this._state.currentCritique
      }

      const exportResult = await this._export.exportSong(
        this._state.currentSong,
        exportOptions
      )

      if (isFailure(exportResult)) {
        vscode.window.showErrorMessage(exportResult.error.message)
        return
      }

      vscode.window.showInformationMessage(
        `Song exported to ${exportResult.data.filePath}`
      )

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export song'
      vscode.window.showErrorMessage(`Export failed: ${errorMessage}`)
    }
  }

  /**
   * Handle Suno export request
   */
  private async _handleExportSuno(): Promise<void> {
    if (!this._state.currentSong) {
      vscode.window.showWarningMessage('No song to export. Generate a song first.')
      return
    }

    try {
      const formatResult = await this._sunoFormatter.formatSong(
        this._state.currentSong,
        {
          version: SunoVersion.V5_0,
          includeTags: true,
          style: {}
        }
      )

      if (isFailure(formatResult)) {
        vscode.window.showErrorMessage(formatResult.error.message)
        return
      }

      // Export the Suno-formatted content
      const exportOptions: ExportOptions = {
        format: 'suno' as ExportFormat,
        includeMetadata: false
      }

      const exportResult = await this._export.exportSong(
        this._state.currentSong,
        exportOptions
      )

      if (isFailure(exportResult)) {
        vscode.window.showErrorMessage(exportResult.error.message)
        return
      }

      vscode.window.showInformationMessage(
        `Suno format exported to ${exportResult.data.filePath}`
      )

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export Suno format'
      vscode.window.showErrorMessage(`Suno export failed: ${errorMessage}`)
    }
  }

  /**
   * Serialize song for webview (convert to plain object)
   */
  private _serializeSong(song: Song): unknown {
    return {
      id: song.id,
      title: song.title,
      verses: song.verses.map(v => ({
        id: v.id,
        number: v.number,
        lines: v.lines.map(l => l.text),
        rhymeScheme: v.rhymeScheme
      })),
      choruses: song.choruses.map(c => ({
        id: c.id,
        lines: c.lines.map(l => l.text),
        rhymeScheme: c.rhymeScheme,
        isMainChorus: c.isMainChorus
      })),
      bridge: song.bridge ? {
        id: song.bridge.id,
        lines: song.bridge.lines.map(l => l.text),
        rhymeScheme: song.bridge.rhymeScheme
      } : undefined,
      metadata: song.metadata,
      generatedAt: song.generatedAt.toISOString()
    }
  }

  /**
   * Serialize critique for webview
   */
  private _serializeCritique(critique: CritiqueReport): unknown {
    return {
      overallScore: critique.overallScore,
      passesGoldStandard: critique.passesGoldStandard,
      qualityLevel: critique.qualityLevel,
      scores: critique.scores,
      issues: critique.issues.map(issue => ({
        type: issue.issueType,
        severity: issue.severity,
        message: issue.message,
        suggestion: issue.suggestion,
        affectedLines: issue.affectedLines
      })),
      suggestions: critique.suggestions.slice(0, 10), // Top 10 suggestions
      strengths: critique.strengths
    }
  }

  /**
   * Post message to webview
   */
  private _postMessage(message: WebviewMessage): void {
    this._panel.webview.postMessage(message)
  }

  /**
   * Get HTML content for webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Get resource URIs
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'styles', 'songGeneration.css')
    )

    // Read HTML file content (we'll inline it for simplicity)
    // In production, you'd use fs.readFileSync, but for now we'll inline it
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
  <link href="${cssUri}" rel="stylesheet">
  <title>Song Generation</title>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎵 Songwriting Assistant</h1>
      <p class="subtitle">AI-powered songwriting with professional quality analysis</p>
    </header>

    <main>
      <!-- Generation Form -->
      <section class="form-section">
        <h2>Generate New Song</h2>

        <form id="generationForm">
          <div class="form-group">
            <label for="prompt">Prompt *</label>
            <textarea
              id="prompt"
              name="prompt"
              rows="4"
              placeholder="Write a song about heartbreak and moving on..."
              required
            ></textarea>
            <span class="help-text">Describe what you want the song to be about (10-1000 characters)</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="genre">Genre</label>
              <select id="genre" name="genre">
                <option value="">Auto-detect</option>
                <option value="pop">Pop</option>
                <option value="rock">Rock</option>
                <option value="hip-hop">Hip-Hop</option>
                <option value="country">Country</option>
                <option value="indie-folk">Indie Folk</option>
                <option value="jazz">Jazz</option>
                <option value="r&b">R&B</option>
                <option value="electronic">Electronic</option>
              </select>
            </div>

            <div class="form-group">
              <label for="mood">Mood</label>
              <select id="mood" name="mood">
                <option value="">Auto-detect</option>
                <option value="happy">Happy</option>
                <option value="sad">Sad</option>
                <option value="melancholic">Melancholic</option>
                <option value="energetic">Energetic</option>
                <option value="calm">Calm</option>
                <option value="romantic">Romantic</option>
                <option value="dark">Dark</option>
                <option value="uplifting">Uplifting</option>
              </select>
            </div>

            <div class="form-group">
              <label for="theme">Theme</label>
              <input type="text" id="theme" name="theme" placeholder="love, freedom, struggle...">
            </div>
          </div>

          <details class="advanced-options">
            <summary>Structure Constraints</summary>
            <div class="form-row">
              <div class="form-group">
                <label for="verseCount">Verses</label>
                <input type="number" id="verseCount" name="verseCount" min="1" max="10" value="3">
              </div>

              <div class="form-group">
                <label for="linesPerVerse">Lines per Verse</label>
                <input type="number" id="linesPerVerse" name="linesPerVerse" min="2" max="16" value="4">
              </div>

              <div class="form-group">
                <label for="chorusCount">Choruses</label>
                <input type="number" id="chorusCount" name="chorusCount" min="0" max="5" value="1">
              </div>

              <div class="form-group">
                <label for="linesPerChorus">Lines per Chorus</label>
                <input type="number" id="linesPerChorus" name="linesPerChorus" min="2" max="16" value="4">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>
                  <input type="checkbox" id="includeBridge" name="includeBridge">
                  Include Bridge
                </label>
              </div>

              <div class="form-group">
                <label>
                  <input type="checkbox" id="includeIntro" name="includeIntro">
                  Include Intro
                </label>
              </div>

              <div class="form-group">
                <label>
                  <input type="checkbox" id="includeOutro" name="includeOutro">
                  Include Outro
                </label>
              </div>
            </div>
          </details>

          <button type="submit" class="btn btn-primary" id="generateBtn">
            <span class="btn-text">Generate Song</span>
            <span class="spinner" style="display: none;">⏳</span>
          </button>
        </form>
      </section>

      <!-- Loading State -->
      <section id="loadingSection" class="loading-section" style="display: none;">
        <div class="loader"></div>
        <p id="loadingMessage">Generating your song...</p>
      </section>

      <!-- Error Display -->
      <section id="errorSection" class="error-section" style="display: none;">
        <div class="error-box">
          <h3>⚠️ Error</h3>
          <p id="errorMessage"></p>
          <p class="suggestion" id="errorSuggestion"></p>
          <button onclick="clearError()" class="btn btn-secondary">Dismiss</button>
        </div>
      </section>

      <!-- Song Display -->
      <section id="songSection" class="song-section" style="display: none;">
        <div class="song-header">
          <h2 id="songTitle">Untitled</h2>
          <div class="song-meta">
            <span id="songGenre"></span>
            <span id="songMood"></span>
            <span id="songConfidence"></span>
          </div>
        </div>

        <div id="songContent" class="song-content"></div>

        <div class="action-buttons">
          <button onclick="critiqueSong()" class="btn btn-secondary">
            📊 Critique Quality
          </button>
          <button onclick="exportSong('markdown')" class="btn btn-secondary">
            📄 Export Markdown
          </button>
          <button onclick="exportSong('text')" class="btn btn-secondary">
            📝 Export Text
          </button>
          <button onclick="exportSuno()" class="btn btn-primary">
            🎵 Export to Suno
          </button>
        </div>
      </section>

      <!-- Critique Display -->
      <section id="critiqueSection" class="critique-section" style="display: none;">
        <h2>Quality Analysis</h2>

        <div class="score-overview">
          <div class="overall-score">
            <div class="score-circle" id="overallScoreCircle">
              <span id="overallScore">0</span>
            </div>
            <p id="qualityLevel">-</p>
          </div>

          <div class="score-grid">
            <div class="score-item">
              <label>Rhyme Quality</label>
              <div class="score-bar">
                <div class="score-fill" id="rhymeScore"></div>
              </div>
            </div>
            <div class="score-item">
              <label>Flow Consistency</label>
              <div class="score-bar">
                <div class="score-fill" id="flowScore"></div>
              </div>
            </div>
            <div class="score-item">
              <label>Imagery Vividness</label>
              <div class="score-bar">
                <div class="score-fill" id="imageryScore"></div>
              </div>
            </div>
            <div class="score-item">
              <label>Emotional Authenticity</label>
              <div class="score-bar">
                <div class="score-fill" id="authenticityScore"></div>
              </div>
            </div>
            <div class="score-item">
              <label>Originality</label>
              <div class="score-bar">
                <div class="score-fill" id="originalityScore"></div>
              </div>
            </div>
            <div class="score-item">
              <label>Voice Consistency</label>
              <div class="score-bar">
                <div class="score-fill" id="voiceScore"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="critique-details">
          <div class="strengths">
            <h3>✅ Strengths</h3>
            <ul id="strengthsList"></ul>
          </div>

          <div class="issues">
            <h3>⚠️ Issues</h3>
            <div id="issuesList"></div>
          </div>

          <div class="suggestions">
            <h3>💡 Suggestions</h3>
            <ul id="suggestionsList"></ul>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    // Form submission
    document.getElementById('generationForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = {
        prompt: document.getElementById('prompt').value,
        genre: document.getElementById('genre').value || undefined,
        mood: document.getElementById('mood').value || undefined,
        theme: document.getElementById('theme').value || undefined,
        verseCount: parseInt(document.getElementById('verseCount').value),
        linesPerVerse: parseInt(document.getElementById('linesPerVerse').value),
        chorusCount: parseInt(document.getElementById('chorusCount').value),
        linesPerChorus: parseInt(document.getElementById('linesPerChorus').value),
        includeBridge: document.getElementById('includeBridge').checked,
        includeIntro: document.getElementById('includeIntro').checked,
        includeOutro: document.getElementById('includeOutro').checked
      };

      vscode.postMessage({
        type: 'generate',
        payload: formData
      });
    });

    // Action functions
    function critiqueSong() {
      vscode.postMessage({ type: 'critique' });
    }

    function exportSong(format) {
      vscode.postMessage({
        type: 'export',
        payload: { format }
      });
    }

    function exportSuno() {
      vscode.postMessage({ type: 'exportSuno' });
    }

    function clearError() {
      document.getElementById('errorSection').style.display = 'none';
    }

    // Handle messages from extension
    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.type) {
        case 'loading':
          showLoading(message.payload.message);
          break;

        case 'updateSong':
          hideLoading();
          displaySong(message.payload);
          break;

        case 'critique':
          displayCritique(message.payload.critique);
          break;

        case 'error':
          hideLoading();
          showError(message.payload.message, message.payload.suggestion);
          break;

        case 'ready':
          console.log('Webview ready');
          break;
      }
    });

    function showLoading(message) {
      document.getElementById('loadingMessage').textContent = message;
      document.getElementById('loadingSection').style.display = 'block';
      document.getElementById('errorSection').style.display = 'none';
      document.getElementById('generateBtn').disabled = true;
    }

    function hideLoading() {
      document.getElementById('loadingSection').style.display = 'none';
      document.getElementById('generateBtn').disabled = false;
    }

    function showError(message, suggestion) {
      document.getElementById('errorMessage').textContent = message;
      document.getElementById('errorSuggestion').textContent = suggestion || '';
      document.getElementById('errorSection').style.display = 'block';
    }

    function displaySong(data) {
      const { song, metadata, confidence } = data;

      // Update header
      document.getElementById('songTitle').textContent = song.title;
      document.getElementById('songGenre').textContent = song.metadata.genre || '';
      document.getElementById('songMood').textContent = song.metadata.mood || '';
      document.getElementById('songConfidence').textContent =
        \`Confidence: \${(confidence * 100).toFixed(0)}%\`;

      // Build song content
      let content = '';

      // Intro
      if (song.intro) {
        content += '<div class="song-section"><h3>[Intro]</h3>';
        song.intro.lines.forEach(line => {
          content += \`<p class="song-line">\${line}</p>\`;
        });
        content += '</div>';
      }

      // Verses and choruses (alternating)
      for (let i = 0; i < Math.max(song.verses.length, song.choruses.length); i++) {
        // Verse
        if (song.verses[i]) {
          const verse = song.verses[i];
          content += \`<div class="song-section"><h3>[Verse \${verse.number}]</h3>\`;
          verse.lines.forEach(line => {
            content += \`<p class="song-line">\${line}</p>\`;
          });
          content += '</div>';
        }

        // Chorus
        if (song.choruses[i]) {
          const chorus = song.choruses[i];
          content += '<div class="song-section"><h3>[Chorus]</h3>';
          chorus.lines.forEach(line => {
            content += \`<p class="song-line">\${line}</p>\`;
          });
          content += '</div>';
        }
      }

      // Bridge
      if (song.bridge) {
        content += '<div class="song-section"><h3>[Bridge]</h3>';
        song.bridge.lines.forEach(line => {
          content += \`<p class="song-line">\${line}</p>\`;
        });
        content += '</div>';
      }

      // Outro
      if (song.outro) {
        content += '<div class="song-section"><h3>[Outro]</h3>';
        song.outro.lines.forEach(line => {
          content += \`<p class="song-line">\${line}</p>\`;
        });
        content += '</div>';
      }

      document.getElementById('songContent').innerHTML = content;
      document.getElementById('songSection').style.display = 'block';
    }

    function displayCritique(critique) {
      // Overall score
      document.getElementById('overallScore').textContent = critique.overallScore;
      document.getElementById('qualityLevel').textContent = critique.qualityLevel.toUpperCase();

      // Score color
      const scoreCircle = document.getElementById('overallScoreCircle');
      if (critique.overallScore >= 90) scoreCircle.className = 'score-circle gold';
      else if (critique.overallScore >= 80) scoreCircle.className = 'score-circle excellent';
      else if (critique.overallScore >= 70) scoreCircle.className = 'score-circle good';
      else scoreCircle.className = 'score-circle needs-work';

      // Individual scores
      setScoreBar('rhymeScore', critique.scores.rhymeQuality);
      setScoreBar('flowScore', critique.scores.flowConsistency);
      setScoreBar('imageryScore', critique.scores.imageryVividness);
      setScoreBar('authenticityScore', critique.scores.emotionalAuthenticity);
      setScoreBar('originalityScore', critique.scores.originalityScore);
      setScoreBar('voiceScore', critique.scores.voiceConsistency);

      // Strengths
      const strengthsList = document.getElementById('strengthsList');
      strengthsList.innerHTML = '';
      critique.strengths.forEach(strength => {
        const li = document.createElement('li');
        li.textContent = strength;
        strengthsList.appendChild(li);
      });

      // Issues
      const issuesList = document.getElementById('issuesList');
      issuesList.innerHTML = '';
      critique.issues.forEach(issue => {
        const div = document.createElement('div');
        div.className = \`issue issue-\${issue.severity}\`;
        div.innerHTML = \`
          <strong>\${issue.type}</strong>: \${issue.message}
          \${issue.suggestion ? \`<br><em>Suggestion: \${issue.suggestion}</em>\` : ''}
        \`;
        issuesList.appendChild(div);
      });

      // Suggestions
      const suggestionsList = document.getElementById('suggestionsList');
      suggestionsList.innerHTML = '';
      critique.suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion.description || suggestion;
        suggestionsList.appendChild(li);
      });

      document.getElementById('critiqueSection').style.display = 'block';
    }

    function setScoreBar(id, score) {
      const bar = document.getElementById(id);
      bar.style.width = score + '%';

      if (score >= 90) bar.className = 'score-fill gold';
      else if (score >= 80) bar.className = 'score-fill excellent';
      else if (score >= 70) bar.className = 'score-fill good';
      else bar.className = 'score-fill needs-work';
    }
  </script>
</body>
</html>`
  }

  /**
   * Dispose of panel resources
   */
  public dispose(): void {
    SongGenerationPanel.currentPanel = undefined

    this._panel.dispose()

    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }
}
