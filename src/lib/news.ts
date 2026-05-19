import { getCollection, type CollectionEntry } from "astro:content";
import { selectPublished } from "./news-select";

/**
 * The single chokepoint for reading news posts. `/news`, `/news/[slug]`,
 * and `/rss.xml` MUST go through here — never call `getCollection("news")`
 * directly — so draft and future-dated posts cannot leak.
 */
export async function getPublishedNews(): Promise<CollectionEntry<"news">[]> {
  return selectPublished(await getCollection("news"));
}
