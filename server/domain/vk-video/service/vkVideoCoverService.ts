import type { z } from 'zod';

import type { S3UploadFile, S3UploadResponse } from '#server/domain/s3';
import type { VkVideoId } from '#shared/types';

import type { VkVideoImage } from '../model';

import { getFileKey, S3Service } from '#server/domain/s3';

import {
  VK_API_AUTH_ERROR_CODE,
  VK_API_BASE_URL,
  VK_API_VERSION,
  VK_COVER_FALLBACK_TYPE,
  VK_COVER_MAX_BYTES,
  VK_REQUEST_TIMEOUT_MS,
  vkVideoGetResponseSchema,
} from '../model';
import { getVkAccessToken } from './vkIdSessionService';

/** Редактор не подключил свой ВК — кадр брать нечем. */
export class VkVideoNotConnectedError extends Error {
  constructor() {
    super('VK is not connected');
    this.name = 'VkVideoNotConnectedError';
  }
}

/** У ролика нет кадра: удалён, закрыт или недоступен аккаунту редактора. */
export class VkVideoNoCoverError extends Error {
  constructor(reason?: string) {
    super(reason ?? 'VK video has no cover');
    this.name = 'VkVideoNoCoverError';
  }
}

/** Проверенный ответ `video.get`. */
type VkVideoGetResponse = z.infer<typeof vkVideoGetResponseSchema>;

/**
 * Самый крупный кадр: обложку дальше сожмёт общий компрессор загрузок.
 *
 * @param images кадры ролика из `video.get`
 * @returns адрес кадра или `null`, если кадров нет
 */
function pickLargest(images: VkVideoImage[]): string | null {
  return [...images].sort((a, b) => b.width - a.width)[0]?.url ?? null;
}

/**
 * Запрос `video.get` для одного ролика.
 *
 * @param video ролик
 * @param video.ownerId владелец ролика
 * @param video.videoId id ролика
 * @param video.hash ключ доступа закрытого ролика
 * @param accessToken ключ VK API редактора
 * @returns проверенный ответ VK API
 */
async function requestVideo(
  { ownerId, videoId, hash }: VkVideoId,
  accessToken: string,
): Promise<VkVideoGetResponse> {
  const videos = [ownerId, videoId, hash].filter(Boolean).join('_');

  const responseBody = await $fetch<unknown>(`${VK_API_BASE_URL}/video.get`, {
    // eslint-disable-next-line camelcase -- имя параметра задаёт VK API
    query: { videos, access_token: accessToken, v: VK_API_VERSION },
    timeout: VK_REQUEST_TIMEOUT_MS,
  });

  return vkVideoGetResponseSchema.parse(responseBody);
}

/**
 * Адрес кадра ролика у ВК — от имени редактора. Ключ, который VK API отверг,
 * продлевается, и запрос повторяется один раз.
 *
 * @param username редактор
 * @param video ролик
 * @returns адрес кадра у ВК
 */
async function getVkVideoImageUrl(
  username: string,
  video: VkVideoId,
): Promise<string> {
  let accessToken = await getVkAccessToken(username);

  if (!accessToken) {
    throw new VkVideoNotConnectedError();
  }

  let videoResponse = await requestVideo(video, accessToken);

  if (videoResponse.error?.error_code === VK_API_AUTH_ERROR_CODE) {
    accessToken = await getVkAccessToken(username, true);

    if (!accessToken) {
      throw new VkVideoNotConnectedError();
    }

    videoResponse = await requestVideo(video, accessToken);
  }

  if (videoResponse.error) {
    throw new VkVideoNoCoverError(
      `${videoResponse.error.error_code} ${videoResponse.error.error_msg}`,
    );
  }

  const imageUrl = pickLargest(videoResponse.response?.items[0]?.image ?? []);

  if (!imageUrl) {
    throw new VkVideoNoCoverError();
  }

  return imageUrl;
}

/**
 * Кладёт кадр ролика ВК обложкой записи: берёт его у ВК ключом редактора и
 * загружает в хранилище, как обычную загруженную обложку. Дальше сайт
 * показывает свою копию, и ключи ВК при просмотре не нужны.
 *
 * @param username редактор
 * @param video ролик
 * @param section раздел загрузок (как у формы обложки)
 * @param maxSize предел размера картинки для компрессора
 * @returns загруженная обложка
 */
export async function uploadVkVideoCover(
  username: string,
  video: VkVideoId,
  section: string,
  maxSize: number | undefined,
): Promise<S3UploadResponse> {
  const imageUrl = await getVkVideoImageUrl(username, video);

  const imageResponse = await $fetch.raw<ArrayBuffer>(imageUrl, {
    responseType: 'arrayBuffer',
    timeout: VK_REQUEST_TIMEOUT_MS,
  });

  const imageData = Buffer.from(imageResponse._data ?? new ArrayBuffer(0));

  if (!imageData.byteLength || imageData.byteLength > VK_COVER_MAX_BYTES) {
    throw new VkVideoNoCoverError('cover download failed');
  }

  const type =
    imageResponse.headers.get('content-type')?.split(';')[0]?.trim()
    || VK_COVER_FALLBACK_TYPE;

  const name = `vk-video${video.ownerId}_${video.videoId}.jpg`;

  const file: S3UploadFile = {
    name,
    path: getFileKey(section, username, name),
    type,
    data: imageData,
  };

  return S3Service.upload(await getCompressed(file, maxSize));
}
