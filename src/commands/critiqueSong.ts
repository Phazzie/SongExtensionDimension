/**
 * @fileoverview Critique Song Command
 * @purpose Analyze song quality against professional standards
 * @updated 2025-11-17
 */

import * as vscode from 'vscode'
import type { Services } from '../services/factory'
import { CritiquePanel } from '../panels/CritiquePanel'
import type { Song } from '../contracts/types/song'

/**
 * Critique Song command handler
 */
export async function critiqueSongCommand(
  _services: Services,
  extensionUri: vscode.Uri,
  song?: Song
): Promise<void> {
  try {
    // If song not provided, we need to get it from somewhere
    // (e.g., current editor, storage, or ask user to generate first)
    if (!song) {
      const response = await vscode.window.showInformationMessage(
        'No song loaded. Would you like to generate a song first?',
        'Generate Song',
        'Cancel'
      )

      if (response === 'Generate Song') {
        await vscode.commands.executeCommand('songwriting-assistant.generateSong')
      }
      return
    }

    // Ask user for critique level
    const critiqueLevel = await vscode.window.showQuickPick(
      [
        { label: 'Casual', description: 'Lenient feedback for practice', value: 'casual' },
        {
          label: 'Professional',
          description: 'Standard professional quality feedback',
          value: 'professional'
        },
        {
          label: 'Gold Standard',
          description: 'Elite publication-ready feedback (strict)',
          value: 'gold-standard'
        }
      ],
      { title: 'Select Critique Level', placeHolder: 'Choose how detailed you want feedback' }
    )

    if (!critiqueLevel) {
      return
    }

    // Show progress while analyzing
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing song quality...',
        cancellable: false
      },
      async (progress) => {
        progress.report({ increment: 0, message: 'Initializing analysis...' })

        // Create or show critique panel
        const panel = CritiquePanel.createOrShow(extensionUri)

        progress.report({ increment: 50, message: 'Analyzing quality metrics...' })

        // Display critique for the song
        await panel.displayCritique(song)

        progress.report({ increment: 100, message: 'Complete!' })

        // Show success message
        vscode.window.showInformationMessage(
          `Song critique complete at ${critiqueLevel.label} level!`
        )
      }
    )
  } catch (error) {
    console.error('Error in critiqueSongCommand:', error)
    vscode.window.showErrorMessage(
      `Failed to critique song: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
