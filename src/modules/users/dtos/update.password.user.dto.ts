// src/users/dtos/update.password.user.dto.ts

import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class PasswordUserDto {
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(
    /(?=(.*[0-9]))(?=.*[\!@#$%^&*()\\[\]{}\-_+=|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{8,20}/,
    {
      message:
        'La contraseña antigua debe contener una letra minúscula, una letra mayúscula, un número, un caracter especial y al menos 8 caracteres'
    },
  )
  currentpwd?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(
    /(?=(.*[0-9]))(?=.*[\!@#$%^&*()\\[\]{}\-_+=|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{8,20}/,
    {
      message:
        'La nueva contraseña debe contener una letra minúscula, una letra mayúscula, un número, un caracter especial y al menos 8 caracteres',
    },
  )
  newpwd?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(
    /(?=(.*[0-9]))(?=.*[\!@#$%^&*()\\[\]{}\-_+=|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{8,20}/,
    {
      message:
        'The confirmation must have one lowercase letter, one uppercase letter, one number, one special character, and at least 8 digits',
    },
  )
  confirmpwd?: string;
}
