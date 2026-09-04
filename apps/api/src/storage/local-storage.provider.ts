import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { StorageProvider } from './storage.provider';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly dir = join(process.cwd(), 'uploads');

  async save(file: Express.Multer.File): Promise<{ url: string }> {
    const filename = `${randomUUID()}${extname(file.originalname || '')}`;
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, filename), file.buffer);
    return { url: `/uploads/${filename}` };
  }

  async delete(url: string): Promise<void> {
    if (!url.startsWith('/uploads/')) return;
    const name = url.replace('/uploads/', '');
    await unlink(join(this.dir, name)).catch(() => undefined);
  }
}
