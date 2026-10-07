import { z } from 'zod';

import { S3_URL_PREFIX } from '../consts/upload';

/**
 * Ссылка на аватарку из core-api. Одна схема на обе стороны: сервер разбирает
 * ей свой профиль и список пользователей админки, клиент — имена и аватарки по
 * идентификаторам. Принимается только ссылка на хранилище сайта: сторонний
 * адрес означал бы картинку с чужого сервера. Отсутствие поля и неподходящая
 * ссылка — это «аватарки нет».
 */
export const avatarUrlSchema = z
  .string()
  .startsWith(S3_URL_PREFIX)
  .nullish()
  .catch(null)
  .transform((avatarUrl) => avatarUrl ?? null);
