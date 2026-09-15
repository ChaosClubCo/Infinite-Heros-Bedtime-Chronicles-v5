export interface RuntimeRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  requestId?: string;
  body?: unknown;
}

export interface RuntimeResponse<TBody = unknown> {
  status: number;
  headers: Record<string, string>;
  body: TBody;
}

export function normalizeHeaders(headers: Headers): Record<string, string> {
  const normalized: Record<string, string> = {};
  headers.forEach((value, key) => {
    normalized[key.toLowerCase()] = value;
  });
  return normalized;
}
