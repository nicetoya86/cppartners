import { NextRequest, NextResponse } from "next/server";
import { searchAliExpressByText } from "@/lib/aeSearch";
import { searchXhsByText, searchXhsHeadless } from "@/lib/xhsSearch";
import { fetchCoupangMeta } from "@/lib/coupang";
import { computeAverageHashFromBuffer, hammingDistanceHex64, similarityFromHamming64 } from "@/lib/imageHash";
import { logSearchEvent, getCachedResult, setCachedResult } from "@/lib/supabase";
import { fetchWithTimeout } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const coupangUrl = (formData.get("coupangUrl") || "").toString().trim();
    const file = formData.get("image") as File | null;

    if (!coupangUrl && !file) {
      return NextResponse.json({ error: "쿠팡 URL 또는 이미지가 필요합니다" }, { status: 400 });
    }

    // 1) 쿠팡 메타/이미지 추출
    let query = "";
    let coupangImages: string[] = [];
    if (coupangUrl) {
      const meta = await fetchCoupangMeta(coupangUrl).catch(() => ({ title: "", images: [] }));
      query = meta.title || query;
      coupangImages = meta.images.slice(0, 3);
    }
    if (!query && coupangUrl) {
      try {
        const u = new URL(coupangUrl);
        query = decodeURIComponent(u.pathname.split("/").filter(Boolean).slice(-1)[0] || "").replace(/[-_]/g, " ");
      } catch {}
    }
    if (!query && file) query = "product";

    const started = Date.now();

    // cache key (simple): coupangUrl + query
    const key = `${coupangUrl}|${query}`;
    const keyHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key)).then((buf) =>
      Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("")
    );

    const cached = await getCachedResult(keyHash).catch(() => null);
    if (cached) {
      const results = [
        ...cached.ae.map((c: any) => ({ platform: "ae" as const, ...c })),
        ...cached.xhs.map((c: any) => ({ platform: "xhs" as const, ...c })),
      ];
      return NextResponse.json({ results });
    }
    const [ae, xhsBasic, xhsHeadless] = await Promise.all([
      searchAliExpressByText(query).catch(() => []),
      searchXhsByText(query).catch(() => []),
      searchXhsHeadless(query).catch(() => []),
    ]);
    const xhs = [...xhsBasic, ...xhsHeadless];

    // basic scoring by title token overlap
    const tokens = new Set(query.toLowerCase().split(/\s+/).filter(Boolean));
    const scoreFromTitle = (title?: string) => {
      if (!title) return 0.0;
      const tks = title.toLowerCase().split(/\s+/).filter(Boolean);
      const hit = tks.filter((t) => tokens.has(t)).length;
      return Math.min(1, hit / Math.max(3, tokens.size || 3));
    };

    let preliminary = [
      ...ae.slice(0, 8).map((c) => ({ platform: "ae" as const, url: c.url, score: scoreFromTitle(c.title), title: c.title, thumbnail: c.thumbnail })),
      ...xhs.slice(0, 5).map((c) => ({ platform: "xhs" as const, url: c.url, score: scoreFromTitle(c.title), title: c.title, thumbnail: c.thumbnail })),
    ].filter((r) => r.score >= 0.2);

    // 3) 이미지 유사도 결합 (입력 이미지 혹은 쿠팡 대표 이미지 기준)
    let baseBuffer: Buffer | null = null;
    if (file) {
      baseBuffer = Buffer.from(await file.arrayBuffer());
    } else if (coupangImages[0]) {
      try {
        const imgRes = await fetchWithTimeout(coupangImages[0], { timeoutMs: 7000 });
        if (imgRes.ok) baseBuffer = Buffer.from(await imgRes.arrayBuffer());
      } catch {}
    }

    if (baseBuffer && preliminary.length) {
      try {
        const baseHash = await computeAverageHashFromBuffer(baseBuffer);
        const withImg = await Promise.all(
          preliminary.map(async (r) => {
            let sim = 0;
            if (r.thumbnail) {
              try {
                const tRes = await fetchWithTimeout(
                  r.thumbnail.startsWith("http") ? r.thumbnail : `https:${r.thumbnail}`,
                  { timeoutMs: 7000 }
                );
                if (tRes.ok) {
                  const tBuf = Buffer.from(await tRes.arrayBuffer());
                  const tHash = await computeAverageHashFromBuffer(tBuf);
                  const dist = hammingDistanceHex64(baseHash.aHash, tHash.aHash);
                  sim = similarityFromHamming64(dist);
                }
              } catch {}
            }
            const combined = 0.7 * sim + 0.3 * r.score;
            return { ...r, score: combined };
          })
        );
        preliminary = withImg;
      } catch {}
    }

    const results = preliminary
      .filter((r) => r.score >= 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    // write cache (best-effort)
    (async () => {
      try {
        const ae = results.filter((r) => r.platform === "ae").map((r) => ({ url: r.url, score: r.score, title: r.title, thumbnail: r.thumbnail }));
        const xhs = results.filter((r) => r.platform === "xhs").map((r) => ({ url: r.url, score: r.score, title: r.title, thumbnail: r.thumbnail }));
        await setCachedResult(keyHash, query, { ae, xhs });
      } catch {}
    })();

    // async logging (fire and forget)
    (async () => {
      try {
        await logSearchEvent({
          coupangUrl,
          query,
          aeCount: ae.length,
          xhsCount: xhs.length,
          durationMs: Date.now() - started,
        });
      } catch {}
    })();

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다" }, { status: 500 });
  }
}


