#!/usr/bin/env bash
set -e
pm2 stop meingym

npm ci

prisma generate
prisma migrate deploy
npm run build

#echo "Updating data in DB..."
#npm run update-actions
#npm run update-training-exercises
#npm run update-approaches-groups
#npm run create-equip-for-users
npm run update-personal-records

pm2 start meingym
