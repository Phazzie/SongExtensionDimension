/**
 * @fileoverview Export Song Command
 * @purpose Export song to various file formats
 * @updated 2025-11-17
 */

import * as vscode from 'vscode'
import type { Services } from '../services/factory'

/**
 * Export Song command handler
 */
export async function exportSongCommand(_services: Services): Promise<void> {
  try {
    // Ask user for export format
    const formatChoice = await vscode.window.showQuickPick(
      [
        { label: 'Text (.txt)', description: 'Plain text lyrics', format: 'text' },
        { label: 'Markdown (.md)', description: 'Formatted markdown', format: 'markdown' },
        { label: 'JSON (.json)', description: 'Full song data as JSON', format: 'json' },
        { label: 'PDF (.pdf)', description: 'Professional PDF document', format: 'pdf' },
        { label: 'HTML (.html)', description: 'Interactive HTML', format: 'html' },
        { label: 'Suno Format (.txt)', description: 'Ready for Suno platform', format: 'suno' }
      ],
      { title: 'Select Export Format', placeHolder: 'Choose export format' }
    )

    if (!formatChoice) {
      return
    }

    // Ask user where to save
    const extension = getFileExtension(formatChoice.format)
    const fileUri = await vscode.window.showSaveDialog({
      title: 'Save Song As',
      defaultUri: vscode.Uri.file(`${process.env.HOME || '.'}/my-song${extension}`),
      filters: {
        'Song File': [extension.slice(1)]
      }
    })

    if (!fileUri) {
      return
    }

    // Show progress
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Exporting to ${formatChoice.label}...`,
        cancellable: false
      },
      async (progress) => {
        progress.report({ increment: 0 })

        // TODO: Get current song from storage/editor
        // For now, show a placeholder message
        vscode.window.showInformationMessage(
          `Export command ready for ${formatChoice.label} format to ${fileUri.fsPath}.\nIn a real implementation, this would export the current song.`
        )

        progress.report({ increment: 100 })
      }
    )
  } catch (error) {
    console.error('Error in exportSongCommand:', error)
    vscode.window.showErrorMessage(
      `Failed to export song: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get file extension for export format
 */
function getFileExtension(format: string): string {
  switch (format) {
    case 'text':
    case 'suno':
      return '.txt'
    case 'markdown':
      return '.md'
    case 'json':
      return '.json'
    case 'pdf':
      return '.pdf'
    case 'html':
      return '.html'
    default:
      return '.txt'
  }
}
