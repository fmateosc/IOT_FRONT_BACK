// src/modules/schedules/task/dtos/task.dto.ts

import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Matches,
  IsObject,
} from 'class-validator';

export class TaskDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsNotEmpty()
  status: boolean;

  @IsArray()
  @IsNotEmpty()
  days: string[];

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'The time format must be HH:mm in 24h' })
  time: string; // Hora en formato HH:mm (24h)

  @IsString()
  @IsOptional()
  timeZone?: string; // Agregar esta propiedad

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsObject()
  @IsOptional()
  command?: { [key: string]: boolean | number }; // Objeto JSON genérico
}
