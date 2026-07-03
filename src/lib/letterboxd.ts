// Letterboxd RSS exposes up to 50 recent diary entries; fetched at request time when SSR is enabled.
export type LetterboxdEntry = {
  title: string;
  year: number | null;
  posterUrl: string | null;
  link: string;
  watchedDate: string | null;
};

function extractTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match?.[1]?.trim() ?? null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
}

function extractPosterUrl(description: string | null): string | null {
  if (!description) return null;
  const match = description.match(/<img src="([^"]+)"/);
  return match?.[1] ?? null;
}

function parseItem(block: string): LetterboxdEntry | null {
  const title = extractTag(block, "letterboxd:filmTitle");
  const link = extractTag(block, "link");
  if (!title || !link) return null;

  const yearRaw = extractTag(block, "letterboxd:filmYear");
  const year = yearRaw ? Number.parseInt(yearRaw, 10) : null;

  return {
    title: decodeEntities(title),
    year: Number.isNaN(year) ? null : year,
    posterUrl: extractPosterUrl(extractTag(block, "description")),
    link,
    watchedDate: extractTag(block, "letterboxd:watchedDate"),
  };
}

function parseRss(xml: string): LetterboxdEntry[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items
    .map(parseItem)
    .filter((entry): entry is LetterboxdEntry => entry !== null);
}

export async function fetchDiaryEntries(
  username: string,
  limit: number,
): Promise<LetterboxdEntry[]> {
  const response = await fetch(`https://letterboxd.com/${username}/rss/`);

  if (!response.ok) {
    throw new Error(
      `Letterboxd RSS error for ${username}: ${response.status} ${response.statusText}`,
    );
  }

  const xml = await response.text();
  return parseRss(xml).slice(0, limit);
}
