import { Request, Response, NextFunction } from "express";

// Simple sliding-window rate limiter for the login endpoint (no external deps).
// Limits each IP to 10 attempts per 5 minutes.
const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 10;
const hits = new Map<string, number[]>();

export default function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || "unknown";
  const now = Date.now();
  const timestamps = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(key, timestamps);

  if (timestamps.length > MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many login attempts. Please wait a few minutes and try again." });
  }
  next();
}
