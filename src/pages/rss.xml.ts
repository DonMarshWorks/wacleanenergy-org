import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { experimental_AstroContainer } from "astro/container";
import { render } from "astro:content";
import { getPublishedNews } from "../lib/news";

// Defensive: keep this endpoint in the static build even if defaults
// shift later. (The whole site is already statically built, but this
// is the one route most likely to be accidentally turned dynamic.)
export const prerender = true;

const FEED_MAX = 20;

export async function GET(context: APIContext) {
  const site = context.site;
  if (!site) {
    throw new Error("astro.config.mjs `site` must be set for the RSS feed");
  }

  // Cap the feed so build-time HTML rendering can't grow unbounded as
  // the archive accumulates posts.
  const recent = (await getPublishedNews()).slice(0, FEED_MAX);
  const container = await experimental_AstroContainer.create();

  const items = await Promise.all(
    recent.map(async (post) => {
      const { Content } = await render(post);
      return {
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: new URL(`/news/${post.id}/`, site).toString(),
        content: await container.renderToString(Content),
      };
    }),
  );

  return rss({
    title: "Washington Clean Energy Coalition — News",
    description: "Updates from the Washington Clean Energy Coalition.",
    site,
    items,
  });
}
