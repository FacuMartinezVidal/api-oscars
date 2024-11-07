import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { PrismaClient } from "@prisma/client";
export async function createContext(opts: FetchCreateContextFnOptions) {
  const prisma = new PrismaClient();
  return {
    prisma,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
