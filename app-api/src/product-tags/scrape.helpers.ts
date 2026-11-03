/**
 * Чисті допоміжні функції для парсингу OpenGraph / Twitter Card / <title>.
 * Винесені окремо для тестування без ініціалізації S3-клієнта.
 */

/** True if the value is a fully-qualified URL — meaning it's an external image, not a storage key. */
export const isExternalUrl = (s: string): boolean => /^https?:\/\//i.test(s);

export function pickMeta(html: string, properties: string[]): string | null {
  for (const prop of properties) {
    // Match <meta property="og:title" content="..."> or name= variants, in any attribute order.
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapeRegex(prop)}["'][^>]*>`,
      'i',
    );
    const tag = re.exec(html)?.[0];
    if (!tag) continue;
    const content = /content=["']([^"']+)["']/i.exec(tag)?.[1];
    if (content) return content;
  }
  return null;
}

export function extractTitleTag(html: string): string | null {
  return /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1] ?? null;
}

export function toAbsoluteUrl(raw: string, base: URL): string | null {
  try {
    return new URL(raw, base).toString();
  } catch {
    return null;
  }
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}
