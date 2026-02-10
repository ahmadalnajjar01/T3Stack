"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "~/trpc/react";

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function FeedPage() {
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 400);

  const utils = api.useUtils();

  const feed = api.posts.feed.useInfiniteQuery(
    { limit: 10, q: dq || undefined },
    {
      getNextPageParam: (last) => last.nextCursor,
    }
  );

  const toggleLike = api.likes.toggle.useMutation({
    onSuccess: async () => {
      await utils.posts.feed.invalidate();
    },
  });

  // simple infinite scroll using IntersectionObserver
  useEffect(() => {
    const el = document.getElementById("feed-sentinel");
    if (!el) return;

    const obs = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first?.isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) {
        void feed.fetchNextPage();
      }
    });

    obs.observe(el);
    return () => obs.disconnect();
  }, [feed.hasNextPage, feed.isFetchingNextPage, feed.fetchNextPage]);

  const items = useMemo(() => {
    return feed.data?.pages.flatMap((p) => p.items) ?? [];
  }, [feed.data]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Feed</h1>

      <input
        className="w-full rounded-md border px-3 py-2"
        placeholder="Search posts..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {feed.isLoading ? <p>Loading...</p> : null}
      {feed.error ? <p className="text-red-600">Failed to load feed</p> : null}

      <div className="space-y-3">
        {items.map((p: any) => {
          const likedByMe = Array.isArray(p.likes) && p.likes.length > 0;

          return (
            <div key={p.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-sm text-gray-600">
                    by {p.publisher?.name ?? "Unknown"} • Likes: {p._count?.likes ?? 0}
                  </div>
                </div>

                <button
                  className="rounded-md border px-3 py-1"
                  onClick={() => toggleLike.mutate({ postId: p.id })}
                  disabled={toggleLike.isPending}
                >
                  {likedByMe ? "Unlike" : "Like"}
                </button>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm">{p.content}</p>
            </div>
          );
        })}
      </div>

      <div id="feed-sentinel" className="h-10" />

      {feed.isFetchingNextPage ? <p>Loading more...</p> : null}
      {!feed.hasNextPage && !feed.isLoading ? (
        <p className="text-sm text-gray-500">No more posts.</p>
      ) : null}
    </div>
  );
}
