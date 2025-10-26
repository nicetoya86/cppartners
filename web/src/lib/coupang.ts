import { load } from "cheerio";

export type CoupangProduct = {
  title?: string;
  images: string[];
};

export async function fetchCoupangMeta(url: string): Promise<CoupangProduct> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "ko,en;q=0.9",
    },
  });
  if (!res.ok) return { images: [] };
  const html = await res.text();
  const $ = load(html);

  let title = $("meta[property='og:title']").attr("content")
    || $("meta[name='title']").attr("content")
    || $("title").text().trim();
  if (!title) {
    title = $("h2.prod-buy-header__title").text().trim()
      || $("h2.prod-title").text().trim()
      || $("div.prod-buy-header h2").text().trim()
      || $("h1, h2").first().text().trim();
  }
  const metaDescription = $("meta[name='description']").attr("content") || "";
  const images = new Set<string>();

  // og:image
  const ogImg = $("meta[property='og:image']").attr("content");
  if (ogImg) images.add(ogImg);

  // product thumbnails
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (!src) return;
    if (/\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(src)) images.add(src.startsWith("http") ? src : `https:${src}`);
  });

  if (!title && metaDescription) {
    title = metaDescription.split(/[,|·\-]/)[0]?.trim() || metaDescription.trim();
  }

  return { title, images: Array.from(images) };
}


