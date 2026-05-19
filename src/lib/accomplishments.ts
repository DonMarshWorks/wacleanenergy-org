import { getCollection, type CollectionEntry } from "astro:content";

/** Accomplishment entries sorted newest-first. */
export async function getAccomplishments(): Promise<
  CollectionEntry<"accomplishments">[]
> {
  const items = await getCollection("accomplishments");
  return [...items].sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}
