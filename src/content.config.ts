import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

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

// Coalition partner organisations — one YAML file, keyed by stable id.
const partners = defineCollection({
  loader: file("./src/content/partners.yaml"),
  schema: z
    .object({
      name: z.string().min(1),
      url: z.string().url(),
      logo: z.string().optional(),
      logoAlt: z.string().optional(),
    })
    .strict()
    .refine((p) => !p.logo || !!p.logoAlt, {
      message: "logoAlt is required when logo is set",
    }),
});

// Accomplishments — one YAML file, keyed by stable id. Sorted in page code.
const accomplishments = defineCollection({
  loader: file("./src/content/accomplishments.yaml"),
  schema: z
    .object({
      date: z.coerce.date(),
      title: z.string().min(1),
      description: z.string().min(1),
      link: z.string().url().optional(),
    })
    .strict(),
});

export const collections = { news, partners, accomplishments };
