#!/bin/sh
set -e

# Schema changes only through committed migrations (SDS §2.5); seed only when asked.
npx prisma migrate deploy
if [ "$SEED_ON_START" = "true" ]; then
  npx prisma db seed
fi

exec node dist/src/index.js
