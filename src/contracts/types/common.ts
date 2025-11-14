/**
 * @fileoverview Common Types for All Contracts
 * @purpose Define shared types used across all seam contracts
 * @dataFlow Foundation types for all service responses
 * @boundary Cross-cutting type definitions
 * @requirement Type safety and consistent error handling across all seams
 * @updated 2025-11-14
 */

/**
 * Standard service response wrapper for all seam operations
 * Uses discriminated union for type-safe success/error handling
 */
export type ServiceResponse<T> = ServiceSuccess<T> | ServiceFailure

/**
 * Success response with data
 */
export interface ServiceSuccess<T> {
  readonly success: true
  readonly data: T
  readonly metadata?: ResponseMetadata
}

/**
 * Failure response with error details
 */
export interface ServiceFailure {
  readonly success: false
  readonly error: ServiceError
  readonly metadata?: ResponseMetadata
}

/**
 * Structured error information
 * All errors must provide user-friendly messages and recovery suggestions
 */
export interface ServiceError {
  /** Machine-readable error code */
  readonly code: string

  /** User-friendly error message */
  readonly message: string

  /** Technical details for debugging */
  readonly details?: string

  /** Suggestion for how to resolve the error */
  readonly suggestion: string

  /** Original error if this wraps another error */
  readonly cause?: Error

  /** Timestamp when error occurred */
  readonly timestamp?: Date
}

/**
 * Optional metadata attached to responses
 */
export interface ResponseMetadata {
  /** Duration of operation in milliseconds */
  readonly duration?: number

  /** Timestamp when response was generated */
  readonly timestamp?: Date

  /** Version of the service that generated response */
  readonly serviceVersion?: string

  /** Unique request ID for tracing */
  readonly requestId?: string

  /** Any additional context */
  readonly [key: string]: unknown
}

/**
 * Quality score (0-100)
 * Used across critique and analysis seams
 */
export type QualityScore = number & { readonly __brand: 'QualityScore' }

/**
 * Create a quality score with validation
 */
export function createQualityScore(value: number): QualityScore {
  if (value < 0 || value > 100) {
    throw new Error(`Quality score must be 0-100, got ${value}`)
  }
  return value as QualityScore
}

/**
 * Severity levels for issues and feedback
 */
export enum Severity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
  INFO = 'info'
}

/**
 * Generic issue structure used by critique and analysis seams
 */
export interface Issue {
  readonly severity: Severity
  readonly type: string
  readonly message: string
  readonly location?: Location
  readonly suggestion?: string
}

/**
 * Location in text/song structure
 */
export interface Location {
  readonly line?: number
  readonly word?: number
  readonly sectionId?: string
  readonly startChar?: number
  readonly endChar?: number
}

/**
 * Generic suggestion structure
 */
export interface Suggestion {
  readonly type: string
  readonly description: string
  readonly alternatives?: string[]
  readonly confidence?: number
  readonly location?: Location
}

/**
 * Configuration for quality thresholds
 * Used by critique and validation seams
 */
export interface QualityThresholds {
  readonly rhymeScore: number
  readonly flowScore: number
  readonly imageryScore: number
  readonly authenticityScore: number
  readonly originalityScore: number
  readonly voiceScore: number
}

/**
 * Default quality thresholds (gold standard)
 */
export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  rhymeScore: 80,
  flowScore: 85,
  imageryScore: 90,
  authenticityScore: 95,
  originalityScore: 85,
  voiceScore: 90
} as const

/**
 * Type guard for ServiceResponse success
 */
export function isSuccess<T>(response: ServiceResponse<T>): response is ServiceSuccess<T> {
  return response.success === true
}

/**
 * Type guard for ServiceResponse failure
 */
export function isFailure<T>(response: ServiceResponse<T>): response is ServiceFailure {
  return response.success === false
}

/**
 * Helper to create success response
 */
export function createSuccess<T>(data: T, metadata?: ResponseMetadata): ServiceSuccess<T> {
  return {
    success: true,
    data,
    metadata
  }
}

/**
 * Helper to create failure response
 */
export function createFailure(error: ServiceError, metadata?: ResponseMetadata): ServiceFailure {
  return {
    success: false,
    error,
    metadata
  }
}

/**
 * Helper to create error object
 */
export function createError(
  code: string,
  message: string,
  suggestion: string,
  details?: string,
  cause?: Error
): ServiceError {
  return {
    code,
    message,
    suggestion,
    details,
    cause,
    timestamp: new Date()
  }
}
