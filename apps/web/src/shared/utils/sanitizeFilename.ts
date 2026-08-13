/**
 * Sanitizes and fixes filename encoding issues for uploaded attachments.
 * When files with Arabic names are uploaded via multipart form data, some browsers/servers
 * parse the UTF-8 bytes as ISO-8859-1 (Latin1), producing mojibake like "Ø§Ù„ÙƒÙŠÙ…ÙŠØ§Ø¡".
 * This helper restores the proper Arabic UTF-8 text safely.
 */
export function sanitizeFilename(filename: string | null | undefined): string {
  if (!filename) return ''
  try {
    const bytes = Uint8Array.from(filename, (char) => char.charCodeAt(0) & 0xff)
    const decoded = new TextDecoder('utf-8').decode(bytes)
    if (/[\u0600-\u06FF]/.test(decoded)) {
      return decoded
    }
  } catch {
    // Ignore decoding errors and fallback to original filename
  }
  return filename
}
