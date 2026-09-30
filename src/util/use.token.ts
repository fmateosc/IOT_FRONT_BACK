//src/util/use.token.ts

import * as jwt from 'jsonwebtoken';
import {
  IAuthTokenResult,
  IUseToken,
} from '../modules/auth/intefaces/auth.interface.js';

export const useToken = (token: string): IUseToken | string => {
  try {
    const decode = jwt.decode(token) as IAuthTokenResult;
    const currentDate = new Date();
    const expiredDate = new Date(decode.exp);

    return {
      userId: decode.userId,
      role: decode.role,
      isExpired: +expiredDate <= +currentDate / 1000,
    };
  } catch (error) {
    return 'Token inválido';
  }
};
