import { router } from "../trpc";
import { helloRouter } from "./hello";
import { testRouter } from "./test";
export const appRouter = router({
  hello: helloRouter,
  test: testRouter,
});

export type AppRouter = typeof appRouter;
