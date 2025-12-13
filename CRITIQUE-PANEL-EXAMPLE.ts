/**
 * @fileoverview Example usage of CritiquePanel
 * @purpose Demonstrate how to integrate CritiquePanel into the extension
 */

import * as vscode from 'vscode'
import { CritiquePanel } from './src/panels/CritiquePanel'
import { MockSongGenerationService } from './src/services/mock/MockSongGenerationService'
import { isSuccess } from './src/contracts/types/common'
import type { Song } from './src/contracts/types/song'
import { createSongId, createVerseId } from './src/contracts/types/song'
import { MockInputValidationService } from './src/services/mock/MockInputValidationService'

/**
 * Example 1: Show critique for a song
 */
export async function showCritiqueForSong(
  context: vscode.ExtensionContext,
  song: Song
): Promise<void> {
  // Create or show the critique panel
  const panel = CritiquePanel.createOrShow(context.extensionUri)

  // Display critique for the song
  await panel.displayCritique(song)

  // Panel will show in ViewColumn.Two (right side)
  vscode.window.showInformationMessage('Critique analysis complete!')
}

/**
 * Example 2: Generate song and show critique automatically
 */
export async function generateAndCritique(context: vscode.ExtensionContext): Promise<void> {
  const validationService = new MockInputValidationService()
  const generationService = new MockSongGenerationService()

  // Get user input
  const prompt = await vscode.window.showInputBox({
    prompt: 'Enter song prompt',
    placeHolder: 'A melancholic ballad about lost love...'
  })

  if (!prompt) {
    return
  }

  // Show progress
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Generating and analyzing song...',
      cancellable: false
    },
    async (progress) => {
      // Validate input first
      progress.report({ increment: 0, message: 'Validating input...' })

      const validationResult = await validationService.validate({
        prompt,
        context: { genre: 'pop', mood: 'melancholic' }
      })

      if (!isSuccess(validationResult)) {
        vscode.window.showErrorMessage(`Validation failed: ${validationResult.error.message}`)
        return
      }

      // Generate song with validated prompt
      progress.report({ increment: 25, message: 'Generating lyrics...' })

      const result = await generationService.generate({
        prompt: validationResult.data.validatedPrompt,
        style: {
          genre: 'pop',
          mood: 'melancholic'
        }
      })

      if (isSuccess(result)) {
        const song = result.data.song

        // Show critique
        progress.report({ increment: 50, message: 'Analyzing quality...' })

        const panel = CritiquePanel.createOrShow(context.extensionUri)
        await panel.displayCritique(song)

        progress.report({ increment: 100, message: 'Complete!' })
      } else {
        vscode.window.showErrorMessage(`Generation failed: ${result.error.message}`)
      }
    }
  )
}

/**
 * Example 3: Register commands for CritiquePanel
 */
export function registerCritiqueCommands(context: vscode.ExtensionContext): void {
  // Command: Critique Current Song
  const critiqueSongCommand = vscode.commands.registerCommand(
    'songwriting-assistant.critiqueSong',
    async (song?: Song) => {
      if (!song) {
        vscode.window.showErrorMessage('No song to critique')
        return
      }

      const panel = CritiquePanel.createOrShow(context.extensionUri)
      await panel.displayCritique(song)
    }
  )

  // Command: Quick Critique from Text
  const quickCritiqueCommand = vscode.commands.registerCommand(
    'songwriting-assistant.quickCritique',
    async () => {
      // Get text from active editor
      const editor = vscode.window.activeTextEditor
      if (!editor) {
        vscode.window.showErrorMessage('No active editor')
        return
      }

      const text = editor.document.getText()
      if (!text.trim()) {
        vscode.window.showErrorMessage('Editor is empty')
        return
      }

      // Parse text to song (simplified for example)
      // In real implementation, use proper song parser
      const song: Song = {
        id: createSongId('temp_song'),
        title: 'Untitled',
        verses: [
          {
            id: createVerseId('verse_1'),
            number: 1,
            lines: text.split('\n').filter(l => l.trim()).map(text => ({
              text,
              syllables: text.split(' ').length * 2,
              stressPattern: 'x/x/x/x/'
            })),
            rhymeScheme: 'ABAB',
            syllablePattern: [8, 8, 8, 8]
          }
        ],
        choruses: [],
        metadata: {
          version: 1
        },
        generatedAt: new Date()
      }

      const panel = CritiquePanel.createOrShow(context.extensionUri)
      await panel.displayCritique(song)
    }
  )

  context.subscriptions.push(critiqueSongCommand, quickCritiqueCommand)
}

/**
 * Example 4: Batch critique multiple songs
 */
export async function batchCritique(
  context: vscode.ExtensionContext,
  songs: Song[]
): Promise<void> {
  if (songs.length === 0) {
    vscode.window.showWarningMessage('No songs to critique')
    return
  }

  // Show quick pick to select song
  const items = songs.map((song, index) => ({
    label: song.title || `Song ${index + 1}`,
    description: song.metadata.genre || 'No genre',
    song
  }))

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a song to critique'
  })

  if (selected) {
    const panel = CritiquePanel.createOrShow(context.extensionUri)
    await panel.displayCritique(selected.song)
  }
}

/**
 * Example 5: Compare before/after critique
 */
export async function compareRevisions(
  context: vscode.ExtensionContext,
  originalSong: Song,
  revisedSong: Song
): Promise<void> {
  // Show original critique
  const panel1 = CritiquePanel.createOrShow(context.extensionUri)
  await panel1.displayCritique(originalSong)

  // Ask if user wants to see revised critique
  const showRevised = await vscode.window.showInformationMessage(
    'Original critique shown. View revised version?',
    'Yes',
    'No'
  )

  if (showRevised === 'Yes') {
    await panel1.displayCritique(revisedSong)

    // Show improvement summary
    // In real implementation, calculate score difference
    vscode.window.showInformationMessage(
      'Revision complete! Check the updated critique.'
    )
  }
}
