import type { Favorite } from "@/types";
import type { DownloadManager } from "@/managers";

const SOURCES = ["MangaFire", "MangaDex"];

export async function parseMalXml(
  content: string,
  manager: DownloadManager,
  Parser: { new (): DOMParser } = DOMParser as any,
): Promise<Favorite[]> {
  const doc = new Parser().parseFromString(content, "application/xml");
  if ((doc as any).querySelector?.("parsererror")) {
    throw new Error("Invalid MAL XML");
  }
  const mangas = Array.from(
    (doc as any).getElementsByTagName("manga") as unknown as Element[],
  );
  const statusMap: Record<string, string> = {
    "1": "reading",
    "2": "completed",
    "3": "on hold",
    "4": "dropped",
    "6": "plan to read",
  };
  const favorites: Favorite[] = [];
  for (const m of mangas) {
    const el = m as any;
    const title = el
      .getElementsByTagName("series_title")[0]?.textContent?.trim();
    const malId = el
      .getElementsByTagName("series_animedb_id")[0]
      ?.textContent?.trim();
    if (!title || !malId) continue;
    const grade = Number(
      el.getElementsByTagName("my_score")[0]?.textContent || 0,
    );
    const status =
      statusMap[el.getElementsByTagName("my_status")[0]?.textContent || ""] ??
      "";
    let mapped;
    for (const source of SOURCES) {
      try {
        const results = await manager.search(title.toLowerCase(), source);
        if (results.length > 0) {
          mapped = results[0];
          break;
        }
      } catch (e) {
        console.log(e);
      }
    }
    favorites.push({
      id: 0,
      name: title,
      folder_name:
        mapped?.folder_name ??
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      link: mapped?.link ?? `https://myanimelist.net/manga/${malId}`,
      cover: mapped?.cover ?? "/myk.png",
      source: mapped?.source ?? "mal",
      source_id: mapped?.source_id ?? malId,
      type: "manga",
      extra_name: "",
      title_color: "",
      card_color: "",
      grade,
      author: "Unknown",
      description: "",
      status,
      mal_id: malId,
      anilist_id: "",
    });
  }
  return favorites;
}
