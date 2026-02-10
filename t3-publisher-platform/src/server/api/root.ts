import { createTRPCRouter } from "~/server/api/trpc";

import { authRouter } from "./routers/auth";
import { postsRouter } from "./routers/posts";
import { likesRouter } from "./routers/likes";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  posts: postsRouter,
  likes: likesRouter,
});

export type AppRouter = typeof appRouter;
