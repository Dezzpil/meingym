#!/usr/bin/env bash
set -e
pm2 stop meingym
prisma generate
prisma migrate deploy
npm run build
pm2 start meingym