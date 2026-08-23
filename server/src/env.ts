import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 4100),
  dbPath: process.env.DB_PATH ?? './data/notebox.db',
  uploadDir: process.env.UPLOAD_DIR ?? './data/uploads',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 100),
};
