/**
 * @fileoverview Critique Display Webview Panel
 * @purpose Display comprehensive song quality analysis in VSCode webview
 * @phase Phase 4 - UI Development
 * @updated 2025-11-17
 */

import * as vscode from 'vscode'
import type { CritiqueReport, QualityLevel } from '../contracts/CritiqueEngine'
import type { Song } from '../contracts/types/song'
import { MockCritiqueEngineService } from '../services/mock/MockCritiqueEngineService'
import { isSuccess } from '../contracts/types/common'

/**
 * CritiquePanel - Displays song quality analysis in a webview
 */
export class CritiquePanel {
  public static currentPanel: CritiquePanel | undefined

  private readonly panel: vscode.WebviewPanel
  private readonly extensionUri: vscode.Uri
  private readonly critiqueService: MockCritiqueEngineService
  private disposables: vscode.Disposable[] = []

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel
    this.extensionUri = extensionUri
    this.critiqueService = new MockCritiqueEngineService()

    // Set initial HTML content
    this.panel.webview.html = this.getLoadingHtml()

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        await this.handleMessage(message)
      },
      null,
      this.disposables
    )

    // Clean up when panel is closed
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables)
  }

  /**
   * Create or show the critique panel
   */
  public static createOrShow(extensionUri: vscode.Uri): CritiquePanel {
    const column = vscode.ViewColumn.Two

    // If we already have a panel, show it
    if (CritiquePanel.currentPanel) {
      CritiquePanel.currentPanel.panel.reveal(column)
      return CritiquePanel.currentPanel
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'songCritique',
      'Song Critique',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src', 'ui'),
          vscode.Uri.joinPath(extensionUri, 'src', 'ui', 'styles')
        ]
      }
    )

    CritiquePanel.currentPanel = new CritiquePanel(panel, extensionUri)
    return CritiquePanel.currentPanel
  }

  /**
   * Display critique for a song
   */
  public async displayCritique(song: Song): Promise<void> {
    // Update panel title
    this.panel.title = `Critique: ${song.title || 'Untitled'}`

    // Show loading state
    this.panel.webview.html = this.getLoadingHtml()

    // Analyze song
    const result = await this.critiqueService.analyzeSong(song)

    if (isSuccess(result)) {
      // Display critique
      this.panel.webview.html = this.getCritiqueHtml(result.data, song)
    } else {
      // Display error
      this.panel.webview.html = this.getErrorHtml(result.error.message)
    }
  }

  /**
   * Handle messages from webview
   */
  private async handleMessage(message: { type: string; payload?: unknown }): Promise<void> {
    switch (message.type) {
      case 'applySuggestions':
        await vscode.window.showInformationMessage('Apply Suggestions clicked (not yet implemented)')
        break

      case 'revise':
        await vscode.window.showInformationMessage('Revise Song clicked (not yet implemented)')
        break

      case 'close':
        this.panel.dispose()
        break

      default:
        console.log('Unknown message type:', message.type)
    }
  }

  /**
   * Get loading HTML
   */
  private getLoadingHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading...</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    .spinner {
      border: 4px solid var(--vscode-widget-border);
      border-top: 4px solid var(--vscode-progressBar-background);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="spinner"></div>
</body>
</html>`
  }

  /**
   * Get error HTML
   */
  private getErrorHtml(message: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    body {
      padding: 20px;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    .error-container {
      padding: 20px;
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      border-radius: 4px;
    }
    h1 {
      margin-top: 0;
      color: var(--vscode-errorForeground);
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>Error</h1>
    <p>${this.escapeHtml(message)}</p>
  </div>
</body>
</html>`
  }

  /**
   * Get critique HTML
   */
  private getCritiqueHtml(report: CritiqueReport, song: Song): string {
    const styleUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'src', 'ui', 'styles', 'critique.css')
    )

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Critique: ${this.escapeHtml(song.title || 'Untitled')}</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div class="critique-container">
    ${this.getHeaderHtml(song, report)}
    ${this.getOverallScoreHtml(report)}
    ${this.getQualityScoresHtml(report)}
    ${this.getIssuesHtml(report)}
    ${this.getSuggestionsHtml(report)}
    ${this.getStrengthsHtml(report)}
    ${this.getActionsHtml(report)}
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function applySuggestions() {
      vscode.postMessage({ type: 'applySuggestions' });
    }

    function revise() {
      vscode.postMessage({ type: 'revise' });
    }
  </script>
