"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function LatestPost() {
  const [{ items }] = api.posts.feed.useSuspenseQuery({ limit: 1 });
  const latestPost = items[0];

  const utils = api.useUtils();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createPost = api.posts.create.useMutation({
    onSuccess: async () => {
      await utils.posts.feed.invalidate();
      await utils.posts.mine.invalidate();
      setTitle("");
      setContent("");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestPost ? (
        <p className="truncate">Latest post: {latestPost.title}</p>
      ) : (
        <p>No posts yet.</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({ title, content });
        }}
        className="mt-3 flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />

        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-2xl bg-white/10 px-4 py-2 text-white"
          rows={4}
        />

        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createPost.isPending}
        >
          {createPost.isPending ? "Submitting..." : "Submit"}
        </button>

        {createPost.error ? (
          <p className="text-sm text-red-300">{createPost.error.message}</p>
        ) : null}
      </form>
    </div>
  );
}
