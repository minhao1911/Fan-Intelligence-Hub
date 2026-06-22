import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).replitUser;
  if (!user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).replitUserId = String(user.id);
  next();
}
