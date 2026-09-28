// src/modules/services/users.service.ts

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from '../entities/users.entity.js';
import { Repository } from 'typeorm';
import { UserDto } from '../dtos/user.dto.js';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { ACCESS_LEVEL, USER_ORIGIN } from '../../../constants/index.js';
import { PaginationDto } from '../../../common/dtos/pagination.dto.js';
import { UpdateUserDto } from '../dtos/update.user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
  ) {}

  // create a new user
  public async createNewUser(
    newUserData: UserDto,
    origin: string,
  ): Promise<{
    status: boolean;
    message: string;
    user: UsersEntity;
  }> {
    // hash the password and create token
    const saltRounds = Number(process.env.HASH_SALT) || 10;
    const [hasehdPassword, userToken] = await Promise.all([
      bcrypt.hash(newUserData.password, saltRounds),
      randomBytes(20).toString('hex'),
    ]);

    // determine the access
    if (origin === USER_ORIGIN.WEB) {
      newUserData.isSuperuser = false;
      newUserData.userAccess = ACCESS_LEVEL.ADMIN;
    }

    // validate access and user type
    if (
      newUserData.isSuperuser === undefined &&
      newUserData.userAccess !== undefined
    ) {
      newUserData.isSuperuser = newUserData.userAccess === ACCESS_LEVEL.ROOT;
    } else if (
      newUserData.userAccess === undefined &&
      newUserData.isSuperuser !== undefined
    ) {
      newUserData.userAccess = newUserData.isSuperuser
        ? ACCESS_LEVEL.ROOT
        : ACCESS_LEVEL.ADMIN;
    } else if (
      newUserData.userAccess === undefined &&
      newUserData.isSuperuser === undefined
    ) {
      // default values
      newUserData.userAccess = ACCESS_LEVEL.ADMIN;
      newUserData.isSuperuser = false;
    }

    /* Ejemplos de cómo funciona
        Entrada (newUserData)	            Resultado Final (newUserData.isSuperuser / newUserData.userAccess)
        { isSuperuser: true }	                isSuperuser: true, userAccess: ROOT
        { userAccess: ACCESS_LEVEL.ADMIN }	    isSuperuser: false, userAccess: ADMIN
        {} (ninguno de los dos)	                isSuperuser: false, userAccess: ADMIN
        { isSuperuser: false }	                isSuperuser: false, userAccess: ADMIN
        { userAccess: ACCESS_LEVEL.ROOT }	    isSuperuser: true, userAccess: ROOT */

    // create the user in db
    const newUser = this.usersRepository.create({
      ...newUserData,
      password: hasehdPassword,
      userToken,
      userOrigin: origin,
    });

    const savedUser = await this.usersRepository.save(newUser);

    // TODO: create acl rules

    return {
      status: true,
      message: `El usuario "${savedUser.username}" con el rol "${savedUser.userAccess}" ha sido creado con éxito`,
      user: savedUser,
    };
  }

  // search users by Id
  public async findUserById(userId: string): Promise<UsersEntity> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('users')
      .where({ id: userId });

    const user = await queryBuilder.getOne();

    if (!user) {
      throw new HttpException(
        `El usuario con Id ${userId} no se encuentra en el sistema`,
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  // search all users
  public async findAllUsers(paginationDto: PaginationDto): Promise<{
    limit: number;
    offset: number;
    count: number;
    users: UsersEntity[];
  }> {
    const limit = paginationDto.limit || Number(process.env.LIMIT) || 1000;
    const offset = paginationDto.offset || Number(process.env.OFFSET) || 0;

    console.log(limit, offset);

    const [users, count] = await this.usersRepository
      .createQueryBuilder('users')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    if (!count) {
      throw new HttpException(
        `No hay usuarios registrados en el sistema`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      limit,
      offset,
      count,
      users,
    };
  }

  // update user by Id
  public async updateUserById(
    updatedUserData: UpdateUserDto,
    userId: string,
  ): Promise<{ status: boolean; user: UsersEntity }> {
    const existingUser = await this.findUserById(userId);

    if (updatedUserData.password) {
      const saltRounds = Number(process.env.HASH_SALT) || 10;
      updatedUserData.password = await bcrypt.hash(
        updatedUserData.password,
        saltRounds,
      );
    }

    if (existingUser.userAccess === ACCESS_LEVEL.ADMIN) {
      updatedUserData.isSuperuser = false;
      updatedUserData.userAccess = ACCESS_LEVEL.ADMIN;
      updatedUserData.userStatus = existingUser.userStatus;
    }

    await this.usersRepository.update(userId, updatedUserData);

    return {
      status: true,
      user: { ...existingUser, ...updatedUserData },
    };
  }
}
