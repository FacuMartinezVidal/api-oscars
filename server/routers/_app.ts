import { router } from "../trpc";
import { helloRouter } from "./hello";
import { testRouter } from "./test";
import { mongoRouter } from "./mongo";
import { cassandraRouter } from "./cassandra";
import { sqlRouter } from "./sql";

export const appRouter = router({
  hello: helloRouter,
  test: testRouter,
  mongo: mongoRouter,
  cassandra: cassandraRouter,
  sql: sqlRouter,
});

export type AppRouter = typeof appRouter;