</body>
</html>`
  }

  /**
   * Get header HTML
   */
  private getHeaderHtml(song: Song, report: CritiqueReport): string {
    return `
<header class="critique-header">
  <h1>${this.escapeHtml(song.title || 'Untitled Song')}</h1>
  <p class="song-metadata">
    ${song.metadata.genre ? `<span class="metadata-tag">${this.escapeHtml(song.metadata.genre)}</span>` : ''}
    ${song.metadata.mood ? `<span class="metadata-tag">${this.escapeHtml(song.metadata.mood)}</span>` : ''}
  </p>
  <p class="analysis-date">Analyzed: ${report.generatedAt.toLocaleString()}</p>
</header>`
  }

  /**
   * Get overall score HTML
   */
  private getOverallScoreHtml(report: CritiqueReport): string {
    const qualityClass = this.getQualityClass(report.qualityLevel)
    const qualityLabel = this.getQualityLabel(report.qualityLevel)

    return `
<section class="overall-score">
  <div class="score-circle ${qualityClass}">
    <div class="score-value">${report.overallScore}</div>
    <div class="score-label">Overall Score</div>
  </div>
  <div class="quality-info">
    <div class="quality-badge ${qualityClass}">${qualityLabel}</div>
    <div class="gold-standard">
      ${report.passesGoldStandard
        ? '<span class="pass">✓ Passes Gold Standard</span>'
        : '<span class="fail">✗ Does Not Pass Gold Standard</span>'}
    </div>
  </div>
</section>`
  }

  /**
   * Get quality scores HTML
   */
  private getQualityScoresHtml(report: CritiqueReport): string {
    const scores = [
      { label: 'Rhyme Quality', value: report.scores.rhymeQuality },
      { label: 'Flow Consistency', value: report.scores.flowConsistency },
      { label: 'Imagery Vividness', value: report.scores.imageryVividness },
      { label: 'Emotional Authenticity', value: report.scores.emotionalAuthenticity },
      { label: 'Originality', value: report.scores.originalityScore },
      { label: 'Voice Consistency', value: report.scores.voiceConsistency },
      { label: 'Structural Coherence', value: report.scores.structuralCoherence },
      { label: 'Technical Execution', value: report.scores.technicalExecution }
    ]

    const scoreHtml = scores
      .map(
        (score) => `
<div class="score-item">
  <div class="score-item-header">
    <span class="score-item-label">${score.label}</span>
    <span class="score-item-value ${this.getScoreClass(score.value)}">${score.value}</span>
  </div>
  <div class="score-bar">
    <div class="score-bar-fill ${this.getScoreClass(score.value)}" style="width: ${score.value}%"></div>
  </div>
</div>`
      )
      .join('')

    return `
<section class="quality-scores">
  <h2>Quality Breakdown</h2>
  <div class="scores-grid">
    ${scoreHtml}
  </div>
</section>`
  }

  /**
   * Get issues HTML
   */
  private getIssuesHtml(report: CritiqueReport): string {
    if (report.issues.length === 0) {
      return `
<section class="issues">
  <h2>Issues</h2>
  <p class="no-issues">No issues found! Excellent work!</p>
</section>`
    }

    // Group issues by severity
    const criticalIssues = report.issues.filter((i) => i.severity === 'critical')
    const majorIssues = report.issues.filter((i) => i.severity === 'major')
    const minorIssues = report.issues.filter((i) => i.severity === 'minor')
    const infoIssues = report.issues.filter((i) => i.severity === 'info')

    const renderIssueGroup = (title: string, issues: typeof report.issues, severityClass: string) => {
      if (issues.length === 0) return ''

      const issuesHtml = issues
        .map(
          (issue) => `
<div class="issue-item ${severityClass}">
  <div class="issue-header">
    <span class="issue-severity">${issue.severity.toUpperCase()}</span>
    <span class="issue-type">${this.formatIssueType(issue.issueType)}</span>
    ${issue.score_impact ? `<span class="issue-impact">-${issue.score_impact} pts</span>` : ''}
  </div>
  <p class="issue-message">${this.escapeHtml(issue.message)}</p>
  ${issue.suggestion ? `<p class="issue-suggestion">💡 ${this.escapeHtml(issue.suggestion)}</p>` : ''}
  ${issue.affectedLines.length > 0 ? `<p class="issue-lines">Lines: ${issue.affectedLines.join(', ')}</p>` : ''}
