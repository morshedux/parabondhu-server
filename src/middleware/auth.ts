import { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

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

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL("/api/auth/jwks", process.env.CLIENT_URL));
  }
  return jwks;
}

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Log in to continue." });
    return;
  }

  try {
    const { payload } = await jwtVerify(header.slice(7), getJwks(), {
      issuer: process.env.CLIENT_URL,
    });
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
