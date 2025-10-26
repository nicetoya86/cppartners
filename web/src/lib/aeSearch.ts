import { load } from "cheerio";

export type AeCandidate = {
  url: string;
  title?: string;
  thumbnail?: string;
};

function buildSearchUrl(query: string): string {
  const q = encodeURIComponent(query);
  // AliExpress KR search URL pattern
  return `https://ko.aliexpress.com/wholesale?SearchText=${q}`;
}

export async function searchAliExpressByText(query: string): Promise<AeCandidate[]> {
  const urls = [
    buildSearchUrl(query),
    `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`,
  ];
  const candidates: AeCandidate[] = [];

  for (const url of urls) {
    const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "ko,en;q=0.9",
    },
    });
    if (!res.ok) continue;
    const html = await res.text();
    const $ = load(html);

    $("a").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (/^https?:\/\/.+aliexpress\.(com|us)\/.+\/(item|i)\//.test(href) || /aliexpress\.com\/(item|i)\//.test(href)) {
        const title = $(el).attr("title") || $(el).text().trim();
        const img = $(el).find("img").first();
        const thumb = img.attr("src") || img.attr("data-src") || img.attr("image-src") || undefined;
        candidates.push({ url: href.startsWith("http") ? href : `https:${href}`, title, thumbnail: thumb });
      }
    });
  }

  // de-duplicate by URL
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    const key = c.url.split("?")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, 20);
}


