/**
 * @fileoverview Export Panel - VSCode Webview Panel for Song Export
 * @purpose Handle UI interactions for exporting songs to various formats
 * @features Format selection, template selection, Suno version selection, file dialogs
 * @updated 2025-11-17
 */

import type { WebviewPanel, WebviewPanelOnDidChangeViewStateEvent, Uri } from 'vscode'
import { ViewColumn, window } from 'vscode'
import type { Song } from '../contracts/types/song'
import type {
  ExportFormat,
  ExportOptions,
  ExportResult
} from '../contracts/Export'
import { ExportFormat as ExportFormatEnum } from '../contracts/Export'
import { SunoVersion } from '../contracts/SunoFormatter'
import { MockExportService } from '../services/mock/MockExportService'
import { MockSunoFormatterService } from '../services/mock/MockSunoFormatterService'
import type { ServiceResponse } from '../contracts/types/common'

/**
 * Message from webview
 */
interface WebviewMessage {
  readonly command: string
  readonly data?: Record<string, any>
}

/**
 * Export form data from webview
 */
interface ExportFormData {
  readonly format: ExportFormat
  readonly templateId?: string
  readonly sunoVersion?: SunoVersion
  readonly includeMetadata: boolean
  readonly includeCritique: boolean
  readonly includeHistory: boolean
  readonly filePath?: string
}

/**
 * Export Panel Manager
 *
 * Handles all webview interactions for song export functionality.
 * Communicates with MockExportService and MockSunoFormatterService.
 */
export class ExportPanel {
  private panel: WebviewPanel | undefined
  private exportService: MockExportService
  private sunoFormatterService: MockSunoFormatterService
  private currentSong: Song | undefined

  constructor() {
    this.exportService = new MockExportService()
    this.sunoFormatterService = new MockSunoFormatterService()
  }

  /**
   * Create and show export panel
   */
  async show(song: Song, extensionUri: Uri): Promise<void> {
    this.currentSong = song

    // Reuse existing panel if available
    if (this.panel) {
      this.panel.reveal(ViewColumn.Beside)
      return
    }

    // Create new panel
    this.panel = window.createWebviewPanel(
      'songExportPanel',
      'Export Song',
      ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: false,
        localResourceRoots: [extensionUri]
      }
    )

