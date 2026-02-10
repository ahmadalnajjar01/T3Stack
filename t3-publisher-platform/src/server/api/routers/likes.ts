import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const likesRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.like.findUnique({
        where: { userId_postId: { userId, postId: input.postId } },
      });

      if (existing) {
        await ctx.db.like.delete({ where: { id: existing.id } });
        return { liked: false };
      }

      // ensure post exists
      const post = await ctx.db.post.findUnique({ where: { id: input.postId } });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.like.create({
        data: { userId, postId: input.postId },
      });

      return { liked: true };
    }),
});