</div>`
        )
        .join('')

      return `
<div class="issue-group">
  <h3>${title} (${issues.length})</h3>
  ${issuesHtml}
</div>`
    }

    return `
<section class="issues">
  <h2>Issues (${report.issues.length})</h2>
  ${renderIssueGroup('Critical', criticalIssues, 'severity-critical')}
  ${renderIssueGroup('Major', majorIssues, 'severity-major')}
  ${renderIssueGroup('Minor', minorIssues, 'severity-minor')}
  ${renderIssueGroup('Info', infoIssues, 'severity-info')}
</section>`
  }

  /**
   * Get suggestions HTML
   */
  private getSuggestionsHtml(report: CritiqueReport): string {
    if (report.suggestions.length === 0) {
      return ''
    }

    const suggestionsHtml = report.suggestions
      .map(
        (suggestion) => `
<div class="suggestion-item">
  <div class="suggestion-type">${this.formatIssueType(suggestion.type)}</div>
  <p class="suggestion-description">${this.escapeHtml(suggestion.description)}</p>
  ${
    suggestion.alternatives && suggestion.alternatives.length > 0
      ? `
  <div class="suggestion-alternatives">
    <strong>Alternatives:</strong>
    <ul>
      ${suggestion.alternatives.map((alt) => `<li>${this.escapeHtml(alt)}</li>`).join('')}
    </ul>
  </div>`
      : ''
  }
</div>`
      )
      .join('')

    return `
<section class="suggestions">
  <h2>Suggestions (${report.suggestions.length})</h2>
  <div class="suggestions-list">
    ${suggestionsHtml}
  </div>
</section>`
  }

  /**
   * Get strengths HTML
   */
  private getStrengthsHtml(report: CritiqueReport): string {
    if (report.strengths.length === 0) {
      return ''
    }

    const strengthsHtml = report.strengths
      .map((strength) => `<li>${this.escapeHtml(strength)}</li>`)
      .join('')

    return `
<section class="strengths">
  <h2>Strengths</h2>
  <ul class="strengths-list">
    ${strengthsHtml}
  </ul>
</section>`
  }

  /**
   * Get actions HTML
   */
  private getActionsHtml(report: CritiqueReport): string {
    const canRevise = !report.passesGoldStandard || report.issues.length > 0

    return `
<section class="actions">
  ${report.suggestions.length > 0 ? '<button class="action-button primary" onclick="applySuggestions()">Apply Suggestions</button>' : ''}
  ${canRevise ? '<button class="action-button secondary" onclick="revise()">Revise Song</button>' : ''}
</section>`
  }

  /**
   * Get quality class for styling
   */
  private getQualityClass(level: QualityLevel): string {
    switch (level) {
      case 'gold':
        return 'quality-gold'
      case 'excellent':
        return 'quality-excellent'
      case 'good':
        return 'quality-good'
      case 'acceptable':
        return 'quality-acceptable'
      case 'needs_work':
        return 'quality-needs-work'
      case 'poor':
        return 'quality-poor'
      default:
        return 'quality-unknown'
    }
  }

  /**
   * Get quality label
   */
  private getQualityLabel(level: QualityLevel): string {
    switch (level) {
      case 'gold':
        return 'Gold Standard'
      case 'excellent':
        return 'Excellent'
      case 'good':
        return 'Good'
      case 'acceptable':
        return 'Acceptable'
      case 'needs_work':
        return 'Needs Work'
      case 'poor':
        return 'Poor'
      default:
        return 'Unknown'
    }
  }

  /**
   * Get score class for color coding
   */
  private getScoreClass(score: number): string {
    if (score >= 90) return 'score-gold'
    if (score >= 80) return 'score-excellent'
    if (score >= 70) return 'score-good'
    if (score >= 60) return 'score-acceptable'
    if (score >= 40) return 'score-needs-work'
    return 'score-poor'
  }

  /**
   * Format issue type for display
   */
  private formatIssueType(type: string): string {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  /**
   * Dispose of the panel
   */
  public dispose(): void {
    CritiquePanel.currentPanel = undefined

    // Clean up resources
    this.panel.dispose()

    while (this.disposables.length) {
      const disposable = this.disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }
}
