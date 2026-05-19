import { describe, it, expect } from "vitest";
import { selectPublished, type PublishableNews } from "./news-select";

const NOW = new Date("2026-05-19T00:00:00Z");

const post = (id: string, pubDate: string, draft = false): PublishableNews => ({
  id,
  data: { draft, pubDate: new Date(pubDate) },
});

describe("selectPublished", () => {
  it("drops draft posts", () => {
    const result = selectPublished(
      [post("kept", "2026-01-01"), post("hidden", "2026-02-01", true)],
      NOW,
    );
    expect(result.map((p) => p.id)).toEqual(["kept"]);
  });

  it("drops future-dated posts", () => {
    const result = selectPublished(
      [post("past", "2026-01-01"), post("future", "2099-01-01")],
      NOW,
    );
    expect(result.map((p) => p.id)).toEqual(["past"]);
  });

  it("sorts newest first", () => {
    const result = selectPublished(
      [
        post("old", "2026-01-01"),
        post("new", "2026-05-01"),
        post("mid", "2026-03-01"),
      ],
      NOW,
    );
    expect(result.map((p) => p.id)).toEqual(["new", "mid", "old"]);
  });

  it("throws on a slug that is not kebab-case", () => {
    expect(() =>
      selectPublished([post("Not A Slug", "2026-01-01")], NOW),
    ).toThrow(/invalid slug/);
  });

  it("throws on an invalid slug even when the post is a draft", () => {
    // The invariant must catch bad filenames the moment they land — not
    // later, when draft flips to false.
    expect(() =>
      selectPublished([post("Bad Slug", "2026-01-01", true)], NOW),
    ).toThrow(/invalid slug/);
  });

  it("throws on an invalid slug even when the post is future-dated", () => {
    expect(() =>
      selectPublished([post("Also Bad", "2099-01-01")], NOW),
    ).toThrow(/invalid slug/);
  });

  it("does not mutate the input array", () => {
    const input = [post("a", "2026-01-01"), post("b", "2026-05-01")];
    selectPublished(input, NOW);
    expect(input.map((p) => p.id)).toEqual(["a", "b"]);
  });
});
