// src/modules/services/auth.services.ts

import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UsersEntity } from '../../users/entities/users.entity.js';
import { UsersService } from '../../users/services/users.service.js';
import * as bcrypt from 'bcrypt';
import { IUser } from '../../users/interfaces/user.interface.js';
import { AuthResponse, PayloadToken } from '../intefaces/auth.interface.js';
import jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  // validate username and password
  public async validateUser(
    username: string,
    password: string,
  ): Promise<UsersEntity | null> {
    const userByUsername = await this.usersService.findBy({
      key: 'username',
      value: username,
    });

    if (
      userByUsername &&
      (await bcrypt.compare(password, userByUsername.password))
    ) {
      return userByUsername;
    }
    return null;
  }

  // **FUNCIONES**
  public async generateJWT(user: IUser): Promise<AuthResponse> {
    const getUser = await this.usersService.findBy({
      key: 'id',
      value: user.id,
    });

    if (!getUser) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    const payload: PayloadToken = {
      access: getUser.userAccess,
      userId: getUser.id,
    };

    return {
      accessToken: this.singJWT({
        payload,
        secret:
          process.env.JWT_SECRET ||
          'qPZ3+Aln8cHpIt6ChDpjDx00rOfYxMw9S4Hl0gTa4F7x3UYqaabg3rEVpSSD5ioCcDeS6hdJTIwNxKmGSik6wg==',
        expires: '24h',
      }),
      user,
    };
  }

  private singJWT({
    payload,
    secret,
    expires,
  }: {
    payload: jwt.JwtPayload;
    secret: string;
    expires: number | string;
  }): string {
    return jwt.sign(payload, secret, {
      expiresIn: expires as jwt.SignOptions['expiresIn'],
    });
  }
}
