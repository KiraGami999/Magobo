import 'server-only';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface StoredObject {
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface StorageProvider {
  store(params: {
    namespace: string;
    originalFileName: string;
    mimeType: string;
    data: Buffer;
  }): Promise<StoredObject>;

  /** Returns a short-lived URL/path for authorized review — never expose the raw storage key to clients. */
  getSignedReadUrl(storageKey: string, ttlSeconds?: number): Promise<string>;

  delete(storageKey: string): Promise<void>;
}

/**
 * Development/mock implementation — writes files to `.storage/` on disk.
 * No real object-storage provider (S3, R2, etc.) is integrated yet. Swap
 * `storageProvider` below when one is wired up; KYC documents and profile
 * photos only ever persist a `storageKey` reference in PostgreSQL.
 */
class LocalFilesystemStorageProvider implements StorageProvider {
  private readonly root = path.join(process.cwd(), '.storage');

  private resolvePath(storageKey: string): string {
    const normalized = path.normalize(storageKey).replace(/^(\.\.[/\\])+/, '');
    const fullPath = path.join(this.root, normalized);
    if (!fullPath.startsWith(this.root)) {
      throw new Error('Invalid storage key.');
    }
    return fullPath;
  }

  async store(params: {
    namespace: string;
    originalFileName: string;
    mimeType: string;
    data: Buffer;
  }): Promise<StoredObject> {
    const safeName = params.originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = path.join(params.namespace, `${randomUUID()}-${safeName}`);
    const filePath = this.resolvePath(storageKey);

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, params.data);

    return {
      storageKey,
      originalFileName: params.originalFileName,
      mimeType: params.mimeType,
      fileSizeBytes: params.data.byteLength,
    };
  }

  async getSignedReadUrl(storageKey: string): Promise<string> {
    const filePath = this.resolvePath(storageKey);
    await readFile(filePath);
    // Mock "signed URL" — in production this would be a time-limited presigned
    // URL from S3/R2. For dev, admin routes serve via /api/admin/storage/[key].
    return `/api/admin/storage/${encodeURIComponent(storageKey)}`;
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = this.resolvePath(storageKey);
    await unlink(filePath).catch(() => undefined);
  }
}

export const storageProvider: StorageProvider = new LocalFilesystemStorageProvider();
