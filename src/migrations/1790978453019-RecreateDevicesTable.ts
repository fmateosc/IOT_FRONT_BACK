import { MigrationInterface, QueryRunner } from "typeorm";

export class RecreateDevicesTable1790978453019 implements MigrationInterface {
    name = 'RecreateDevicesTable1790978453019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deviceType" "public"."devices_devicetype_enum" NOT NULL DEFAULT 'ESP32', "deviceName" text NOT NULL, "deviceSerial" text NOT NULL, "deviceDescription" text, "deviceLocation" jsonb, "bridgeRuleId" text, "bridgeRuleEnabled" boolean, "deviceOnline" boolean NOT NULL DEFAULT false, "deviceStatus" boolean NOT NULL DEFAULT true, "deviceLastseen" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "device_user_id" uuid, CONSTRAINT "UQ_2b723957560a708e7038bf7bf55" UNIQUE ("deviceSerial"), CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_ccc3116afb5b91e46c92b8464b6" FOREIGN KEY ("device_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_ccc3116afb5b91e46c92b8464b6"`);
        await queryRunner.query(`DROP TABLE "devices"`);
    }

}
