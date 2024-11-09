import { router } from "../trpc";
import { helloRouter } from "./hello";
import { testRouter } from "./test";
import { mongoRouter } from "./mongo";
export const appRouter = router({
  hello: helloRouter,
  test: testRouter,
  mongo: mongoRouter,
});

export type AppRouter = typeof appRouter;
