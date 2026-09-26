// src/users/controllers/users.controller.ts

import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from '../services/users.service.js';
import { UsersEntity } from '../entities/users.entity.js';
import { USER_ORIGIN } from '../../../constants/index.js';
import { UserDto } from '../dtos/user.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // create a new user
  @Post('register')
  public async createNewUser(
    @Body() newUserData: UserDto,
  ): Promise<{ status: boolean; message: string; user: UsersEntity }> {
    return await this.usersService.createNewUser(newUserData, USER_ORIGIN.WEB);
  }
}
