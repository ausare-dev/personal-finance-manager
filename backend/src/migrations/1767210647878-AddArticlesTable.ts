import { MigrationInterface, QueryRunner } from "typeorm";

export class AddArticlesTable1767210647878 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "articles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "content" text NOT NULL,
                "category" character varying NOT NULL,
                "summary" character varying,
                "readCount" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_articles" PRIMARY KEY ("id")
            )`,
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_articles_category" ON "articles" ("category")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_articles_category"`);
        await queryRunner.query(`DROP TABLE "articles"`);
    }

}
