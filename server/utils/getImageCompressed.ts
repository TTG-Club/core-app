import type { ResizeOptions } from 'sharp';
import sharp from 'sharp';
import bytes from 'bytes';
import { StatusCodes } from 'http-status-codes';
import { getErrorResponse } from '~~/shared/utils';

export const getImageCompressed = async (
  file:
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
    | string,
  resize: ResizeOptions = {},
) => {
  const resizeOptions = Object.assign<ResizeOptions, ResizeOptions>(
    {
      width: 2048,
      height: 2048,
      fit: 'outside',
      withoutEnlargement: true,
    },
    resize,
  );

  const { data, info } = await sharp(file)
    .webp()
    .resize(resizeOptions)
    .toBuffer({ resolveWithObject: true });

  if (info.size > bytes('1MB')!) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message:
          'Сжатое изображение получается слишком большим — попробуй уменьшить его и загрузить снова. Максимальный размер изображения — 1МБ.',
      }),
    );
  }

  return {
    type: `image/${info.format}`,
    data,
  };
};
