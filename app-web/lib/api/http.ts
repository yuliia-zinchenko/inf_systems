import { API_BASE_URL, API_INTERNAL_URL } from '../env';

export class ApiError extends Error {
  public readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  json?: unknown;
}

export const apiFetch = async <TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> => {
  const { json, headers: rawHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((rawHeaders as Record<string, string>) ?? {}),
  };

  let body: BodyInit | undefined;
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
    body,
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // body wasn't json
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as TResponse;
  return (await response.json()) as TResponse;
};

export type ServerFetchResult<TResponse> =
  | { status: 'ok'; data: TResponse }
  | { status: 'not-found' }
  | { status: 'unreachable' };

export const serverFetch = async <TResponse>(
  path: string,
): Promise<ServerFetchResult<TResponse>> => {
  try {
    const response = await fetch(`${API_INTERNAL_URL}${path}`, { cache: 'no-store' });
    if (response.status === 404) return { status: 'not-found' };
    if (!response.ok) return { status: 'unreachable' };
    return { status: 'ok', data: (await response.json()) as TResponse };
  } catch {
    return { status: 'unreachable' };
  }
};
