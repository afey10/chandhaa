import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import multer from "multer";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err?.code === "23505" || err?.message?.includes("duplicate key value")) {
    return res.status(409).json({ error: "A record with this value already exists (duplicate registration number)." });
  }

  if (err?.message?.includes("Unsupported file type")) {
    return res.status(400).json({ error: err.message });
  }

  console.error(err);
  return res.status(err?.status || 500).json({ error: err?.message || "Something went wrong. Please try again." });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}
