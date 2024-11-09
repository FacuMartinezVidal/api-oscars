import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { PrismaClient } from "@prisma/client";
import { DataAPIClient } from "@datastax/astra-db-ts";
export async function createContext(opts: FetchCreateContextFnOptions) {
  const prisma = new PrismaClient();
  const astra = new DataAPIClient(
    "AstraCS:SUkXZXLLyYCGfWIvHFrsBSWx:ce47ced7dbe89c826dff92a47d0514d7758019e66960bf485041d34f5bcddb64"
  );
  const db_astra = astra.db(
    "https://747da372-a3f4-40ff-9b5b-5af02aad27db-us-east-2.apps.astra.datastax.com",
    { namespace: "oscars" }
  );
  return {
    prisma,
    db_astra,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
