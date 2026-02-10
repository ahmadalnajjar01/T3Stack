"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  _count?: {
    likes: number;
  };
}

export default function PublisherDashboardPage() {
  const utils = api.useUtils();

  const mine = api.posts.mine.useQuery();

  const createPost = api.posts.create.useMutation({
    onSuccess: async () => {
      await utils.posts.mine.invalidate();
      setForm({ title: "", content: "" });
    },
  });

  const updatePost = api.posts.update.useMutation({
    onSuccess: async () => {
      await utils.posts.mine.invalidate();
      setEditing(null);
      setForm({ title: "", content: "" });
    },
  });

  const deletePost = api.posts.delete.useMutation({
    onSuccess: async () => {
      await utils.posts.mine.invalidate();
    },
  });

  const [form, setForm] = useState({ title: "", content: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "create">("posts");

  const isSaving = createPost.isPending || updatePost.isPending;

  const posts = useMemo(() => mine.data ?? [], [mine.data]);

  const totalLikes = useMemo(
    () => posts.reduce((sum, p) => sum + (p._count?.likes ?? 0), 0),
    [posts]
  );

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;

    if (editing) {
      await updatePost.mutateAsync({ id: editing, ...form });
    } else {
      await createPost.mutateAsync(form);
    }

    setActiveTab("posts");
  };

  const startEdit = (p: Post) => {
    setEditing(p.id);
    setForm({ title: p.title, content: p.content });
    setActiveTab("create");
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ title: "", content: "" });
    setActiveTab("posts");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold">Publisher</h2>
          <p className="text-sm text-gray-500">Dashboard</p>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
              activeTab === "posts"
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">My Posts</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("create");
              if (editing) {
                cancelEdit();
              }
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
              activeTab === "create"
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">New Post</span>
          </button>

          
          <a
            href="/publisher/analytics"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-medium">Analytics</span>
          </a>
        </nav>

        {/* Stats */}
        <div className="mt-8 space-y-4 rounded-lg bg-gray-50 p-4">
          <div>
            <div className="text-2xl font-bold">{posts.length}</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{totalLikes}</div>
            <div className="text-sm text-gray-600">Total Likes</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl">
          {/* Create / Edit View */}
          {activeTab === "create" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">
                {editing ? "Edit Post" : "Create New Post"}
              </h1>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Enter post title..."
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label htmlFor="content" className="mb-2 block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <textarea
                      id="content"
                      className="min-h-[300px] w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Write your content here..."
                      value={form.content}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, content: e.target.value }))
                      }
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={submit}
                      disabled={isSaving || !form.title.trim() || !form.content.trim()}
                      className="rounded-lg bg-black px-6 py-3 font-medium text-white transition-opacity hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : editing ? "Update Post" : "Publish Post"}
                    </button>

                    {editing && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Posts List View */}
          {activeTab === "posts" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">My Posts</h1>
                <button
                  onClick={() => {
                    setActiveTab("create");
                    setEditing(null);
                    setForm({ title: "", content: "" });
                  }}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Create Post
                </button>
              </div>

              {mine.isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
                </div>
              )}

              {mine.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                  Failed to load posts. Please try again.
                </div>
              )}

              {!mine.isLoading && posts.length === 0 && (
                <div className="rounded-xl border border-dashed bg-white p-12 text-center">
                  <svg
                    className="mx-auto mb-4 h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    No posts yet
                  </h3>
                  <p className="mb-4 text-gray-600">
                    Get started by creating your first post
                  </p>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Create Post
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {posts.map((p) => (
                  <article
                    key={p.id}
                    className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="mb-2 text-xl font-semibold text-gray-900">
                          {p.title}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                            {p._count?.likes ?? 0} likes
                          </span>
                          {p.createdAt && (
                            <span>
                              {new Date(p.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this post?")) {
                              deletePost.mutate({ id: p.id });
                            }
                          }}
                          disabled={deletePost.isPending}
                          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <p className="line-clamp-3 whitespace-pre-wrap text-gray-700">
                      {p.content}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}