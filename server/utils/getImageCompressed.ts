import type { OutputInfo, ResizeOptions } from 'sharp';
import sharp from 'sharp';
import bytes from 'bytes';
import { StatusCodes } from 'http-status-codes';
import { getErrorResponse } from '~~/shared/utils';

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

export interface CompressedImage {
  data: Buffer<ArrayBufferLike>;
  type: string;
}

export async function getImageCompressed(
  file: FileType,
  resize: ResizeOptions = {},
): Promise<CompressedImage> {
  const resizeOptions = getResizeOptions(resize);
  const converted = await convert(file, resizeOptions);

  return resolveImage(converted);
}

function convert(file: FileType, resizeOptions: ResizeOptions) {
  return sharp(file)
    .resize(resizeOptions)
    .webp()
    .toBuffer({ resolveWithObject: true });
}

function resolveImage(image: {
  data: Buffer<ArrayBufferLike>;
  info: OutputInfo;
}) {
  if (image.info.size > bytes('1MB')!) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message:
          'Сжатое изображение получается слишком большим — попробуй уменьшить его и загрузить снова. Максимальный размер изображения — 1МБ.',
      }),
    );
  }

  return {
    data: image.data,
    type: `image/${image.info.format}`,
  };
}

function getResizeOptions(options: ResizeOptions): ResizeOptions {
  return Object.assign<ResizeOptions, ResizeOptions>(
    {
      width: 2048,
      height: 2048,
      fit: 'outside',
      withoutEnlargement: true,
    },
    options,
  );
}
