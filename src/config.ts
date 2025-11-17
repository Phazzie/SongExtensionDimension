/**
 * @fileoverview Configuration Management
 * @purpose Handle extension configuration and user settings
 * @updated 2025-11-17
 */

import * as vscode from 'vscode'

/**
 * AI Provider types
 */
export type AIProvider = 'gemini' | 'openai'

/**
 * Critique level types
 */
export type CritiqueLevel = 'casual' | 'professional' | 'gold-standard'

/**
 * Revision strategy types
 */
export type RevisionStrategy = 'conservative' | 'moderate' | 'aggressive' | 'surgical' | 'creative'

/**
 * Export format types
 */
export type ExportFormat = 'text' | 'markdown' | 'json' | 'pdf' | 'html' | 'suno'

/**
 * Extension configuration interface
 */
export interface ExtensionConfig {
  readonly showWelcome: boolean
  readonly aiProvider: AIProvider
  readonly geminiApiKey: string
  readonly openaiApiKey: string
  readonly critiqueLevel: CritiqueLevel
  readonly revisionStrategy: RevisionStrategy
  readonly exportFormat: ExportFormat
  readonly defaultExportDirectory: string
  readonly preserveVoice: boolean
  readonly autoSaveVersions: boolean
  readonly maxVersionsPerSong: number
  readonly generationTemperature: number
  readonly qualityThreshold: number
  readonly enableTelemetry: boolean
  readonly debugMode: boolean
}

/**
 * Get configuration
 */
export function getConfiguration(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('songwriting')

  return {
    showWelcome: config.get<boolean>('showWelcome', true),
    aiProvider: config.get<AIProvider>('aiProvider', 'gemini'),
    geminiApiKey: config.get<string>('geminiApiKey', ''),
    openaiApiKey: config.get<string>('openaiApiKey', ''),
    critiqueLevel: config.get<CritiqueLevel>('critiqueLevel', 'professional'),
    revisionStrategy: config.get<RevisionStrategy>('revisionStrategy', 'moderate'),
    exportFormat: config.get<ExportFormat>('exportFormat', 'text'),
    defaultExportDirectory: expandPath(config.get<string>('defaultExportDirectory', '${userHome}/Music/Songwriting Assistant')),
    preserveVoice: config.get<boolean>('preserveVoice', true),
    autoSaveVersions: config.get<boolean>('autoSaveVersions', true),
    maxVersionsPerSong: config.get<number>('maxVersionsPerSong', 50),
    generationTemperature: config.get<number>('generationTemperature', 0.7),
    qualityThreshold: config.get<number>('qualityThreshold', 0.75),
    enableTelemetry: config.get<boolean>('enableTelemetry', false),
    debugMode: config.get<boolean>('debugMode', false)
  }
}

/**
 * Update a configuration setting
 */
export async function updateConfiguration(key: string, value: unknown): Promise<void> {
  const config = vscode.workspace.getConfiguration('songwriting')
  await config.update(key, value, vscode.ConfigurationTarget.Global)
}

/**
 * Get a specific configuration value
 */
export function getConfigValue<T>(key: string, defaultValue: T): T {
  const config = vscode.workspace.getConfiguration('songwriting')
  return config.get<T>(key, defaultValue)
}

/**
 * Set a specific configuration value
 */
export async function setConfigValue(key: string, value: unknown): Promise<void> {
  await updateConfiguration(key, value)
}

/**
 * Expand path variables in configuration values
 */
function expandPath(path: string): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || ''

  return path
    .replace('${userHome}', homeDir)
    .replace('${home}', homeDir)
}

/**
 * Validate API key is provided for selected provider
 */
export function validateApiKeys(): { valid: boolean; error?: string } {
  const config = getConfiguration()

  if (config.aiProvider === 'gemini' && !config.geminiApiKey) {
    return {
      valid: false,
      error: 'Gemini API key is required. Please set it in extension settings.'
    }
  }

  if (config.aiProvider === 'openai' && !config.openaiApiKey) {
    return {
      valid: false,
      error: 'OpenAI API key is required. Please set it in extension settings.'
    }
  }

  return { valid: true }
}

/**
 * Prompt user to configure extension if needed
 */
export async function ensureConfigured(): Promise<boolean> {
  const validation = validateApiKeys()

  if (!validation.valid) {
    const action = await vscode.window.showErrorMessage(
      validation.error || 'Extension configuration required',
      'Open Settings',
      'Dismiss'
    )

    if (action === 'Open Settings') {
      await vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'songwriting.geminiApiKey'
      )
    }

    return false
  }

  return true
}
