import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "dataplug-jwt-secret-change-me";

/** Middleware that checks for JWT Bearer token and attaches user to req */
async function attachJwtUser(req: Request, _res: Response, next: NextFunction) {
  // If already authenticated via session, skip JWT check
  if (req.isAuthenticated && req.isAuthenticated()) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (user) {
      const { passwordHash, pinHash, ...safeUser } = user;
      (req as any).user = safeUser;
      (req as any)._jwtAuthenticated = true;
    }
  } catch (err) {
    // Invalid token, continue without auth
  }

  next();
}

/** Check if user is authenticated via session OR JWT */
function isUserAuthenticated(req: Request): boolean {
  if (req.isAuthenticated && req.isAuthenticated()) return true;
  if ((req as any)._jwtAuthenticated) return true;
  return false;
}

/** Ensures the user is logged in. Returns 401 if not. */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (isUserAuthenticated(req)) return next();
  res.status(401).json({ error: "Not authenticated" });
}

/** Ensures the user is an admin. Returns 403 if not. */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (isUserAuthenticated(req) && (req.user as any)?.isAdmin) return next();
  res.status(403).json({ error: "Admin access required" });
}

/** Helper to generate a JWT token for a user */
export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export { attachJwtUser };
