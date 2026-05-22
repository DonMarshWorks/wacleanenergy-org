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
      // Optional advocacy outcome — added to a post when a result lands,
      // often months after the filing. Renders as a status callout.
      // date is optional because older results are hard to pin down.
      outcome: z
        .object({
          status: z.enum(["win", "setback", "mixed", "pending"]),
          text: z.string().min(1),
          date: z.coerce.date().optional(),
        })
        .strict()
        .optional(),
    })
    .strict(),
});

export const collections = { news };
