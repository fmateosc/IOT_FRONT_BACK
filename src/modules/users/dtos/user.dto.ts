// src/modules/users/dtos/user.dto.ts

import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ACCESS_LEVEL } from '../../../constants/index.js';

export class UserDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(16)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(
    /(?=(.*[0-9]))(?=.*[\!@#$%^&*()\\[\]{}\-_+=|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{8,20}/,
    {
      message:
        'La contraseña debe contener al menos una letra en minúscula, una en mayúscula, un número, un caracter especial y debe contener entre 8 y 20 aracteres',
    },
  )
  password: string;

  @IsOptional()
  @IsEnum(ACCESS_LEVEL)
  userAccess?: ACCESS_LEVEL;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  userFullName: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  userEmail: string;

  @IsOptional()
  @IsString()
  userToken?: string;

  @IsOptional()
  @IsBoolean()
  userLogin?: boolean;

  @IsOptional()
  @IsDate()
  userLastseen?: Date;

  @IsOptional()
  @IsBoolean()
  userStatus?: boolean;

  @IsOptional()
  @IsString()
  salt?: string;

  @IsOptional()
  @IsBoolean()
  isSuperuser?: boolean;
}
