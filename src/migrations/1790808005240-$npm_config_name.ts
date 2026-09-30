import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1790808005240 implements MigrationInterface {
    name = ' $npmConfigName1790808005240'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "general_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "timezone" character varying(100) NOT NULL DEFAULT 'Atlantic/Canary', "emqxApiKey" character varying(100), "emqxApiSecretKey" character varying(500), "emqxAppHost" character varying(100) DEFAULT 'localhost', "emqxAppPort" integer DEFAULT '18084', "mqttApiUser" character varying(100) DEFAULT 'emqx', "mqttApiPassword" character varying(100) DEFAULT 'Fm12345678@', "mqttApiPort" integer DEFAULT '1883', "telegramBotToken" character varying(500), CONSTRAINT "PK_c3b79ecb7c2446f3ba18a07f8e4" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "general_settings"`);
    }

}
