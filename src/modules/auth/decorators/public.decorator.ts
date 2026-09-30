// src/modules/auth/decorators/public.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { PUBLIC_KEY } from '../../../constants/index.js';

export const PublicAccess = () => SetMetadata(PUBLIC_KEY, true);
