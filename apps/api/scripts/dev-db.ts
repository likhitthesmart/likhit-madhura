/* Boots a local embedded PostgreSQL for development on machines without Docker/Postgres.
   Usage: npm run dev:db  (keep it running; Ctrl+C stops it) */
import EmbeddedPostgres from "embedded-postgres";

const pg = new EmbeddedPostgres({
  databaseDir: "./.pgdata",
  user: "postgres",
  password: "postgres",
  port: 5433,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

async function main() {
  const fs = await import("fs");
  if (!fs.existsSync("./.pgdata/PG_VERSION")) {
    await pg.initialise();
  }
  await pg.start();
  const clusterDbs = await pg.getPgClient();
  await clusterDbs.connect();
  const exists = await clusterDbs.query("SELECT 1 FROM pg_database WHERE datname = 'madhura'");
  if (exists.rowCount === 0) await clusterDbs.query("CREATE DATABASE madhura");
  await clusterDbs.end();
  console.log("Embedded Postgres running on port 5433 (db: madhura). Press Ctrl+C to stop.");
  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch(async (e) => {
  console.error(e);
  await pg.stop().catch(() => undefined);
  process.exit(1);
});
