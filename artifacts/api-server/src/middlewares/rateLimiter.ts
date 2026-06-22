/**
 * Rate Limiting Middleware
 *
 * Three tiers:
 *   globalLimiter   — 300 req/min per IP, applied to all /api routes
 *   writeLimiter    — 60 req/min per IP, applied to POST/PUT/PATCH/DELETE routes
 *   authLimiter     — 20 req/min per IP, applied to auth-sensitive endpoints
 */

import rateLimit from "express-rate-limit";

function jsonHandler(res: any, statusCode: number, message: string) {
  res.status(statusCode).json({ error: message });
}

/** 300 requests / minute — general read traffic */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => jsonHandler(res, 429, "Too many requests. Please slow down."),
});

/** 60 requests / minute — write operations (votes, reactions, discussions) */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => jsonHandler(res, 429, "Too many write requests. Please wait before trying again."),
});

/** 20 requests / minute — auth-sensitive endpoints */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => jsonHandler(res, 429, "Too many authentication attempts. Please wait before trying again."),
});
