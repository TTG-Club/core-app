import type { OutputInfo } from 'sharp';

import type { S3UploadFile } from '#server/domain/s3';

import path from 'node:path';

import bytes from 'bytes';
import { StatusCodes } from 'http-status-codes';
import mime from 'mime';
import sharp from 'sharp';

/** Предельный вес сжатой картинки, МБ. */
const MAX_FILE_MEGABYTES = 2;

/** Предельный вес сжатой картинки, байт. */
const MAX_FILE_SIZE = bytes(`${MAX_FILE_MEGABYTES}MB`)!;

/** Предельная короткая сторона, если вызывающий не задал свою, px. */
const DEFAULT_MAX_SHORT_SIDE = 2048;

/**
 * Предельная длинная сторона, px. С запасом: широкий фон шапки главной
 * (3840×1080) должен пройти без уменьшения, а огромный снимок — ужаться.
 */
const MAX_LONG_SIDE = 4096;

/**
 * Сжимает картинку в WebP. Слишком большую уменьшает с сохранением пропорций:
 * короткая сторона — не больше `maxSize` (по умолчанию 2048 px), длинная — не
 * больше `MAX_LONG_SIDE`.
 *
 * @param file Загружаемая картинка.
 * @param maxSize Предельная короткая сторона, px.
 */
export async function getCompressedImage(
  file: S3UploadFile,
  maxSize?: number,
): Promise<S3UploadFile> {
  const { data, info } = await getResized(file.data, maxSize);

  if (info.size > MAX_FILE_SIZE) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: `Сжатое изображение получается слишком большим — попробуй уменьшить его и загрузить снова. Максимальный размер изображения — ${MAX_FILE_MEGABYTES} МБ.`,
      }),
    );
  }

  return convert(file, data, info);
}

/**
 * Файл загрузки со сжатым содержимым: тип и расширение — по итоговому формату.
 *
 * @param file Исходный файл загрузки.
 * @param data Сжатое содержимое.
 * @param info Сведения sharp о сжатой картинке.
 */
function convert(
  file: S3UploadFile,
  data: Buffer,
  info: OutputInfo,
): S3UploadFile {
  const type = `image/${info.format}`;

  return {
    type,
    data,
    name: replaceImageExtension(file.name, type),
    path: replaceImageExtension(file.path, type),
  };
}

/**
 * Длинная сторона после уменьшения; undefined — уменьшать не нужно.
 *
 * @param width Ширина исходника.
 * @param height Высота исходника.
 * @param maxSize Предельная короткая сторона.
 */
function getTargetLongSide(
  width: number,
  height: number,
  maxSize?: number,
): number | undefined {
  const longSide = Math.max(width, height);
  const shortSide = Math.min(width, height);

  const scale = Math.min(
    1,
    MAX_LONG_SIDE / longSide,
    (maxSize || DEFAULT_MAX_SHORT_SIDE) / shortSide,
  );

  return scale < 1 ? Math.max(1, Math.round(longSide * scale)) : undefined;
}

/**
 * Разворачивает картинку по EXIF, при необходимости уменьшает и переводит в
 * WebP.
 *
 * @param file Содержимое исходной картинки.
 * @param maxSize Предельная короткая сторона, px.
 */
async function getResized(
  file: S3UploadFile['data'],
  maxSize?: number,
): Promise<{ data: Buffer; info: OutputInfo }> {
  // rotate() без аргументов разворачивает по EXIF: WebP метаданные не
  // сохраняет, и снимок с телефона иначе лёг бы набок.
  const image = sharp(file).rotate();
  const { width, height } = await image.metadata();

  const targetLongSide =
    width && height ? getTargetLongSide(width, height, maxSize) : undefined;

  // Квадратная рамка с fit: 'inside' ограничивает длинную сторону при любом
  // повороте и сохраняет пропорции.
  const resized = targetLongSide
    ? image.resize({
        width: targetLongSide,
        height: targetLongSide,
        fit: 'inside',
        withoutEnlargement: true,
      })
    : image;

  return resized.webp().toBuffer({ resolveWithObject: true });
}

/**
 * Путь или имя файла с расширением, подходящим типу картинки.
 *
 * @param pathOrName Исходный путь или имя.
 * @param type MIME-тип итоговой картинки.
 */
function replaceImageExtension(pathOrName: string, type: string): string {
  const ext = mime.getExtension(type);

  if (!ext) {
    throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
  }

  const newPath = path.format({
    ...path.parse(pathOrName),
    base: '',
    ext: `.${mime.getExtension(type)}`,
  });

  return newPath.replaceAll('\\', '/');
}
