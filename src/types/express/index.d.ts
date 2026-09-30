// src/types/express/index.d.ts

declare namespace Express {
  interface Request {
    userId: string;
    userAccess: string;
  }
}
