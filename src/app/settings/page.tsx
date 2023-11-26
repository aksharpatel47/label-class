import { db } from "@/db";
import { sql } from "drizzle-orm";

export default async function Page() {
  const tables = await db.execute(
    sql`SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';`
  );
  return (
    <div>
      <h1>Settings</h1>
      {JSON.stringify(tables, null, 2)}
    </div>
  );
}
