// src/modules/services/users.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from '../entities/users.entity.js';
import { Repository } from 'typeorm';
import { UserDto } from '../dtos/user.dto.js';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { ACCESS_LEVEL, USER_ORIGIN } from '../../../constants/index.js';

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
}
