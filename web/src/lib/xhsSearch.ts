// XHS has dynamic pages and anti-bot. Provide a stub returning empty or later integrate headless.
export type XhsCandidate = {
  url: string;
  title?: string;
  thumbnail?: string;
};

export async function searchXhsByText(_query: string): Promise<XhsCandidate[]> {
  // TODO: integrate via headless or API if available.
  return [];
}

export async function searchXhsHeadless(query: string): Promise<XhsCandidate[]> {
  const enabled = process.env.XHS_HEADLESS === "1" || process.env.XHS_HEADLESS === "true";
  if (!enabled) return [];
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  });
  try {
    const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    // NOTE: XHS is dynamic; we wait a bit for content
    await page.waitForTimeout(1500);
    const items = await page.$$eval("a", (links) =>
      links
        .map((a) => ({ href: a.getAttribute("href"), title: a.getAttribute("title") || a.textContent || "" }))
        .filter((x) => x.href && /xiaohongshu\.com\/(explore|discovery)/.test(x.href!))
        .slice(0, 20)
    );
    const result: XhsCandidate[] = items.map((it) => ({ url: it.href!.startsWith("http") ? it.href! : `https:${it.href}`, title: it.title || undefined }));
    return result;
  } catch {
    return [];
  } finally {
    await page.close();
    await browser.close();
  }
}


