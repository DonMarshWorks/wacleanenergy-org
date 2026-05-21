import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// News posts — one Markdown file per post, flat directory. The entry id
// (filename without extension) is the public URL slug; see src/lib/news.ts.
const news = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/news" }),
  schema: z
    .object({
      title: z.string().min(1),
      pubDate: z.coerce.date(),
      description: z.string().min(1),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    })
    .strict(),
});

export const collections = { news };
