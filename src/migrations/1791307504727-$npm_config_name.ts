import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1791307504727 implements MigrationInterface {
    name = ' $npmConfigName1791307504727'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "name" text NOT NULL, "status" boolean NOT NULL, "days" text NOT NULL, "time" character varying(255) NOT NULL, "timeZone" character varying, "topic" character varying(255) NOT NULL, "command" jsonb, "task_user_id" uuid, CONSTRAINT "UQ_20f1f21d6853d9d20d501636ebd" UNIQUE ("name"), CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_a7fda7877a45c72c2bf5f100eb8" FOREIGN KEY ("task_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_a7fda7877a45c72c2bf5f100eb8"`);
        await queryRunner.query(`DROP TABLE "task"`);
    }

}
