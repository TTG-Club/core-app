import path from 'node:path';

import bytes from 'bytes';
import { StatusCodes } from 'http-status-codes';
import mime from 'mime';
import sharp from 'sharp';

import type { OutputInfo, ResizeOptions } from 'sharp';
import type { S3UploadFile } from '~~/server/types/s3';

type FileType =
  | Buffer
  | ArrayBuffer
  | Uint8Array
  | Uint8ClampedArray
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array
  | string;

const maxFileSize = bytes('1MB')!;

export async function getCompressedImage(
  file: S3UploadFile,
  maxSize?: number,
): Promise<S3UploadFile> {
  const resizeOptions = getResizeOptions(maxSize);
  const { data, info } = await getResized(file.data, resizeOptions);

  if (info.size > maxFileSize) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message:
          'Сжатое изображение получается слишком большим — попробуй уменьшить его и загрузить снова. Максимальный размер изображения — 1МБ.',
      }),
    );
  }

  return convert(file, data, info);
}

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

function getResized(file: FileType, resizeOptions: ResizeOptions) {
  return sharp(file)
    .resize(resizeOptions)
    .webp()
    .toBuffer({ resolveWithObject: true });
}

function getResizeOptions(options?: ResizeOptions | number): ResizeOptions {
  let resizeOptions = options || {};

  if (typeof resizeOptions === 'number') {
    resizeOptions = {
      width: resizeOptions,
      height: resizeOptions,
    };
  }

  return Object.assign<ResizeOptions, ResizeOptions | undefined>(
    {
      width: 2048,
      height: 2048,
      fit: 'outside',
      withoutEnlargement: true,
    },
    resizeOptions,
  );
}

function replaceImageExtension(pathOrName: string, type: string) {
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
