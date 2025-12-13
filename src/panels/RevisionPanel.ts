/**
 * @fileoverview Revision Tools Webview Panel
 * @purpose Provide interactive UI for song revision with comparison and tracking
 * @phase Phase 4 - UI Development
 * @updated 2025-11-17
 *
 * This panel integrates with MockRevisionEngineService to:
 * - Display revision strategies (Conservative, Moderate, Aggressive, etc.)
 * - Show side-by-side before/after comparison
 * - Track and visualize changes
 * - Display improvement metrics
 * - Allow accept/revert operations
 */

import * as vscode from 'vscode'
import type {
  RevisionInput,
  RevisionResult,
  RevisionStrategy,
  ChangeRecord,
  ImprovementMetrics,
  AlternativeVersion
} from '../contracts/RevisionEngine'
import {
  RevisionStrategy as RevisionStrategyEnum
} from '../contracts/RevisionEngine'
import type { Song } from '../contracts/types/song'
import type { CritiqueReport, IssueType } from '../contracts/CritiqueEngine'
import type { VoiceProfile } from '../contracts/SongGeneration'
import { isSuccess, isFailure } from '../contracts/types/common'
import { MockRevisionEngineService } from '../services/mock/MockRevisionEngineService'

/**
 * Interface for revision panel state
 */
interface RevisionPanelState {
  originalSong: Song | null
  critique: CritiqueReport | null
  revisedSong: Song | null
  revisionResult: RevisionResult | null
  selectedStrategy: RevisionStrategy
  preserveVoice: boolean
  changes: readonly ChangeRecord[]
  metrics: ImprovementMetrics | null
  alternatives: readonly AlternativeVersion[]
  isLoading: boolean
  error: string | null
}

/**
 * Revision Panel Controller
 *
 * Manages the revision webview panel, handles user interactions,
 * and coordinates with the MockRevisionEngineService.
 */
export class RevisionPanel {
  private panel: vscode.WebviewPanel | null = null
  private service: MockRevisionEngineService
  private state: RevisionPanelState

  /**
   * Initialize the revision panel
   */
  constructor(private context: vscode.ExtensionContext) {
    this.service = new MockRevisionEngineService()
    this.state = {
      originalSong: null,
      critique: null,
      revisedSong: null,
      revisionResult: null,
      selectedStrategy: RevisionStrategyEnum.MODERATE,
      preserveVoice: true,
      changes: [],
      metrics: null,
      alternatives: [],
      isLoading: false,
      error: null
    }
  }

