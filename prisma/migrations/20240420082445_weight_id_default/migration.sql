-- AlterTable
CREATE SEQUENCE weight_id_seq;
ALTER TABLE "Weight" ALTER COLUMN "id" SET DEFAULT nextval('weight_id_seq');
ALTER SEQUENCE weight_id_seq OWNED BY "Weight"."id";
