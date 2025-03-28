import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { S3 } from '@aws-sdk/client-s3';
import type { S3UploadFile, S3UploadResponse } from '~~/server/types/s3';
import ms from 'ms';
import { StatusCodes } from 'http-status-codes';

export const createS3Service = () => {
  const {
    s3: { endpoint, region, accessKeyId, secretAccessKey, bucket },
  } = useRuntimeConfig();

  const s3 = new S3({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    apiVersion: 'latest',
    requestHandler: {
      connectionTimeout: ms('5s'),
    },
  });

  function get(key: string | undefined): Promise<GetObjectCommandOutput> {
    if (!key) {
      throw new Error('Некорректный путь файла');
    }

    return s3.getObject({
      Bucket: bucket,
      Key: key,
      ResponseCacheControl:
        'public, must-revalidate, proxy-revalidate, max-age=31536000, s-maxage=31536000',
    });
  }

  async function upload(
    file: S3UploadFile | undefined,
  ): Promise<S3UploadResponse> {
    if (!file || !file.name || !file.data || !file.type || !file.path) {
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
      url: `/s3/${file.path}`,
    };
  }

  async function remove(key: string) {
    if (!key) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message: 'Неизвестный ключ объекта',
        }),
      );
    }

    try {
      await s3.deleteObject({
        Key: key,
        Bucket: bucket,
      });
    } catch (err) {
      console.error(err);

      throw createError(
        getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'Неизвестная ошибка',
        }),
      );
    }
  }

  return {
    get,
    upload,
    delete: remove,
  };
};

export const S3Service = createS3Service();
