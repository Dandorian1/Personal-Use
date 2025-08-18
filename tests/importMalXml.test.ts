// @ts-nocheck
import { expect, test } from "bun:test";
import { parseMalXml } from "../src/lib/importMal";

class FakeInvalidParser {
  parseFromString() {
    return {
      querySelector: (sel: string) => (sel === "parsererror" ? {} : null),
      getElementsByTagName: () => [],
    };
  }
}

class FakeValidParser {
  parseFromString() {
    const manga = {
      getElementsByTagName(tag: string) {
        const map: Record<string, string> = {
          series_title: "Test Title",
          series_animedb_id: "123",
          my_score: "8",
          my_status: "1",
        };
        return map[tag] ? [{ textContent: map[tag] }] : [];
      },
    };
    return {
      querySelector: () => null,
      getElementsByTagName: (tag: string) => (tag === "manga" ? [manga] : []),
    };
  }
}

class StubManager {
  async search(_query: string, source: string) {
    if (source === "MangaFire") {
      return [
        {
          id: 0,
          name: "Test Title",
          folder_name: "test-title",
          link: "https://mangafire.to/manga/test-title",
          cover: "cover.jpg",
          source: "MangaFire",
          source_id: "test-title",
        },
      ];
    }
    return [];
  }
}

test("throws on invalid XML", async () => {
  const manager = new StubManager() as any;
  await expect(parseMalXml("", manager, FakeInvalidParser as any)).rejects.toThrow(
    "Invalid MAL XML",
  );
});

test("selects default source when available", async () => {
  const manager = new StubManager() as any;
  const favorites = await parseMalXml(
    "",
    manager,
    FakeValidParser as any,
  );
  expect(favorites.length).toBe(1);
  expect(favorites[0].source).toBe("MangaFire");
  expect(favorites[0].link).toBe("https://mangafire.to/manga/test-title");
});
