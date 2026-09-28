// src/users/controllers/users.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UsersService } from '../services/users.service.js';
import { UsersEntity } from '../entities/users.entity.js';
import { USER_ORIGIN } from '../../../constants/index.js';
import { UserDto } from '../dtos/user.dto.js';
import { PaginationDto } from '../../../common/dtos/pagination.dto.js';
import { UpdateUserDto } from '../dtos/update.user.dto.js';

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

  // find a user by id
  @Get('find/:userId')
  public async findUserById(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UsersEntity> {
    return await this.usersService.findUserById(userId);
  }

  // get all users
  @Get('all')
  public async findAllUsers(@Query() paginationDto: PaginationDto): Promise<{
    limit: number;
    offset: number;
    count: number;
    users: UsersEntity[];
  }> {
    return await this.usersService.findAllUsers(paginationDto);
  }

  // update a user by id
  @Put('update/:userId')
  public async updateUserById(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updatedUserData: UpdateUserDto,
  ): Promise<{ status: boolean; user: UsersEntity }> {
    return await this.usersService.updateUserById(updatedUserData, userId);
  }

  // delete a user by id
  @Delete('delete/:userId')
  public async deleteUserById(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ status: boolean; user: UsersEntity }> {
    return await this.usersService.deleteUserById(userId);
  }
}
