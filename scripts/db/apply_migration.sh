#!/bin/bash
set -a
source .env
set +a

export PGPASSWORD=$(echo $DATABASE_URL | grep -oP 'avnadmin:\K[^@]+')

psql -h drcpg-311b7b85-drc123.g.aivencloud.com -U avnadmin -d defaultdb -p 20040 -f migrations/0001_normalize_schema.sql --set sslmode=require
