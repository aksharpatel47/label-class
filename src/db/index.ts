import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

export const sql = postgres(process.env.DATABASE_URL!, {
  idle_timeout: 60,
});
export const db = drizzle(sql, {
  schema: schema,
});
