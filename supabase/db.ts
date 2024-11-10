import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const client = postgres(
  "postgresql://postgres.vjvkskzmhbmzvbtrmlwg:GRUPO07-UADE@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
);
export const db = drizzle(client);
