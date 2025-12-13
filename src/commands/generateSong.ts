/**
 * @fileoverview Generate Song Command
 * @purpose Handle user request to generate a new song
 * @updated 2025-11-17
 */

import * as vscode from 'vscode'
import type { Services } from '../services/factory'
import { SongGenerationPanel } from '../panels/SongGenerationPanel'

/**
 * Generate Song command handler
 * Opens the Song Generation webview panel
 */
export async function generateSongCommand(_services: Services, extensionUri: vscode.Uri): Promise<void> {
  try {
    // Open the Song Generation webview panel
    SongGenerationPanel.createOrShow(extensionUri)
  } catch (error) {
    console.error('Error opening Song Generation panel:', error)
    vscode.window.showErrorMessage(
      `Failed to open Song Generation panel: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
