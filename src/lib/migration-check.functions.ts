// Server function that runs the migration schema check on demand. Called
// early from the app's boot path so an out-of-date DB surfaces at startup
// with a clear error, not deep inside a user-facing request.
import { createServerFn } from "@tanstack/react-start";
import { ensureMigrationsCurrent } from "./migration-check.server";

export const checkMigrations = createServerFn({ method: "GET" }).handler(async () => {
  return ensureMigrationsCurrent();
});
