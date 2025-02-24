import { S3 } from '@aws-sdk/client-s3';
import type { S3UploadFile, S3UploadResponse } from '~~/server/types/s3';
import ms from 'ms';
import { StatusCodes } from 'http-status-codes';
import { getErrorResponse } from '~~/shared/utils';

class S3Service {
  private s3: S3;

  private readonly endpoint: string;

  private readonly bucket: string;

  constructor() {
    const {
      s3: { endpoint, region, accessKeyId, secretAccessKey, bucket },
    } = useRuntimeConfig();

    this.endpoint = endpoint;
    this.bucket = bucket;

    this.s3 = new S3({
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
  }

  async upload(file: S3UploadFile | undefined): Promise<S3UploadResponse> {
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

    await this.s3.putObject({
      Bucket: this.bucket,
      Key: file.path,
      Body: file.data,
      ContentType: file.type,
      CacheControl:
        'public, must-revalidate, proxy-revalidate, max-age=31536000, s-maxage=31536000',
    });

    return {
      filename: file.name,
      url: `${this.endpoint}/${this.bucket}/${file.path}`,
    };
  }

  async delete(key: string) {
    if (!key) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message: 'Неизвестный ключ объекта',
        }),
      );
    }

    try {
      await this.s3.deleteObject({
        Key: key,
        Bucket: this.bucket,
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
}

export default new S3Service();
