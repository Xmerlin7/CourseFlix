import { ApiError } from './api-error'
import { env } from '../lib/env'

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null

interface RequestOptions {
  body?: unknown
  searchParams?: object
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError('Request failed', response.status, await response.json().catch(() => null))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload = (await response.json()) as unknown
  notifyIfPendingApproval(payload)
  return payload as T
}

/**
 * Assistant writes never execute — the API parks them for the teacher and
 * answers with `{ pendingApproval: true, message }` where the created or
 * updated resource would normally be.
 *
 * The toast fires here, once, rather than in each of the ~20 call sites
 * that can be parked. Every one of those already shows its own "saved"
 * toast on success, so without this an assistant would be told their edit
 * was saved when nothing had happened at all.
 *
 * Deliberately fire-and-forget and untyped: callers keep their existing
 * return type and simply receive a body whose fields are absent, which is
 * why the pages that care also render the pending banner.
 */
function notifyIfPendingApproval(payload: unknown): void {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    (payload as { pendingApproval?: unknown }).pendingApproval !== true
  ) {
    return
  }

  const message = (payload as { message?: unknown }).message
  void import('../components/Toast').then(({ showToast }) => {
    showToast(
      typeof message === 'string'
        ? message
        : 'تم إرسال طلبك للمعلم — سيُنفَّذ بعد موافقته.',
      'success',
    )
  })
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${env.apiBaseUrl}${path}`)

  Object.entries(options.searchParams ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })

  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  return parseResponse<T>(response)
}

// No Content-Type header here — the browser sets `multipart/form-data`
// with the correct boundary itself when the body is a FormData instance.
async function requestMultipart<T>(
  method: string,
  path: string,
  formData: FormData,
): Promise<T> {
  const response = await fetch(new URL(`${env.apiBaseUrl}${path}`), {
    method,
    credentials: 'include',
    body: formData,
  })

  return parseResponse<T>(response)
}

// For endpoints that return a binary body (file downloads) instead of JSON —
// same credentials/error-handling as request(), but resolves to a Blob.
async function requestBlob(path: string): Promise<Blob> {
  const response = await fetch(new URL(`${env.apiBaseUrl}${path}`), {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new ApiError('Request failed', response.status, await response.json().catch(() => null))
  }

  return response.blob()
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: JsonValue | object) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: JsonValue | object) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
  postMultipart: <T>(path: string, formData: FormData) => requestMultipart<T>('POST', path, formData),
  getBlob: (path: string) => requestBlob(path),
}