  /**
   * Show or create the revision panel
   */
  async show(song: Song, critique: CritiqueReport): Promise<void> {
    // Update state with input song and critique
    this.state.originalSong = song
    this.state.critique = critique
    this.state.revisedSong = null
    this.state.revisionResult = null
    this.state.changes = []
    this.state.metrics = null
    this.state.error = null

    // Create or reveal panel
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside)
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'revisionPanel',
        'Revision Tools',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [this.context.extensionUri]
        }
      )

      this.panel.webview.html = this.getHtmlContent()
      this.panel.onDidDispose(() => {
        this.panel = null
      })

      this.setupMessageHandlers()
    }

    // Update UI with song and critique
    this.updateWebviewState()
  }

  /**
   * Setup message handlers for webview communication
   */
  private setupMessageHandlers(): void {
    if (!this.panel) return

    this.panel.webview.onDidReceiveMessage(async (message: { command: string; [key: string]: unknown }) => {
      switch (message.command) {
        case 'revise':
          await this.handleReviseCommand(message as unknown as ReviseMessage)
          break
        case 'updateStrategy':
          this.handleStrategyChange(message as unknown as StrategyChangeMessage)
          break
        case 'toggleVoicePreservation':
          this.handleVoicePreservationChange(message as unknown as VoicePreservationMessage)
          break
        case 'acceptRevision':
          this.handleAcceptRevision()
          break
        case 'revertRevision':
          this.handleRevertRevision()
          break
        case 'viewAlternative':
          this.handleViewAlternative(message as unknown as ViewAlternativeMessage)
          break
      }
    })
  }

  /**
   * Handle revision request from webview
   */
  private async handleReviseCommand(message: ReviseMessage): Promise<void> {
    if (!this.state.originalSong || !this.state.critique) {
      this.state.error = 'Missing original song or critique'
      this.updateWebviewState()
      return
    }

    this.state.isLoading = true
    this.updateWebviewState()

    try {
      const revisionInput: RevisionInput = {
        song: this.state.originalSong,
        critique: this.state.critique,
        strategy: this.state.selectedStrategy,
        preserveVoice: this.state.preserveVoice,
        targetIssues: message.targetIssues as unknown as readonly IssueType[] | undefined,
        voiceProfile: message.voiceProfile ? (message.voiceProfile as VoiceProfile) : undefined,
        customFeedback: message.customFeedback as unknown as readonly string[] | undefined
      }

      const result = await this.service.reviseSong(revisionInput)

      if (isSuccess(result)) {
        this.state.revisionResult = result.data
        this.state.revisedSong = result.data.revisedSong
        this.state.changes = result.data.changes
        this.state.metrics = result.data.improvementMetrics
        this.state.alternatives = result.data.alternatives
        this.state.error = null
      } else if (isFailure(result)) {
        this.state.error = `${result.error.code}: ${result.error.message}`
        vscode.window.showErrorMessage(`Revision failed: ${result.error.message}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      this.state.error = errorMsg
      vscode.window.showErrorMessage(`Revision error: ${errorMsg}`)
    } finally {
      this.state.isLoading = false
      this.updateWebviewState()
    }
  }

  /**
   * Handle strategy change from webview
   */
  private handleStrategyChange(message: StrategyChangeMessage): void {
    this.state.selectedStrategy = message.strategy as RevisionStrategy
    this.state.error = null
  }

  /**
   * Handle voice preservation toggle from webview
   */
  private handleVoicePreservationChange(message: VoicePreservationMessage): void {
    this.state.preserveVoice = message.preserveVoice
    this.state.error = null
  }

  /**
   * Handle accept revision request
   */
  private handleAcceptRevision(): void {
    if (!this.state.revisedSong) {
      vscode.window.showWarningMessage('No revision to accept')
      return
    }

    // In a real implementation, this would save the revised song
    vscode.window.showInformationMessage('Revision accepted!')

    // Reset state for next revision
    this.state.originalSong = this.state.revisedSong
    this.state.revisionResult = null
    this.state.changes = []
    this.state.metrics = null
    this.state.revisedSong = null
    this.updateWebviewState()
  }

  /**
   * Handle revert revision request
   */
  private handleRevertRevision(): void {
    if (!this.state.originalSong) {
      vscode.window.showWarningMessage('No original song to revert to')
      return
    }

    vscode.window.showInformationMessage('Revision reverted to original')

    // Reset revision data
    this.state.revisionResult = null
    this.state.revisedSong = null
    this.state.changes = []
    this.state.metrics = null
    this.state.alternatives = []
    this.updateWebviewState()
  }

  /**
   * Handle viewing alternative version
   */
  private handleViewAlternative(message: ViewAlternativeMessage): void {
    const alternative = this.state.alternatives.find(a => a.versionId === message.versionId)
    if (alternative) {
      this.state.revisedSong = alternative.revisedSong
      this.state.changes = alternative.changes
      this.updateWebviewState()
    }
  }

  /**
   * Update webview with current state
   */
  private updateWebviewState(): void {
    if (!this.panel) return

    const webviewState = {
      originalSong: this.state.originalSong ? this.songToJson(this.state.originalSong) : null,
      revisedSong: this.state.revisedSong ? this.songToJson(this.state.revisedSong) : null,
      selectedStrategy: this.state.selectedStrategy,
      preserveVoice: this.state.preserveVoice,
      changes: this.state.changes.map(c => ({
        changeId: c.changeId,
        type: c.type,
        original: c.original,
        revised: c.revised,
        reason: c.reason,
        issueFixed: c.issueFixed,
        improvementScore: c.improvementScore
      })),
      metrics: this.state.metrics ? {
        beforeScore: this.state.metrics.beforeScore,
        afterScore: this.state.metrics.afterScore,
        improvement: this.state.metrics.improvement,
        issuesFixed: this.state.metrics.issuesFixed,
        issuesRemaining: this.state.metrics.issuesRemaining,
        categoryImprovements: this.state.metrics.categoryImprovements,
        qualityLevelChange: this.state.metrics.qualityLevelChange
      } : null,
      alternatives: this.state.alternatives.map(a => ({
        versionId: a.versionId,
        direction: a.direction,
        description: a.description,
        improvementScore: a.improvementScore
      })),
      isLoading: this.state.isLoading,
      error: this.state.error,
      hasRevision: !!this.state.revisionResult
    }

    this.panel.webview.postMessage({
      command: 'updateState',
      state: webviewState
    })
  }

  /**
   * Convert Song to JSON-serializable format
   */
  private songToJson(song: Song): object {
    return {
      id: song.id,
      title: song.title,
      verses: song.verses.map(v => ({
        id: v.id,
        number: v.number,
        lines: v.lines.map(l => ({
          text: l.text,
          syllables: l.syllables,
          stressPattern: l.stressPattern
        }))
      })),
      choruses: song.choruses.map(c => ({
        id: c.id,
        lines: c.lines.map(l => ({
          text: l.text,
          syllables: l.syllables,
          stressPattern: l.stressPattern
        }))
      })),
      bridge: song.bridge
        ? {
            id: song.bridge.id,
            lines: song.bridge.lines.map(l => ({
              text: l.text,
              syllables: l.syllables,
              stressPattern: l.stressPattern
            }))
          }
        : null,
      metadata: song.metadata,
      generatedAt: song.generatedAt.toISOString()
    }
  }

  /**
   * Get HTML content for webview
   */
  private getHtmlContent(): string {
    const nonce = this.getNonce()
    const styleUri = this.panel?.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'src', 'ui', 'styles', 'revision.css')
    )

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel?.webview.cspSource}; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${styleUri}">
  <title>Revision Tools</title>
</head>
<body>
  <div class="revision-container">
    <!-- Strategy Selection -->
    <section class="strategy-section">
      <h2>Revision Strategy</h2>
      <div class="strategy-options">
        <label class="strategy-radio">
          <input type="radio" name="strategy" value="conservative" data-nonce="${nonce}">
          <span class="strategy-label">Conservative</span>
          <span class="strategy-desc">Minimal changes, preserve original</span>
        </label>
        <label class="strategy-radio">
          <input type="radio" name="strategy" value="moderate" data-nonce="${nonce}" checked>
          <span class="strategy-label">Moderate</span>
          <span class="strategy-desc">Balanced improvements</span>
        </label>
        <label class="strategy-radio">
          <input type="radio" name="strategy" value="aggressive" data-nonce="${nonce}">
          <span class="strategy-label">Aggressive</span>
          <span class="strategy-desc">Major rewrites</span>
        </label>
        <label class="strategy-radio">
          <input type="radio" name="strategy" value="surgical" data-nonce="${nonce}">
          <span class="strategy-label">Surgical</span>
          <span class="strategy-desc">Targeted fixes only</span>
        </label>
        <label class="strategy-radio">
          <input type="radio" name="strategy" value="creative" data-nonce="${nonce}">
          <span class="strategy-label">Creative</span>
          <span class="strategy-desc">Explore new directions</span>
        </label>
      </div>

      <!-- Voice Preservation Toggle -->
      <div class="voice-preservation">
        <label class="toggle-switch">
          <input type="checkbox" id="voicePreservation" checked data-nonce="${nonce}">
          <span class="slider"></span>
        </label>
        <span class="toggle-label">Preserve Original Voice</span>
      </div>
    </section>

    <!-- Loading State -->
    <div id="loadingIndicator" class="loading-indicator hidden" data-nonce="${nonce}">
      <div class="spinner"></div>
      <p>Revising song...</p>
    </div>

    <!-- Error Display -->
    <div id="errorDisplay" class="error-display hidden" data-nonce="${nonce}">
      <p id="errorMessage"></p>
    </div>

    <!-- Revise Button -->
    <div class="action-buttons">
      <button id="reviseBtn" class="btn btn-primary" data-nonce="${nonce}">Revise Song</button>
    </div>

    <!-- Improvement Metrics -->
    <section id="metricsSection" class="metrics-section hidden" data-nonce="${nonce}">
      <h2>Improvement Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Before Score</div>
          <div id="beforeScore" class="metric-value">-</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">After Score</div>
          <div id="afterScore" class="metric-value">-</div>
        </div>
        <div class="metric-card highlight">
          <div class="metric-label">Improvement</div>
          <div id="improvement" class="metric-value">-</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Issues Fixed</div>
          <div id="issuesFixed" class="metric-value">-</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Issues Remaining</div>
          <div id="issuesRemaining" class="metric-value">-</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Quality Level</div>
          <div id="qualityLevel" class="metric-value">-</div>
        </div>
      </div>

      <!-- Category Improvements -->
      <div class="category-improvements">
        <h3>Category Improvements</h3>
        <div id="categoryMetrics" class="category-grid"></div>
      </div>
    </section>

    <!-- Change Tracker -->
    <section id="changesSection" class="changes-section hidden" data-nonce="${nonce}">
      <h2>Changes Made</h2>
      <div id="changesList" class="changes-list"></div>
    </section>

    <!-- Side-by-Side Comparison -->
    <section id="comparisonSection" class="comparison-section hidden" data-nonce="${nonce}">
      <h2>Before / After Comparison</h2>
      <div class="comparison-container">
        <div class="comparison-column">
          <h3>Original</h3>
          <div id="originalSongText" class="song-text"></div>
        </div>
        <div class="comparison-column">
          <h3>Revised</h3>
          <div id="revisedSongText" class="song-text"></div>
        </div>
      </div>
    </section>

    <!-- Alternatives Section -->
    <section id="alternativesSection" class="alternatives-section hidden" data-nonce="${nonce}">
      <h2>Alternative Versions</h2>
      <div id="alternativesList" class="alternatives-list"></div>
    </section>

    <!-- Action Buttons -->
    <div id="actionButtons" class="action-buttons-final hidden" data-nonce="${nonce}">
      <button id="acceptBtn" class="btn btn-success">Accept Revision</button>
      <button id="revertBtn" class="btn btn-secondary">Revert to Original</button>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    // Strategy selection
    document.querySelectorAll('input[name="strategy"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        vscode.postMessage({
          command: 'updateStrategy',
          strategy: e.target.value
        });
      });
    });

    // Voice preservation toggle
    document.getElementById('voicePreservation')?.addEventListener('change', (e) => {
      vscode.postMessage({
        command: 'toggleVoicePreservation',
        preserveVoice: e.target.checked
      });
    });

    // Revise button
    document.getElementById('reviseBtn')?.addEventListener('click', () => {
      vscode.postMessage({
        command: 'revise',
        targetIssues: null,
        voiceProfile: null,
        customFeedback: null
      });
    });

    // Accept button
    document.getElementById('acceptBtn')?.addEventListener('click', () => {
      vscode.postMessage({ command: 'acceptRevision' });
    });

    // Revert button
    document.getElementById('revertBtn')?.addEventListener('click', () => {
      vscode.postMessage({ command: 'revertRevision' });
    });

    // Handle state updates
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'updateState') {
        updateUI(message.state);
      }
    });

    function updateUI(state) {
      // Update metrics
      if (state.metrics) {
        document.getElementById('beforeScore').textContent = state.metrics.beforeScore.toFixed(1);
        document.getElementById('afterScore').textContent = state.metrics.afterScore.toFixed(1);
        document.getElementById('improvement').textContent = state.metrics.improvement.toFixed(1) + '%';
        document.getElementById('issuesFixed').textContent = state.metrics.issuesFixed;
        document.getElementById('issuesRemaining').textContent = state.metrics.issuesRemaining;
        document.getElementById('qualityLevel').textContent = state.metrics.qualityLevelChange;

        // Update category improvements
        const categoryMetrics = document.getElementById('categoryMetrics');
        if (categoryMetrics) {
          categoryMetrics.innerHTML = Object.entries(state.metrics.categoryImprovements)
            .map(([key, value]) => \`
              <div class="category-metric">
                <div class="category-name">\${key.replace(/_/g, ' ')}</div>
                <div class="category-change">\${value.before.toFixed(1)} → \${value.after.toFixed(1)}</div>
              </div>
            \`).join('');
        }

        document.getElementById('metricsSection')?.classList.remove('hidden');
      }

      // Update changes list
      if (state.changes && state.changes.length > 0) {
        const changesList = document.getElementById('changesList');
        if (changesList) {
          changesList.innerHTML = state.changes
            .map(change => \`
              <div class="change-item">
                <div class="change-type">\${change.type.replace(/_/g, ' ')}</div>
                <div class="change-original">\${change.original}</div>
                <div class="change-arrow">→</div>
                <div class="change-revised">\${change.revised}</div>
                <div class="change-reason">\${change.reason}</div>
              </div>
            \`).join('');
        }
        document.getElementById('changesSection')?.classList.remove('hidden');
      }

      // Update comparison
      if (state.originalSong && state.revisedSong) {
        document.getElementById('originalSongText').innerHTML = formatSongText(state.originalSong);
        document.getElementById('revisedSongText').innerHTML = formatSongText(state.revisedSong);
        document.getElementById('comparisonSection')?.classList.remove('hidden');
      }

      // Update alternatives
      if (state.alternatives && state.alternatives.length > 0) {
        const alternativesList = document.getElementById('alternativesList');
        if (alternativesList) {
          alternativesList.innerHTML = state.alternatives
            .map(alt => \`
              <div class="alternative-item">
                <div class="alternative-direction">\${alt.direction.replace(/_/g, ' ')}</div>
                <div class="alternative-description">\${alt.description}</div>
                <div class="alternative-score">Score: \${alt.improvementScore.toFixed(1)}</div>
                <button class="btn btn-sm" onclick="vscode.postMessage({ command: 'viewAlternative', versionId: '\${alt.versionId}' })">View</button>
              </div>
            \`).join('');
        }
        document.getElementById('alternativesSection')?.classList.remove('hidden');
      }

      // Update action buttons
      if (state.hasRevision) {
        document.getElementById('actionButtons')?.classList.remove('hidden');
      }

      // Update loading state
      if (state.isLoading) {
        document.getElementById('loadingIndicator')?.classList.remove('hidden');
      } else {
        document.getElementById('loadingIndicator')?.classList.add('hidden');
      }

      // Update error display
      if (state.error) {
        document.getElementById('errorMessage').textContent = state.error;
        document.getElementById('errorDisplay')?.classList.remove('hidden');
      } else {
        document.getElementById('errorDisplay')?.classList.add('hidden');
      }
    }

    function formatSongText(song) {
      let html = \`<div class="song-title">\${song.title}</div>\`;

      // Verses
      song.verses.forEach(verse => {
        html += \`<div class="section-label">Verse \${verse.number}</div>\`;
        html += \`<div class="section-content">\`;
        verse.lines.forEach(line => {
          html += \`<div class="song-line">\${line.text}</div>\`;
        });
        html += \`</div>\`;
      });

      // Choruses
      song.choruses.forEach(chorus => {
        html += \`<div class="section-label">Chorus</div>\`;
        html += \`<div class="section-content">\`;
        chorus.lines.forEach(line => {
          html += \`<div class="song-line">\${line.text}</div>\`;
        });
        html += \`</div>\`;
      });

      // Bridge
      if (song.bridge) {
        html += \`<div class="section-label">Bridge</div>\`;
        html += \`<div class="section-content">\`;
        song.bridge.lines.forEach(line => {
          html += \`<div class="song-line">\${line.text}</div>\`;
        });
        html += \`</div>\`;
      }

      return html;
    }
  </script>
</body>
</html>`
  }

  /**
   * Generate nonce for CSP
   */
  private getNonce(): string {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  /**
   * Get the currently revised song
   *
   * @returns The revised Song if available, or null if no revision has been made
   */
  getRevisedSong(): Song | null {
    return this.state.revisedSong
  }

  /**
   * Get the original song
   *
   * @returns The original Song if available, or null if not set
   */
  getOriginalSong(): Song | null {
    return this.state.originalSong
  }

  /**
   * Check if a revision is available
   *
   * @returns true if a revised song is available
   */
  hasRevision(): boolean {
    return this.state.revisedSong !== null
  }

  /**
   * Dispose the panel
   */
  dispose(): void {
    if (this.panel) {
      this.panel.dispose()
      this.panel = null
    }
  }
}

// Type definitions for message handlers
interface ReviseMessage {
  command: string
  targetIssues?: string[]
  voiceProfile?: unknown
  customFeedback?: string[]
}

interface StrategyChangeMessage {
  command: string
  strategy: string
}

interface VoicePreservationMessage {
  command: string
  preserveVoice: boolean
}

interface ViewAlternativeMessage {
  command: string
  versionId: string
}
