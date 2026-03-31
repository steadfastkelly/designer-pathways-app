export const HTTP_ERROR_TEXT = {
  emptyBody: 'The server returned an empty response body.',
  nonJsonBody: 'The server returned a non-JSON response body.',
  jsonApiError: 'The server returned an error response.',
} as const;

export interface SafeJsonResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  raw: string;
  parseError: string | null;
}

export async function readJsonSafely<T = unknown>(response: Response): Promise<SafeJsonResult<T>> {
  const raw = await response.text();

  if (!raw.trim()) {
    return {
      ok: response.ok,
      status: response.status,
      data: null,
      raw,
      parseError: HTTP_ERROR_TEXT.emptyBody,
    };
  }

  try {
    return {
      ok: response.ok,
      status: response.status,
      data: JSON.parse(raw) as T,
      raw,
      parseError: null,
    };
  } catch {
    return {
      ok: response.ok,
      status: response.status,
      data: null,
      raw,
      parseError: HTTP_ERROR_TEXT.nonJsonBody,
    };
  }
}

export function getJsonApiErrorMessage(
  parsed: SafeJsonResult<{ error?: unknown; message?: unknown }>,
  fallback?: string,
): string {
  if (parsed.parseError) {
    return `${parsed.parseError} (HTTP ${parsed.status})`;
  }

  if (parsed.ok) return fallback ?? '';

  const apiMessage = typeof parsed.data?.error === 'string'
    ? parsed.data.error
    : typeof parsed.data?.message === 'string'
      ? parsed.data.message
      : null;

  if (apiMessage) {
    return `${HTTP_ERROR_TEXT.jsonApiError} ${apiMessage}`;
  }

  return `${HTTP_ERROR_TEXT.jsonApiError} (HTTP ${parsed.status})`;
}
