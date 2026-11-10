import { config } from '../config'
import { reportServerStatus } from './serverStatus'
import type { ApiErrorBody } from './types'

/** Error code used when the request never got an HTTP response (server down, offline). */
export const NETWORK_ERROR = 'network_error'

/**
 * Every failed API call becomes an ApiError, so the UI handles one shape:
 * `status` is the HTTP status (0 when the server could not be reached),
 * `code` is the backend's stable error code, `message` is plain language.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }

  get isNetworkError(): boolean {
    return this.code === NETWORK_ERROR
  }
}

/** Header carrying the student's identity (17-digit birth registration number). */
export const STUDENT_ID_HEADER = 'X-Student-Id'

let currentStudentId: string | null = null

/**
 * Sets the student ID sent with every request. Called by StudentIdProvider whenever
 * the ID changes, so API functions never need to pass it around.
 */
export function setRequestStudentId(studentId: string | null): void {
  currentStudentId = studentId
}

type Method = 'GET' | 'POST' | 'DELETE'

interface RequestOptions {
  method?: Method
  body?: unknown
  headers?: Record<string, string>
}

/**
 * Calls the backend and returns the parsed JSON body (undefined for 204 No Content).
 * Throws ApiError for network failures and for any non-2xx response.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (currentStudentId !== null) {
    headers[STUDENT_ID_HEADER] = currentStudentId
  }

  let response: Response
  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    reportServerStatus('unreachable')
    throw new ApiError(
      0,
      NETWORK_ERROR,
      'Cannot reach the server. Check your connection, or try again in a moment.',
    )
  }

  reportServerStatus(response.status >= 500 ? 'error' : 'ok')

  if (response.status === 204) {
    return undefined as T
  }

  const payload: unknown = await response.json().catch(() => undefined)

  if (!response.ok) {
    throw toApiError(response.status, payload)
  }

  return payload as T
}

function toApiError(status: number, payload: unknown): ApiError {
  if (isApiErrorBody(payload)) {
    return new ApiError(status, payload.error, payload.message)
  }
  const message =
    status >= 500
      ? 'Something went wrong on the server. Please try again.'
      : `The request failed (HTTP ${status}).`
  return new ApiError(status, `http_${status}`, message)
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiErrorBody).error === 'string' &&
    typeof (value as ApiErrorBody).message === 'string'
  )
}
