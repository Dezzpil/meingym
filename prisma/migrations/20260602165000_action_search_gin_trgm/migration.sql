-- Enable trigram extension for fast LIKE '%...%' search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram index for Action.search to accelerate substring search
CREATE INDEX IF NOT EXISTS "Action_search_trgm_idx"
  ON "Action"
  USING GIN ("search" gin_trgm_ops);
