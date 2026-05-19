import { getCollection, type CollectionEntry } from "astro:content";

/** Partner organisations sorted by name (locale-aware). */
export async function getPartners(): Promise<CollectionEntry<"partners">[]> {
  const partners = await getCollection("partners");
  return [...partners].sort((a, b) => a.data.name.localeCompare(b.data.name));
}
