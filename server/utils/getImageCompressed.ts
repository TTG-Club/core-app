import type { ResizeOptions } from 'sharp';
import sharp from 'sharp';
import bytes from 'bytes';
import type { S3UploadFile } from '~~/server/types/s3';
import { StatusCodes } from 'http-status-codes';

const getNewExtension = (string: string) => string.replace(/\..+$/g, `.webp`);

export const getImageCompressed = async (
  file: S3UploadFile,
  resize: ResizeOptions = {},
): Promise<S3UploadFile> => {
  if (!file.type?.startsWith('image/')) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Недопустимый тип данных',
      }),
    );
  }

  const resizeOptions = Object.assign<ResizeOptions, ResizeOptions>(
    {
      width: 2048,
      height: 2048,
      fit: 'outside',
      withoutEnlargement: true,
    },
    resize,
  );

  const { data, info } = await sharp(file.data)
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
    name: getNewExtension(file.name),
    path: getNewExtension(file.path),
    type: `image/${info.format}`,
    data,
  };
};
