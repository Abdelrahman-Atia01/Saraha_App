import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import ApiError from '../src/utils/ApiError.js';
const uploadDir = path.resolve('uploads');
fs.mkdirSync(uploadDir, { recursive: true });
export const multerFun = () => multer({
  storage: multer.diskStorage({ destination: (_req, _file, cb) => cb(null, uploadDir), filename: (_req, file, cb) => { const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }; cb(null, `${randomUUID()}${extensions[file.mimetype] || '.img'}`) } }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype) ? cb(null, true) : cb(new ApiError('IMAGE_INVALID')),
});
