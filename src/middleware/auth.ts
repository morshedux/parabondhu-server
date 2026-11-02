import { NextFunction, Request, Response } from "express";
import type { createRemoteJWKSet } from "jose";

export interface AuthUser {
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

// jose is ESM only, so this CommonJS build loads it with a dynamic import.
async function verifyJwt(token: string) {
  const { createRemoteJWKSet, jwtVerify } = await import("jose");
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL("/api/auth/jwks", process.env.CLIENT_URL));
  }
  return jwtVerify(token, jwks, { issuer: process.env.CLIENT_URL });
}

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Log in to continue." });
    return;
  }

  try {
    const { payload } = await verifyJwt(header.slice(7));
    if (typeof payload.email !== "string") throw new Error("Token has no email");

    req.user = {
      email: payload.email.toLowerCase(),
      name: typeof payload.name === "string" ? payload.name : payload.email,
    };
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired. Log in again." });
  }
}
