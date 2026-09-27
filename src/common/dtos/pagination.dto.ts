// src/commons/dtos/pagination.dto.ts

import { Type } from 'class-transformer';
import { IsOptional, IsPositive, IsUUID, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  type?: any;
}
