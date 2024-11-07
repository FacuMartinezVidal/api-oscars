import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const testRouter = router({
  createTest: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.test.create({ data: { name: input.name } });
      return { success: true };
    }),
});
