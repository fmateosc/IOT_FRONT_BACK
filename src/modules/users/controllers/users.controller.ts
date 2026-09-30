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
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../services/users.service.js';
import { UsersEntity } from '../entities/users.entity.js';
import { USER_ORIGIN } from '../../../constants/index.js';
import { UserDto } from '../dtos/user.dto.js';
import { PaginationDto } from '../../../common/dtos/pagination.dto.js';
import { UpdateUserDto } from '../dtos/update.user.dto.js';
import { PasswordUserDto } from '../dtos/update.password.user.dto.js';
import { AuthGuard } from '../../auth/guard/auth.guard.js';
import { AccessLevelGuard } from '../../auth/guard/access-level.guard.js';
import { PublicAccess } from '../../auth/decorators/public.decorator.js';
import { Access } from '../../auth/decorators/access.decorator.js';

@Controller('users')
@UseGuards(AuthGuard, AccessLevelGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // create a new user
  @PublicAccess()
  @Post('register')  
  public async createNewUser(
    @Body() newUserData: UserDto,
  ): Promise<{ status: boolean; message: string; user: UsersEntity }> {
    return await this.usersService.createNewUser(newUserData, USER_ORIGIN.WEB);
  }

  // create a new user by ROOT
  @Access("ROOT")
  @Post('register/root')  
  public async createNewUserByRoot(
    @Body() newUserData: UserDto,
  ): Promise<{ status: boolean; message: string; user: UsersEntity }> {
    return await this.usersService.createNewUser(newUserData, USER_ORIGIN.ROOT);
  }

  // find a user by id
  @Access("ADMIN")
  @Get('find/:userId')
  public async findUserById(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UsersEntity> {
    return await this.usersService.findUserById(userId);
  }

  // get all users
  @Access("ROOT")
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
  @Access("ADMIN")
  @Put('update/:userId')
  public async updateUserById(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updatedUserData: UpdateUserDto,
  ): Promise<{ status: boolean; user: UsersEntity }> {
    return await this.usersService.updateUserById(updatedUserData, userId);
  }

  // delete a user by id
  @Access("ADMIN")
  @Delete('delete/:userId')
  public async deleteUserById(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ status: boolean; user: UsersEntity }> {
    return await this.usersService.deleteUserById(userId);
  }

  // update user password by id
  @Access("ADMIN")
  @Put('update/password/:userId')
  public async updateUserPasswordById(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() userPasswordData: PasswordUserDto,
  ): Promise<{ status: boolean; user: UsersEntity }> {
    return await this.usersService.updateUserPasswordById(
      userPasswordData,
      userId,
    );
  }
}
