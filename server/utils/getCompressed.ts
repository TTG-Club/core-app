import type { S3UploadFile } from '~~/server/types/s3';

export function getCompressed(
  file: S3UploadFile,
  maxSize?: number,
): Promise<S3UploadFile> {
  if (file.type.startsWith('image/')) {
    return getCompressedImage(file, maxSize);
  }

  return Promise.resolve(file);
}
