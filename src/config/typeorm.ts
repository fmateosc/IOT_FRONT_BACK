// src/config/typeorm.ts

import { registerAs } from "@nestjs/config";
import { DataSource, DataSourceOptions } from "typeorm";
import {config as dotenvConfig} from 'dotenv';

dotenvConfig({path: '.env'});

const config = {
    type: 'postgres',
    host: `${process.env.DATABASE_HOST}`,
    port: `${process.env.DATABASE_PORT}`,
    username: `${process.env.POSTGRES_USER}`,
    password: `${process.env.POSTGRES_PASSWORD}`,
    database: `${process.env.POSTGRES_DB}`,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    autoLoadEntities: true,
    synchronize: false,
}

export default registerAs('typeorm', () => config)

// Crea una instancia de DataSource — que en TypeORM (desde la versión 0.3.x en adelante) es el objeto principal que representa 
// la conexión a la base de datos. Todo lo que se hace con TypeORM (repositorios, queries, migraciones) pasa por este objeto.
export const connectionSource = new DataSource(config as DataSourceOptions);


