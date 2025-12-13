/**
 * @fileoverview VSCode Extension Entry Point
 * @purpose Initialize extension, register commands, and set up UI
 * @updated 2025-11-17
 */

import * as vscode from 'vscode'
import { initializeServices } from './services/factory'
import { registerCommands } from './commands'

/**
 * Extension context (persists for lifetime of extension)
 */
let extensionContext: vscode.ExtensionContext | null = null

/**
 * Activation hook - called when extension is activated
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  extensionContext = context

  // Log activation
  console.log('Songwriting Assistant extension is now active')

  try {
    // Initialize services (mocks or real)
    const services = await initializeServices()

    // Register all commands with services
    registerCommands(context, services)

    // Store services in context for access
    context.subscriptions.push(
      vscode.commands.registerCommand('songwriting.extensionReady', () => {
        vscode.window.showInformationMessage('Songwriting Assistant is ready!')
      })
    )

    // Show welcome message
    const config = vscode.workspace.getConfiguration('songwriting')
    if (config.get<boolean>('showWelcome', true)) {
      vscode.window.showInformationMessage(
        'Songwriting Assistant activated! Use the Songwriter commands to get started.'
      )
    }
  } catch (error) {
    console.error('Failed to activate extension:', error)
    vscode.window.showErrorMessage(
      'Failed to activate Songwriting Assistant. Check the console for details.'
    )
  }
}

/**
 * Deactivation hook - called when extension is deactivated
 */
export function deactivate(): void {
  console.log('Songwriting Assistant extension is now inactive')
  extensionContext = null
}

/**
 * Get extension context (for internal use)
 */
export function getExtensionContext(): vscode.ExtensionContext | null {
  return extensionContext
}
