/**
 * Framework-neutral HTTP request/response contracts used by runtime adapters.
 */

export type RuntimeRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  requestId?: string;
};

export type RuntimeResponse<T = unknown> = {
  status: number;
  headers: Record<string, string>;
  body: T;
};

/**
 * Convert a Fetch `Headers` object into a lowercase plain record.
 */
export function normalizeHeaders(headers: Headers): Record<string, string> {
  const normalized: Record<string, string> = {};
  headers.forEach((value, key) => {
    normalized[key.toLowerCase()] = value;
  });
  return normalized;
}
