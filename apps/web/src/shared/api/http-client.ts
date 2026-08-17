import { ApiError } from './api-error'
import { env } from '../lib/env'

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null

interface RequestOptions {
  body?: unknown
  searchParams?: object
}

// Free-tier ngrok shows a one-time "you are about to visit..." interstitial
// to any request that looks like a real browser and doesn't carry this
// header — including our own `fetch()` calls, if `VITE_API_BASE_URL` (local
// dev, or a shared preview link) ever points at an ngrok tunnel instead of
// localhost/a real domain. A `fetch()` call can set this; a third party's
// server-side redirect (e.g. Paymob bouncing the browser back to our API)
// can't, so this only covers requests this app itself initiates — see
// CONTRIBUTING/dev notes on the Paymob GET-webhook interstitial for that
// separate, unavoidable case.
const NGROK_SKIP_WARNING_HEADERS = { 'ngrok-skip-browser-warning': '1' } as const

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
      ...NGROK_SKIP_WARNING_HEADERS,
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
    headers: NGROK_SKIP_WARNING_HEADERS,
    body: formData,
  })

  return parseResponse<T>(response)
}

// For endpoints that return a binary body (file downloads) instead of JSON —
// same credentials/error-handling as request(), but resolves to a Blob.
async function requestBlob(path: string): Promise<Blob> {
  const response = await fetch(new URL(`${env.apiBaseUrl}${path}`), {
    credentials: 'include',
    headers: NGROK_SKIP_WARNING_HEADERS,
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