    // Set HTML content
    this.panel.webview.html = await this.getWebviewContent()

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => this.handleWebviewMessage(message),
      undefined
    )

    // Handle panel visibility changes
    this.panel.onDidChangeViewState(
      (e: WebviewPanelOnDidChangeViewStateEvent) => this.handlePanelVisibilityChange(e),
      undefined
    )

    // Handle panel disposal
    this.panel.onDidDispose(
      () => {
        this.panel = undefined
      },
      undefined
    )

    // Load initial data
    void this.loadInitialData()
  }

  /**
   * Load initial data (templates, etc.)
   */
  private async loadInitialData(): Promise<void> {
    // Get available templates
    const templateResult = await this.exportService.listTemplates()

    if (isSuccess(templateResult)) {
      // Send templates to webview
      this.postMessage({
        command: 'templatesLoaded',
        data: {
          templates: templateResult.data,
          currentSongTitle: this.currentSong?.title || 'Untitled Song'
        }
      })
    }
  }

  /**
   * Handle messages from webview
   */
  private async handleWebviewMessage(message: WebviewMessage): Promise<void> {
    switch (message.command) {
      case 'export':
        await this.handleExport(message.data as ExportFormData)
        break

      case 'preview':
        await this.handlePreview(message.data as { format: ExportFormat })
        break

      case 'suggestSunoTags':
        await this.handleSuggestSunoTags(message.data as { version: SunoVersion })
        break

      case 'validateSunoFormat':
        await this.handleValidateSunoFormat(
          message.data as { formattedText: string; version: SunoVersion }
        )
        break

      case 'getDefaultPath':
        await this.handleGetDefaultPath(message.data as { format: ExportFormat })
        break

      case 'convertSunoVersion':
        await this.handleConvertSunoVersion(
          message.data as {
            formattedText: string
            fromVersion: SunoVersion
            toVersion: SunoVersion
          }
        )
        break

      default:
        window.showWarningMessage(`Unknown command: ${message.command}`)
    }
  }

  /**
   * Handle export request
   */
  private async handleExport(formData: ExportFormData): Promise<void> {
    if (!this.currentSong) {
      this.postMessage({
        command: 'error',
        data: { message: 'No song loaded for export' }
      })
      return
    }

    try {
      // Show progress
      this.postMessage({
        command: 'exportStarted',
        data: { format: formData.format }
      })

      // Build export options
      const exportOptions: ExportOptions = {
        format: formData.format,
        filePath: formData.filePath,
        includeMetadata: formData.includeMetadata,
        includeCritique: formData.includeCritique,
        includeHistory: formData.includeHistory
      }

      // Special handling for Suno format
      if (formData.format === ExportFormatEnum.SUNO) {
        const sunoResult = await this.sunoFormatterService.formatSong(this.currentSong, {
          version: formData.sunoVersion || SunoVersion.V5_0,
          includeTags: true,
          trimToFit: true
        })

        if (!isSuccess(sunoResult)) {
          this.postMessage({
            command: 'error',
            data: { message: sunoResult.error.message }
          })
          return
        }

        // Show Suno format preview
        this.postMessage({
          command: 'sunoFormatted',
          data: {
            formattedText: sunoResult.data.formattedText,
            characterCount: sunoResult.data.characterCount,
            validation: sunoResult.data.validation,
            appliedTags: sunoResult.data.appliedTags
          }
        })
      }

      // Export the song
      const result = await this.exportService.exportSong(this.currentSong, exportOptions)

      if (isSuccess(result)) {
        // Show success message
        this.postMessage({
          command: 'exportSuccess',
          data: {
            filePath: result.data.filePath,
            fileSize: result.data.fileSize,
            format: result.data.format,
            exportedAt: result.data.exportedAt
          }
        })

        // Ask user to save file
        await this.promptFileSave(result.data)
      } else {
        this.postMessage({
          command: 'error',
          data: { message: result.error.message }
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during export'
      this.postMessage({
        command: 'error',
        data: { message: errorMessage }
      })
    }
  }

  /**
   * Handle preview request
   */
  private async handlePreview(data: { format: ExportFormat }): Promise<void> {
    if (!this.currentSong) {
      this.postMessage({
        command: 'error',
        data: { message: 'No song loaded for preview' }
      })
      return
    }

    try {
      const result = await this.exportService.previewExport(this.currentSong, data.format)

      if (isSuccess(result)) {
        this.postMessage({
          command: 'previewReady',
          data: {
            preview: result.data,
            format: data.format
          }
        })
      } else {
        this.postMessage({
          command: 'previewError',
          data: { message: result.error.message }
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during preview'
      this.postMessage({
        command: 'error',
        data: { message: errorMessage }
      })
    }
  }

  /**
   * Handle Suno tag suggestions
   */
  private async handleSuggestSunoTags(data: { version: SunoVersion }): Promise<void> {
    if (!this.currentSong) {
      this.postMessage({
        command: 'error',
        data: { message: 'No song loaded' }
      })
      return
    }

    try {
      const result = await this.sunoFormatterService.suggestTags(this.currentSong)

      if (isSuccess(result)) {
        this.postMessage({
          command: 'sunoTagsSuggested',
          data: {
            suggestions: result.data,
            version: data.version
          }
        })
      } else {
        this.postMessage({
          command: 'error',
          data: { message: result.error.message }
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.postMessage({
        command: 'error',
        data: { message: errorMessage }
      })
    }
  }

  /**
   * Handle Suno format validation
   */
  private async handleValidateSunoFormat(data: {
    formattedText: string
    version: SunoVersion
  }): Promise<void> {
    try {
      const result = await this.sunoFormatterService.validateFormat(
        data.formattedText,
        data.version
      )

      if (isSuccess(result)) {
        this.postMessage({
          command: 'sunoValidationResult',
          data: {
            validation: result.data
          }
        })
      } else {
        this.postMessage({
          command: 'error',
          data: { message: result.error.message }
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.postMessage({
        command: 'error',
        data: { message: errorMessage }
      })
    }
  }

  /**
   * Handle get default path request
   */
  private async handleGetDefaultPath(data: { format: ExportFormat }): Promise<void> {
    if (!this.currentSong) {
      this.postMessage({
        command: 'error',
        data: { message: 'No song loaded' }
      })
      return
    }

    try {
      const result = await this.exportService.getDefaultExportPath(this.currentSong, data.format)

      if (isSuccess(result)) {
        this.postMessage({
          command: 'defaultPathReady',
          data: {
            filePath: result.data,
            format: data.format
          }
        })
      } else {
        this.postMessage({
          command: 'error',
          data: { message: result.error.message }
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.postMessage({
        command: 'error',
        data: { message: errorMessage }
      })
    }
  }

  /**
   * Handle Suno version conversion
   */
  private async handleConvertSunoVersion(data: {
    formattedText: string
    fromVersion: SunoVersion
    toVersion: SunoVersion
  }): Promise<void> {
    try {
      const result = await this.sunoFormatterService.convertVersion(
        data.formattedText,
        data.fromVersion,
        data.toVersion
      )

      if (isSuccess(result)) {
        this.postMessage({
          command: 'sunoVersionConverted',
          data: {
            convertedText: result.data,
            toVersion: data.toVersion
          }
        })
      } else {
        this.postMessage({
          command: 'error',
          data: { message: result.error.message }
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.postMessage({
        command: 'error',
        data: { message: errorMessage }
      })
    }
  }

  /**
   * Handle panel visibility changes
   */
  private handlePanelVisibilityChange(e: WebviewPanelOnDidChangeViewStateEvent): void {
    if (e.webviewPanel.visible) {
      // Panel became visible, reload data if needed
      if (this.currentSong) {
        this.loadInitialData()
      }
    }
  }

  /**
   * Prompt user to save file
   */
  private async promptFileSave(exportResult: ExportResult): Promise<void> {
    const action = await window.showInformationMessage(
      `Export successful! File: ${exportResult.filePath}`,
      'Copy Path',
      'View File',
      'Done'
    )

    if (action === 'Copy Path') {
      // In a real implementation, this would copy to clipboard
      window.showInformationMessage(`Path copied: ${exportResult.filePath}`)
    } else if (action === 'View File') {
      window.showInformationMessage(`File location: ${exportResult.filePath}`)
    }
  }

  /**
   * Generate webview HTML content
   */
  private async getWebviewContent(): Promise<string> {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Export Song</title>
  <link rel="stylesheet" href="${this.getStyleUri('export.css')}">
</head>
<body>
  <div class="export-panel">
    <h1>Export Song</h1>

    <div class="export-content">
      <!-- Song Info -->
      <section class="song-info">
        <h2 id="songTitle">Untitled Song</h2>
        <p id="songStats"></p>
      </section>

      <!-- Export Options -->
      <section class="export-options">
        <h3>Export Settings</h3>

        <!-- Format Selector -->
        <div class="form-group">
          <label for="formatSelect">Export Format:</label>
          <select id="formatSelect" class="format-selector">
            <option value="text">Plain Text (.txt)</option>
            <option value="markdown">Markdown (.md)</option>
            <option value="json">JSON (.json)</option>
            <option value="pdf">PDF (.pdf)</option>
            <option value="html">HTML (.html)</option>
            <option value="suno">Suno Format (.txt)</option>
          </select>
        </div>

        <!-- Template Selector -->
        <div class="form-group">
          <label for="templateSelect">Template:</label>
          <select id="templateSelect" class="template-selector">
            <option value="">-- No Template --</option>
          </select>
          <p id="templateDescription" class="template-description"></p>
        </div>

        <!-- Suno Version Selector (shown only for Suno format) -->
        <div class="form-group" id="sunoVersionGroup" style="display: none;">
          <label for="sunoVersion">Suno Version:</label>
          <select id="sunoVersion" class="suno-version-selector">
            <option value="v4.0">Suno v4.0</option>
            <option value="v4.5">Suno v4.5</option>
            <option value="v5.0" selected>Suno v5.0 (Recommended)</option>
          </select>
        </div>

        <!-- Export Options Checkboxes -->
        <div class="export-options-group">
          <h4>Include in Export:</h4>
          <div class="checkbox-group">
            <label>
              <input type="checkbox" id="includeMetadata" checked>
              Metadata (genre, mood, theme)
            </label>
            <label>
              <input type="checkbox" id="includeCritique">
              Critique Report
            </label>
            <label>
              <input type="checkbox" id="includeHistory">
              Modification History
            </label>
          </div>
        </div>

        <!-- File Path -->
        <div class="form-group">
          <label for="filePath">File Path (optional):</label>
          <div class="file-path-input">
            <input type="text" id="filePath" placeholder="Leave blank for default location">
            <button id="browseBtn" class="browse-btn">Browse</button>
          </div>
        </div>
      </section>

      <!-- Preview Section -->
      <section class="preview-section" id="previewSection" style="display: none;">
        <h3>Preview</h3>
        <div id="previewContent" class="preview-content"></div>
        <div class="preview-controls">
          <button id="copyPreviewBtn" class="button-secondary">Copy Preview</button>
          <button id="clearPreviewBtn" class="button-secondary">Clear</button>
        </div>
      </section>

      <!-- Suno Format Details (shown only for Suno format) -->
      <section class="suno-details" id="sunoDetailsSection" style="display: none;">
        <h3>Suno Format Details</h3>

        <div class="suno-stats">
          <div class="stat-box">
            <span class="stat-label">Character Count:</span>
            <span id="charCount" class="stat-value">0</span>
            <span class="stat-limit">/ 3000</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Status:</span>
            <span id="charStatus" class="stat-value success">OK</span>
          </div>
        </div>

        <div class="validation-messages" id="validationMessages"></div>

        <div class="suno-tags">
          <h4>Applied Tags</h4>
          <div id="appliedTagsList" class="tags-list"></div>
        </div>

        <div class="suno-suggestions">
          <h4>Tag Suggestions</h4>
          <button id="suggestTagsBtn" class="button-secondary">Get Suggestions</button>
          <div id="tagSuggestionsList" class="suggestions-list"></div>
        </div>

        <div class="version-conversion">
          <h4>Convert Version</h4>
          <div class="form-group">
            <label for="convertToVersion">Convert to:</label>
            <select id="convertToVersion">
              <option value="v4.0">Suno v4.0</option>
              <option value="v4.5">Suno v4.5</option>
              <option value="v5.0">Suno v5.0</option>
            </select>
            <button id="convertVersionBtn" class="button-secondary">Convert</button>
          </div>
        </div>
      </section>

      <!-- Action Buttons -->
      <section class="action-buttons">
        <button id="previewBtn" class="button-secondary">Preview</button>
        <button id="exportBtn" class="button-primary">Export</button>
        <button id="cancelBtn" class="button-secondary">Cancel</button>
      </section>

      <!-- Status Messages -->
      <div id="statusMessage" class="status-message" style="display: none;"></div>
      <div id="errorMessage" class="error-message" style="display: none;"></div>
    </div>
  </div>

  <script src="${this.getScriptUri('export.js')}"></script>
</body>
</html>
    `
  }

  /**
   * Get style URI
   */
  private getStyleUri(fileName: string): string {
    // In real VSCode extension, this would use webview.asWebviewUri()
    return fileName
  }

  /**
   * Get script URI
   */
  private getScriptUri(fileName: string): string {
    // In real VSCode extension, this would use webview.asWebviewUri()
    return fileName
  }

  /**
   * Post message to webview
   */
  private postMessage(message: Record<string, any>): void {
    if (this.panel) {
      // postMessage returns Thenable<boolean>, ignore the result
      void this.panel.webview.postMessage(message)
    }
  }

  /**
   * Dispose panel
   */
  dispose(): void {
    if (this.panel) {
      this.panel.dispose()
      this.panel = undefined
    }
  }
}

/**
 * Helper to check if response is success
 */
function isSuccess<T>(response: ServiceResponse<T>): response is { success: true; data: T } {
  return response.success === true
}
