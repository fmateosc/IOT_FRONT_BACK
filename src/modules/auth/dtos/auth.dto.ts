// src/modules/auth/dtos/auth.dtos.ts

import { IsNotEmpty, IsString } from 'class-validator';
import { AuthBody } from '../intefaces/auth.interface.js';

export class AuthDto implements AuthBody {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
