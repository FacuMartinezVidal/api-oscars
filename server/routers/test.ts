import { Inter } from "next/font/google";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

export const testRouter = router({
  createTest: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.test.create({ data: { name: input.name } });
      return { success: true };
    }),
  testAstra: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.db_astra.collection(input.name).insertOne({
          name: "ALOHA",
        });
        return { success: true };
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error fetching data from AstraDB",
        });
      }
    }),
});
