#!/bin/sh
set -e

# Schema changes only through committed migrations (SDS §2.5); seed only when asked.
# On Cloud Run the migration job does this before each release, so the service sets RUN_MIGRATIONS=false.
if [ "$RUN_MIGRATIONS" != "false" ]; then
  npx prisma migrate deploy
fi
if [ "$SEED_ON_START" = "true" ]; then
  npx prisma db seed
fi

exec node dist/src/index.js
