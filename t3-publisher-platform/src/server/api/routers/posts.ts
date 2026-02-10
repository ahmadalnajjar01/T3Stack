import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const postsRouter = createTRPCRouter({
  // ===========================
  // Public Feed
  // ===========================
  feed: publicProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(30).default(10),
        q: z.string().trim().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, q } = input;

      const items = await ctx.db.post.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        where: q
          ? { title: { contains: q, mode: "insensitive" } }
          : undefined,
        include: {
          publisher: { select: { id: true, name: true } },
          _count: { select: { likes: true } },
          likes: ctx.session?.user
            ? { where: { userId: ctx.session.user.id }, select: { id: true } }
            : false,
        },
      });

      let nextCursor: string | undefined = undefined;
      if (items.length > limit) {
        const next = items.pop();
        nextCursor = next?.id;
      }

      return { items, nextCursor };
    }),

  // ===========================
  // Publisher - Own Posts
  // ===========================
  mine: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "PUBLISHER") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return ctx.db.post.findMany({
      where: { publisherId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { likes: true } } },
    });
  }),

  // ===========================
  // Create Post
  // ===========================
  create: protectedProcedure
    .input(z.object({ title: z.string().min(1), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "PUBLISHER") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.post.create({
        data: {
          title: input.title,
          content: input.content,
          publisherId: ctx.session.user.id,
        },
      });
    }),

  // ===========================
  // Update Post
  // ===========================
  update: protectedProcedure
    .input(z.object({ id: z.string(), title: z.string().min(1), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "PUBLISHER") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const post = await ctx.db.post.findUnique({ where: { id: input.id } });
      if (!post || post.publisherId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.post.update({
        where: { id: input.id },
        data: { title: input.title, content: input.content },
      });
    }),

  // ===========================
  // Delete Post
  // ===========================
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "PUBLISHER") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const post = await ctx.db.post.findUnique({ where: { id: input.id } });
      if (!post || post.publisherId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.post.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  // ===========================
  // ANALYTICS (Required Feature)
  // ===========================
  analytics: protectedProcedure
    .input(z.object({ days: z.number().min(7).max(90).default(30) }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "PUBLISHER") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const key = (d: Date) => d.toISOString().slice(0, 10);

      const posts = await ctx.db.post.findMany({
        where: { publisherId: ctx.session.user.id, createdAt: { gte: since } },
        select: { createdAt: true },
      });

      const likes = await ctx.db.like.findMany({
        where: { post: { publisherId: ctx.session.user.id }, createdAt: { gte: since } },
        select: { createdAt: true },
      });

      const postsByDay: Record<string, number> = {};
      for (const p of posts) {
        const k = key(p.createdAt);
        postsByDay[k] = (postsByDay[k] ?? 0) + 1;
      }

      const likesByDay: Record<string, number> = {};
      for (const l of likes) {
        const k = key(l.createdAt);
        likesByDay[k] = (likesByDay[k] ?? 0) + 1;
      }

      const series: { date: string; posts: number; likes: number }[] = [];
      for (let i = input.days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const k = key(d);
        series.push({
          date: k,
          posts: postsByDay[k] ?? 0,
          likes: likesByDay[k] ?? 0,
        });
      }

      return {
        days: input.days,
        totalPosts: posts.length,
        totalLikes: likes.length,
        series,
      };
    }),
});
