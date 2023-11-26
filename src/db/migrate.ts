import { migrate } from "drizzle-orm/postgres-js/migrator";
import { client, db } from ".";

async function main() {
  await migrate(db, {
    migrationsFolder: "src/db//migrations",
  });

  await client.end();
}

(async () => {
  await main();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
