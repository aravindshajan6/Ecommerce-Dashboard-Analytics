/** ISO-3166 alpha-2 → regional-indicator flag emoji ("IN" → 🇮🇳). Empty string when unknown. */
export function flagEmoji(code) {
  if (!code || typeof code !== 'string') return '';
  const cc = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return '';
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
