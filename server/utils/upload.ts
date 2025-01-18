import type { S3UploadFile } from '~~/server/types/s3';
import { StatusCodes } from 'http-status-codes';
import { H3Error } from 'h3';
import type { ResizeOptions } from 'sharp';

const baseCheck = (file?: S3UploadFile) => {
  if (!file?.name || !file?.data) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Недопустимый формат файла',
      }),
    );
  }
};

export const uploadDefault = (file: S3UploadFile) => {
  baseCheck(file);

  try {
    return uploadToS3(file);
  } catch (err) {
    throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const uploadImage = async (image: S3UploadFile, maxSize?: number) => {
  baseCheck(image);

  let resizeOptions: ResizeOptions | undefined = undefined;

  if (maxSize) {
    resizeOptions = {
      width: maxSize,
      height: maxSize,
    };
  }

  try {
    const compressed = await getImageCompressed(image.data, resizeOptions);

    return uploadDefault({
      ...image,
      ...compressed,
    });
  } catch (err) {
    if (err instanceof H3Error) {
      throw err;
    }

    console.error(err);

    throw createError(
      getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR, {
        message:
          'Попробуй загрузить изображение еще раз или попробуй другое изображение, если ошибка повторяется.',
      }),
    );
  }
};
