// src/modules/services/users.service.ts

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from '../entities/users.entity.js';
import { Repository } from 'typeorm';
import { UserDto } from '../dtos/user.dto.js';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PaginationDto } from '../../../common/dtos/pagination.dto.js';
import { UpdateUserDto } from '../dtos/update.user.dto.js';
import { PasswordUserDto } from '../dtos/update.password.user.dto.js';
import { AclEntity } from '../../auth/entities/acl.entity.js';
import {
  ACCESS_LEVEL,
  USER_ORIGIN,
  ACL_ACTION,
  ACL_PERMISSION,
} from '../../../constants/index.js';
import { IUserInfo } from '../../auth/intefaces/auth.interface.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(AclEntity)
    private readonly aclRepository: Repository<AclEntity>,
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
    if (savedUser.userAccess === ACCESS_LEVEL.ADMIN) {
      await this.createNewAclRule(savedUser);
    }

    return {
      status: true,
      message: `El usuario "${savedUser.username}" con el rol "${savedUser.userAccess}" ha sido creado con éxito`,
      user: savedUser,
    };
  }

  // search users by Id
  public async findUserById(
    userId: string,
    userInfo: IUserInfo,
  ): Promise<UsersEntity> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('users')
      .where({ id: userId });

    // validate user
    if (userInfo.userAccess === ACCESS_LEVEL.ADMIN) {
      queryBuilder.andWhere('users.id = :id', { id: userInfo.userId });
    }

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
  // update user by Id
  public async updateUserById(
    updatedUserData: UpdateUserDto,
    userId: string,
    userInfo: IUserInfo,
  ): Promise<{ status: boolean; user: UsersEntity }> {
    const existingUser = await this.findUserById(userId, userInfo);

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

  // delete user by Id
  public async deleteUserById(
    userId: string,
    userInfo: IUserInfo,
  ): Promise<{ status: boolean; user: UsersEntity }> {
    const existingUser = await this.findUserById(userId, userInfo);

    await this.usersRepository.delete(userId);

    return {
      status: true,
      user: existingUser,
    };
  }
  
  // update user password
  public async updateUserPasswordById(
    userPasswordData: PasswordUserDto,
    userId: string,
  ): Promise<{ status: boolean; user: UsersEntity }> {
    const user = await this.findBy({ key: 'id', value: userId });

    if (!user) {
      throw new HttpException(
        `El usuario con el Id ${userId} no existe en el sistema`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      !userPasswordData.currentpwd ||
      !(await bcrypt.compare(userPasswordData.currentpwd, user.password))
    ) {
      throw new HttpException(
        'La contraseña antigua no coincide',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      !userPasswordData.newpwd ||
      (await bcrypt.compare(userPasswordData.newpwd, user.password))
    ) {
      throw new HttpException(
        'La nueva contraseña no puede coincidir con la antigua',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (userPasswordData.newpwd !== userPasswordData.confirmpwd) {
      throw new HttpException(
        'La nueva contraseña y la de confirmación no coinciden',
        HttpStatus.BAD_REQUEST,
      );
    }

    const saltRounds = Number(process.env.HASH_SALT) || 10;
    const hashedPassword = await bcrypt.hash(
      userPasswordData.newpwd,
      saltRounds,
    );

    await this.usersRepository.update(userId, { password: hashedPassword });

    return {
      status: true,
      user: { ...user },
    };
  }

  // **FUNCIONES**

  // Find user by key-value pair
  public async findBy({
    key,
    value,
  }: {
    key: keyof UserDto;
    value: any;
  }): Promise<UsersEntity | null> {
    return await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where(`user.${key} = :value`, { value })
      .andWhere('user.userStatus = :userStatus', { userStatus: true })
      .getOne();
  }

  public async createNewAclRule(user: UsersEntity): Promise<void> {
    const topics = [`/${user.username}/#`, `+/#`];

    const permissions: {
      action: ACL_ACTION;
      permission: ACL_PERMISSION;
    }[] = [
      {
        action: ACL_ACTION.ALL,
        permission: ACL_PERMISSION.ALLOW,
      },
      {
        action: ACL_ACTION.ALL,
        permission: ACL_PERMISSION.DENY,
      },
    ];

    const aclPromises = topics.map((topic, index) =>
      this.createAndSaveAcl(
        user.username,
        permissions[index].action,
        permissions[index].permission,
        topic,
        user.id,
      ),
    );

    await Promise.all(aclPromises);
  }

  private async createAndSaveAcl(
    username: string,
    action: ACL_ACTION,
    permission: ACL_PERMISSION,
    topic: string,
    createUserId: string,
  ): Promise<AclEntity> {
    const newAcl = this.aclRepository.create({
      username,
      action,
      permission,
      topic,
      qos: 0,
      retain: 0,
      createUserId: {
        id: createUserId,
      },
    });

    return this.aclRepository.save(newAcl);
  }
}
