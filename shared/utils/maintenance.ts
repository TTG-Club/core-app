import type {
  MaintenanceGate,
  MaintenanceSettingsUpdate,
  MaintenanceSiteSettings,
} from '../types/maintenance';

import { z } from 'zod';

import {
  MAINTENANCE_MESSAGE_MAX_LENGTH,
  MAINTENANCE_TITLE_MAX_LENGTH,
} from '../consts/maintenance';

/**
 * Схема настройки режима обновления одного сайта. Одна на обе стороны: сервер
 * проверяет ей запись из хранилища, клиент — ответ API админки.
 */
export const maintenanceSiteSettingsSchema: z.ZodType<MaintenanceSiteSettings> =
  z.object({
    enabled: z.boolean(),
    title: z.string(),
    message: z.string(),
    updatedAt: z.string().nullable(),
    updatedBy: z.string().nullable(),
  });

/** Схема тела запроса админки: пустые заголовок и текст не принимаются. */
export const maintenanceSettingsUpdateSchema: z.ZodType<MaintenanceSettingsUpdate> =
  z.object({
    enabled: z.boolean(),
    title: z.string().trim().min(1).max(MAINTENANCE_TITLE_MAX_LENGTH),
    message: z.string().trim().min(1).max(MAINTENANCE_MESSAGE_MAX_LENGTH),
  });

/**
 * Схема файла настройки: записи по сайтам. Записи других сайтов не
 * разбираются — их ведёт не этот сайт, и при сохранении они переносятся как
 * есть.
 */
export const maintenanceSettingsFileSchema = z.object({
  sites: z.record(z.string(), z.unknown()),
});

/** Схема решения о заглушке — для ответа API и контекста запроса. */
export const maintenanceGateSchema: z.ZodType<MaintenanceGate> = z.object({
  blocked: z.boolean(),
  signedIn: z.boolean(),
  title: z.string(),
  message: z.string(),
});
