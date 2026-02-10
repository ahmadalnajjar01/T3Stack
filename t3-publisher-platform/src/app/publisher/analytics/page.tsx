"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

type DayPoint = {
  date: string;   // YYYY-MM-DD
  posts: number;
  likes: number;
};

function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-sm transition-all hover:shadow-md">
      <div className="relative z-10">
        <div className="mb-3 flex items-start justify-between">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          {trend && (
            <span className={`text-xs font-semibold ${
              trend === "up" ? "text-green-600" : 
              trend === "down" ? "text-red-600" : 
              "text-gray-500"
            }`}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </span>
          )}
        </div>
        <div className="mb-1 text-3xl font-bold tracking-tight text-gray-900">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {sub && (
          <p className="text-xs font-medium text-gray-500">{sub}</p>
        )}
      </div>
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-40px] rounded-full bg-gradient-to-br from-gray-100/40 to-transparent blur-2xl transition-transform group-hover:scale-110" />
    </div>
  );
}

function SparkRow({
  title,
  data,
  getValue,
  color = "black",
}: {
  title: string;
  data: DayPoint[];
  getValue: (d: DayPoint) => number;
  color?: "black" | "blue" | "purple" | "green";
}) {
  const max = Math.max(1, ...data.map(getValue));
  const total = data.reduce((sum, d) => sum + getValue(d), 0);
  const avg = data.length ? (total / data.length).toFixed(1) : "0";

  const colorClasses = {
    black: "bg-gray-900",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
  };

  const bgColorClasses = {
    black: "bg-gray-100",
    blue: "bg-blue-50",
    purple: "bg-purple-50",
    green: "bg-green-50",
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Average: <span className="font-semibold text-gray-700">{avg}</span> per day
            </p>
          </div>
          <div className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
            Last {data.length} days
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-3">
          {data.map((d) => {
            const v = getValue(d);
            const w = Math.round((v / max) * 100);
            const formattedDate = new Date(d.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            return (
              <div key={d.date} className="group flex items-center gap-4">
                <div className="w-20 shrink-0 text-xs font-medium text-gray-600">
                  {formattedDate}
                </div>
                <div className="relative flex-1">
                  <div className={`h-3 overflow-hidden rounded-full ${bgColorClasses[color]}`}>
                    <div
                      className={`h-full rounded-full ${colorClasses[color]} transition-all duration-500 ease-out`}
                      style={{ width: `${w}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 shrink-0 text-right">
                  <span className="text-sm font-semibold text-gray-900">{v}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const analytics = api.posts.analytics.useQuery(
    { days },
    { staleTime: 15_000, refetchOnWindowFocus: false }
  );

  const series = useMemo(() => {
    return (analytics.data?.series ?? []) as DayPoint[];
  }, [analytics.data]);

  const totals = useMemo(() => {
    const totalLikes = analytics.data?.totalLikes ?? 0;
    const totalPosts = analytics.data?.totalPosts ?? 0;

    const avgLikes = series.length ? totalLikes / series.length : 0;
    const avgPosts = series.length ? totalPosts / series.length : 0;

    const bestLikesDay = series.reduce(
      (best, cur) => (cur.likes > best.likes ? cur : best),
      series[0] ?? { date: "-", likes: 0, posts: 0 }
    );

    const bestPostsDay = series.reduce(
      (best, cur) => (cur.posts > best.posts ? cur : best),
      series[0] ?? { date: "-", likes: 0, posts: 0 }
    );

    return {
      totalLikes,
      totalPosts,
      avgLikes: avgLikes.toFixed(1),
      avgPosts: avgPosts.toFixed(1),
      bestLikesDay,
      bestPostsDay,
    };
  }, [analytics.data, series]);

  if (analytics.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
          <p className="mt-4 text-sm font-medium text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (analytics.error) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Failed to load analytics</h3>
                <p className="mt-1 text-sm text-red-700">{analytics.error.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics.data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <span className="text-3xl">📊</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No analytics data yet</h3>
          <p className="mt-2 text-sm text-gray-600">Start publishing to see your stats</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Track your engagement and publishing velocity over time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            <Link
              href="/publisher/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400"
            >
              <span>←</span>
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            label="Total Posts" 
            value={totals.totalPosts} 
            sub={`in last ${days} days`}
          />
          <StatCard 
            label="Total Likes" 
            value={totals.totalLikes} 
            sub={`in last ${days} days`}
          />
          <StatCard 
            label="Avg Likes/Day" 
            value={totals.avgLikes}
            sub="daily average"
          />
          <StatCard 
            label="Avg Posts/Day" 
            value={totals.avgPosts}
            sub="daily average"
          />
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <span className="text-2xl">❤️</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Best Day (Likes)</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {totals.bestLikesDay.likes} likes
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {new Date(totals.bestLikesDay.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Most Productive Day</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {totals.bestPostsDay.posts} posts
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {new Date(totals.bestPostsDay.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SparkRow 
            title="Daily Likes" 
            data={series} 
            getValue={(d) => d.likes}
            color="blue"
          />
          <SparkRow 
            title="Posts Per Day" 
            data={series} 
            getValue={(d) => d.posts}
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}