import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const helloRouter = router({
  greeting: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input, ctx }) => {
      return {
        greeting: `Hello ${input.name ?? "World"}!`,
      };
    }),
});
