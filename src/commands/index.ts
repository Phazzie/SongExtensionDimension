/**
 * @fileoverview Command Registration
 * @purpose Register all songwriting commands with VSCode
 * @updated 2025-11-17
 */

import * as vscode from 'vscode'
import type { Services } from '../services/factory'
import { generateSongCommand } from './generateSong'
import { critiqueSongCommand } from './critiqueSong'
import { reviseSongCommand } from './reviseSong'
import { exportSongCommand } from './exportSong'
import { showHistoryCommand } from './showHistory'

/**
 * Register all commands
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  services: Services
): void {
  // Generate Song command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'songwriting.generateSong',
      async () => generateSongCommand(services, context.extensionUri)
    )
  )

  // Critique Song command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'songwriting.critiqueSong',
      async (song?: unknown) => critiqueSongCommand(services, context.extensionUri, song as any)
    )
  )

  // Revise Song command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'songwriting.reviseSong',
      async () => reviseSongCommand(services)
    )
  )

  // Export Song command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'songwriting.exportSong',
      async () => exportSongCommand(services)
    )
  )

  // Show History command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'songwriting.showHistory',
      async () => showHistoryCommand(services)
    )
  )

  console.log('All songwriting commands registered successfully')
}
