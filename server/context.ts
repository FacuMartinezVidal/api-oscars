import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { PrismaClient } from "@prisma/client";
import { DataAPIClient } from "@datastax/astra-db-ts";
const { Client } = require("cassandra-driver");
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

// Create a single instance of the postgres client with connection pool settings
const postgresClient = postgres(
  "postgresql://postgres.vjvkskzmhbmzvbtrmlwg:GRUPO07-UADE@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
  {
    max: 10, // Set maximum number of connections in the pool
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout after 10 seconds
  }
);

// Create a single instance of drizzle
const sqlClient = drizzle(postgresClient);

export async function createContext(opts: FetchCreateContextFnOptions) {
  const prisma = new PrismaClient();

  const cassandra = new Client({
    cloud: {
      secureConnectBundle: "./secure-connect-oscars.zip",
    },
    credentials: {
      username: "ZXRsKzejZBiTkYsxfaMZSeuo",
      password:
        "me,Zsuf3Z_kj.rk0UAm.uSZySEJfPg7ZfW-sEHtZnii4q6XonqgxAjCWb0J-TYS8npvD9H2Kvxb5rioTFvj9x6NBqduo.QcKvzOKwOGS4-Wxwnpdyvh5y.FyYCnDbZNc",
    },
  });
  await cassandra.connect();

  return {
    prisma,
    cassandra,
    sql: sqlClient,
  };
}

// Add a cleanup function to close connections when needed
export async function closeConnections() {
  await postgresClient.end();
}

export type Context = Awaited<ReturnType<typeof createContext>>;
