import type { S3ClientConfig } from '@aws-sdk/client-s3';
import { S3 } from '@aws-sdk/client-s3';
import type { MultiPartData } from 'h3';
import type { S3UploadFile, S3UploadResponse } from '~~/server/types/s3';
import { getSlug } from '#shared/utils/getSlug';
import ms from 'ms';
import { StatusCodes } from 'http-status-codes';

export const createS3Client = () => {
  const {
    s3: { url, region, accessKeyId, secretAccessKey },
  } = useRuntimeConfig();

  const params: S3ClientConfig = {
    region,
    endpoint: url,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    apiVersion: 'latest',
    requestHandler: {
      connectionTimeout: ms('5s'),
    },
  };

  return new S3(params);
};

export const getFileForUpload = (
  file: MultiPartData,
  username: string,
  path?: string,
): S3UploadFile => {
  if (!file.type) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Неизвестный тип данных',
      }),
    );
  }

  if (!file.filename) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Отсутствует имя файла',
      }),
    );
  }

  let fullPath = `${Date.now()}-${getSlug(file.filename)}`;

  const pathFormatted = path
    ?.replace(/^\/|\/$/, '')
    .split('/')
    .map((folder) => getSlug(folder).trim())
    .filter((folder) => !!folder)
    .join('/');

  if (pathFormatted?.length) {
    fullPath = `${pathFormatted}/${getSlug(username)}/${fullPath}`;
  }

  return {
    name: file.filename,
    data: file.data,
    path: fullPath,
    type: file.type,
  };
};

export const uploadToS3 = async (
  file: S3UploadFile | undefined,
): Promise<S3UploadResponse> => {
  if (!file) {
    throw new Error('Отсутствуют данные для загрузки');
  }

  if (getStringByteSize(file.path) > 1024) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message:
          'Слишком длинный путь файла. Попробуй сократить название файла',
      }),
    );
  }

  const {
    s3: { url, bucket },
  } = useRuntimeConfig();

  const s3 = createS3Client();

  await s3.putObject({
    Bucket: bucket,
    Key: file.path,
    Body: file.data,
    ContentType: file.type,
    CacheControl:
      'public, must-revalidate, proxy-revalidate, max-age=31536000, s-maxage=31536000',
  });

  return {
    filename: file.name,
    url: `${url}/${bucket}/${file.path}`,
  };
};
