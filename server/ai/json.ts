/**
 * Extract the first complete, balanced JSON object from a string.
 *
 * More reliable than a greedy regex when a response contains multiple JSON-like
 * blocks (e.g. a <think> preamble followed by the actual JSON). Properly skips
 * `{` / `}` characters that appear inside string literals.
 *
 * Extracted from the AI router so both the JSON generation path and the buffered
 * streaming path (which must reassemble and parse the full text before it is
 * moderated) use exactly one parser.
 */
export function extractFirstJson(text: string): string | null {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) return text.slice(start, i + 1);
    }
  }
  return null;
}
