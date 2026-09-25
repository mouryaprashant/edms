/**
 * Only permit ordinary web URLs for document links. This prevents dangerous
 * schemes such as javascript:, data:, file:, and vbscript: from being stored
 * or rendered as clickable document links.
 */
export function isSafeDocumentUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function safeDocumentUrl(value) {
  return isSafeDocumentUrl(value) ? value : "#";
}
