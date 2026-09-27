import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TYPE "job_status" AS ENUM ('draft', 'published', 'closed')
    `);
    await queryRunner.query(`
      CREATE TYPE "employment_type" AS ENUM ('full_time', 'part_time', 'contract', 'internship')
    `);

    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "description" text NOT NULL,
        "status" "job_status" NOT NULL DEFAULT 'draft',
        "employment_type" "employment_type" NOT NULL,
        "required_skills" text[] NOT NULL DEFAULT '{}',
        "min_experience" integer NOT NULL DEFAULT 0,
        "max_applications" integer,
        "published_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_jobs" PRIMARY KEY ("id"),
        CONSTRAINT "chk_jobs_min_experience" CHECK ("min_experience" >= 0),
        CONSTRAINT "chk_jobs_max_applications" CHECK ("max_applications" IS NULL OR "max_applications" > 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_jobs_status" ON "jobs" ("status")`);
    await queryRunner.query(
      `CREATE INDEX "idx_jobs_required_skills" ON "jobs" USING GIN ("required_skills")`,
    );

    await queryRunner.query(`
      CREATE TABLE "candidates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" text NOT NULL,
        "full_name" text NOT NULL,
        "phone" text,
        "headline" text,
        "experience_years" integer NOT NULL DEFAULT 0,
        "skills" text[] NOT NULL DEFAULT '{}',
        "resume_url" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_candidates" PRIMARY KEY ("id"),
        CONSTRAINT "chk_candidates_experience_years" CHECK ("experience_years" >= 0)
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_candidates_email" ON "candidates" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_candidates_experience_years" ON "candidates" ("experience_years")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_candidates_skills" ON "candidates" USING GIN ("skills")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_candidates_skills"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_candidates_experience_years"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_candidates_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "candidates"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_jobs_required_skills"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_jobs_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jobs"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "employment_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "job_status"`);
  }
}
