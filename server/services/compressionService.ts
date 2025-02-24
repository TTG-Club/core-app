import type { OutputInfo, ResizeOptions } from 'sharp';
import sharp from 'sharp';
import bytes from 'bytes';
import { getErrorResponse } from '#shared/utils';
import { StatusCodes } from 'http-status-codes';
import mime from 'mime';
import path from 'node:path';
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

class CompressionService {
  maxFileSize = bytes('1MB')!;

  async compress(file: S3UploadFile, maxSize?: number): Promise<S3UploadFile> {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    const resizeOptions = this.getResizeOptions(maxSize);
    const { data, info } = await this.getResized(file.data, resizeOptions);

    if (info.size > this.maxFileSize) {
      throw createError(
        getErrorResponse(StatusCodes.BAD_REQUEST, {
          message:
            'Сжатое изображение получается слишком большим — попробуй уменьшить его и загрузить снова. Максимальный размер изображения — 1МБ.',
        }),
      );
    }

    return this.convert(file, data, info);
  }

  private convert = (
    file: S3UploadFile,
    data: Buffer,
    info: OutputInfo,
  ): S3UploadFile => {
    const type = `image/${info.format}`;

    return {
      type,
      data,
      name: this.replaceImageExtension(file.name, type),
      path: this.replaceImageExtension(file.path, type),
    };
  };

  private getResized = (file: FileType, resizeOptions: ResizeOptions) =>
    sharp(file)
      .resize(resizeOptions)
      .webp()
      .toBuffer({ resolveWithObject: true });

  private getResizeOptions = (
    options?: ResizeOptions | number,
  ): ResizeOptions => {
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
  };

  private replaceImageExtension = (pathOrName: string, type: string) => {
    const ext = mime.getExtension(type);

    if (!ext) {
      throw createError(getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR));
    }

    return path.format({
      ...path.parse(pathOrName),
      base: '',
      ext: `.${mime.getExtension(type)}`,
    });
  };
}

export default new CompressionService();
