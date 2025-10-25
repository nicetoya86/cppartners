"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type SearchResult = {
  platform: "xhs" | "ae";
  url: string;
  score: number;
  title?: string;
  thumbnail?: string;
};

export default function Home() {
  const [coupangUrl, setCoupangUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasAnyInput = useMemo(() => coupangUrl.trim().length > 0 || !!imageFile, [coupangUrl, imageFile]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) setImageFile(file);
    }
  }, []);

  const onSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const form = new FormData();
      if (coupangUrl.trim()) form.append("coupangUrl", coupangUrl.trim());
      if (imageFile) form.append("image", imageFile);

      const res = await fetch("/api/search", { method: "POST", body: form });
      if (!res.ok) throw new Error("검색 요청에 실패했습니다");
      const data = (await res.json()) as { results: SearchResult[] };
      setResults(data.results ?? []);
    } catch (err: any) {
      setError(err?.message ?? "알 수 없는 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [coupangUrl, imageFile]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <section className="mx-auto max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">쿠팡 상품 등록 여부 확인</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">쿠팡 상품 URL 또는 이미지를 입력해 샤오홍슈/알리익스프레스 등록 여부를 확인합니다.</p>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="url"
                placeholder="쿠팡 상품 URL을 입력하세요"
                value={coupangUrl}
                onChange={(e) => setCoupangUrl(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:bg-zinc-900 dark:border-zinc-700"
              />
              <button
                onClick={() => inputRef.current?.focus()}
                className="rounded-md border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                붙여넣기
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={
                "rounded-md border border-dashed p-6 text-center text-sm transition-colors " +
                (isDragging ? "bg-black/5 dark:bg-white/10" : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700")
              }
            >
              {imageFile ? (
                <div className="flex items-center justify-between">
                  <span className="truncate">{imageFile.name}</span>
                  <button
                    onClick={() => setImageFile(null)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    제거
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-2">이미지를 드래그&드롭하거나 파일을 선택하세요</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.type.startsWith("image/")) setImageFile(file);
                    }}
                  />
                </>
              )}
            </div>

            <div className="flex justify-end">
              <button
                disabled={!hasAnyInput || isLoading}
                onClick={onSearch}
                className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black"
              >
                {isLoading ? "검색 중..." : "검색"}
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl mt-10">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-md border p-4 animate-pulse bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-36" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          {results && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((r, idx) => (
                <div key={idx} className="rounded-md border p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wide rounded-full px-2 py-0.5 border">
                      {r.platform === "xhs" ? "샤오홍슈" : "알리익스프레스"}
                    </span>
                    <span className="text-xs text-zinc-500">신뢰도 {(r.score * 100).toFixed(0)}%</span>
                  </div>
                  {r.title && <p className="text-sm font-medium mb-2 line-clamp-2">{r.title}</p>}
                  <div className="flex gap-2">
                    <a href={r.url} target="_blank" className="text-sm underline">상품 보기</a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results && results.length === 0 && !isLoading && !error && (
            <div className="rounded-md border px-4 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              두 플랫폼 모두에서 매칭된 상품이 없습니다. 입력을 변경해 다시 시도해 주세요.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
