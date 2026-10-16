/** Title-case a single word (handles hyphenated names loosely). */
function titleWord(word) {
  const w = String(word || '').trim();
  if (!w) return '';
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

/** Display guest / resident name from first + last parts. */
export function formatPersonName(firstName, lastName) {
  const parts = [firstName, lastName]
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(titleWord);
  return parts.join(' ');
}
