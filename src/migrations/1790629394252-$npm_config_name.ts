import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1790629394252 implements MigrationInterface {
    name = ' $npmConfigName1790629394252'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."acl_action_enum" AS ENUM('publish', 'subscribe', 'all')`);
        await queryRunner.query(`CREATE TYPE "public"."acl_permission_enum" AS ENUM('allow', 'deny')`);
        await queryRunner.query(`CREATE TABLE "acl" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "ipaddress" text DEFAULT '', "username" text DEFAULT '', "clientid" text DEFAULT '', "action" "public"."acl_action_enum" NOT NULL, "permission" "public"."acl_permission_enum" NOT NULL, "topic" text NOT NULL, "qos" smallint NOT NULL, "retain" smallint NOT NULL, "create_user_id" uuid, CONSTRAINT "PK_c8c0f09d3c1ef65542bea031130" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "acl" ADD CONSTRAINT "FK_88059f8fce918658762fe715c73" FOREIGN KEY ("create_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "acl" DROP CONSTRAINT "FK_88059f8fce918658762fe715c73"`);
        await queryRunner.query(`DROP TABLE "acl"`);
        await queryRunner.query(`DROP TYPE "public"."acl_permission_enum"`);
        await queryRunner.query(`DROP TYPE "public"."acl_action_enum"`);
    }

}
