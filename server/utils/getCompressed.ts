import type { S3UploadFile } from '#server/domain/s3';

/**
 * Сжимает загружаемый файл. Сжимаются только картинки: остальное уходит в
 * хранилище как есть.
 *
 * @param file Загружаемый файл.
 * @param maxSize Предельная сторона картинки, px.
 */
export function getCompressed(
  file: S3UploadFile,
  maxSize?: number,
): Promise<S3UploadFile> {
  if (file.type.startsWith('image/')) {
    return getCompressedImage(file, maxSize);
  }

  return Promise.resolve(file);
}
