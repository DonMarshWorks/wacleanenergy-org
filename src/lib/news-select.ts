/**
 * Pure news-selection logic — deliberately free of any `astro:content`
 * value import so it is unit-testable under plain Vitest.
 */

export interface PublishableNews {
  id: string;
  data: { draft: boolean; pubDate: Date };
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Filter news entries to those that belong in the production build —
 * not drafts, not future-dated — and sort newest first. Throws if any
 * entry (draft or not) has an id that is not a URL-safe kebab-case
 * slug: the invariant is checked on the whole input *before* filtering
 * so a bad filename fails the build the moment it lands, not later
 * when it becomes publishable.
 *
 * @param posts - all news entries
 * @param now - reference time (injectable for tests)
 */
export function selectPublished<T extends PublishableNews>(
  posts: T[],
  now: Date = new Date(),
): T[] {
  for (const p of posts) {
    if (!SLUG_RE.test(p.id)) {
      throw new Error(
        `news: invalid slug "${p.id}" — news filenames must be kebab-case`,
      );
    }
  }
  const cutoff = now.getTime();
  return posts
    .filter((p) => !p.data.draft && p.data.pubDate.getTime() <= cutoff)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}
