#!/usr/bin/env bash
set -e
pm2 stop meingym
prisma generate
prisma migrate deploy
npm run build
echo "Updating all actions..."
npm run update-actions
pm2 start meingym
