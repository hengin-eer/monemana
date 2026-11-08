import { describe, expect, it } from "vitest";
import { pageHead, siteHead, SITE } from "./site-meta.ts";

describe("siteHead", () => {
  it("viewport・description・OGP画像（絶対URL）・faviconを含む", () => {
    const head = siteHead();
    const content = (key: string) => head.meta.find((m) => m.name === key || m.property === key)?.content;
    expect(content("viewport")).toContain("width=device-width");
    expect(content("description")).toBe(SITE.description);
    expect(content("og:image")).toBe("https://monemana.hiro-to.moda/og-image.png");
    expect(head.link[0]?.href).toBe("/favicon.svg");
  });
});

describe("pageHead", () => {
  it("titleにサイト名を付け、og:title・og:urlへ反映する", () => {
    const head = pageHead({ title: "カテゴリ", path: "/categories" });
    expect(head.title).toBe("カテゴリ | monemana");
    expect(head.meta.find((m) => m.property === "og:title")?.content).toBe("カテゴリ | monemana");
    expect(head.meta.find((m) => m.property === "og:url")?.content).toBe("https://monemana.hiro-to.moda/categories");
  });
});
