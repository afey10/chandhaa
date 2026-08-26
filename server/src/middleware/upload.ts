import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_MB = parseInt(process.env.MAX_UPLOAD_MB || "5", 10);

const PHOTO_TYPES = [".jpg", ".jpeg", ".png", ".webp"];
const DOC_TYPES = [".pdf", ".jpg", ".jpeg", ".png"];
const PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"];
const DOC_MIME = ["application/pdf", "image/jpeg", "image/png"];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeStorage(subdir: string) {
  const dest = path.join(UPLOAD_DIR, subdir);
  ensureDir(dest);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuid()}${ext}`);
    },
  });
}

function fileFilterFactory(allowedExt: string[], allowedMime: string[]) {
  return (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext) || !allowedMime.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type. Only images (and PDF for documents) are allowed."));
    }
    cb(null, true);
  };
}

export const uploadPhoto = multer({
  storage: makeStorage("photos"),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: fileFilterFactory(PHOTO_TYPES, PHOTO_MIME),
});

export const uploadDocument = multer({
  storage: makeStorage("documents"),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: fileFilterFactory(DOC_TYPES, DOC_MIME),
});

export const uploadProfilePicture = multer({
  storage: makeStorage("profiles"),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: fileFilterFactory(PHOTO_TYPES, PHOTO_MIME),
});
