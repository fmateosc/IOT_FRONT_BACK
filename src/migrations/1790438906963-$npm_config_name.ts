import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1790438906963 implements MigrationInterface {
    name = ' $npmConfigName1790438906963'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_useraccess_enum" AS ENUM('ROOT', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "username" text NOT NULL, "password" text NOT NULL, "userAccess" "public"."users_useraccess_enum" NOT NULL DEFAULT 'ADMIN', "userFullName" text, "userEmail" text NOT NULL, "salt" text DEFAULT '', "isSuperuser" boolean NOT NULL DEFAULT false, "userToken" text, "userLogin" boolean NOT NULL DEFAULT false, "userLastseen" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "userStatus" boolean NOT NULL DEFAULT true, "userOrigin" text DEFAULT 'web', CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_9047b2d58f91586f14f0cf44a45" UNIQUE ("userEmail"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_useraccess_enum"`);
    }

}
