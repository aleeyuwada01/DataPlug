import { Request, Response, NextFunction } from "express";

/** Ensures the user is logged in. Returns 401 if not. */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Not authenticated" });
}

/** Ensures the user is an admin. Returns 403 if not. */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as any)?.isAdmin) return next();
  res.status(403).json({ error: "Admin access required" });
}
