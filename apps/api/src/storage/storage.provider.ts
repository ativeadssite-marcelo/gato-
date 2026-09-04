export interface StorageProvider {
  save(file: Express.Multer.File): Promise<{ url: string }>;
  delete(url: string): Promise<void>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
