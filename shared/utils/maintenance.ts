import type {
  MaintenanceGate,
  MaintenanceSettingsUpdate,
  MaintenanceSiteId,
  MaintenanceSiteSettings,
} from '../types/maintenance';

import { z } from 'zod';

import {
  MAINTENANCE_ALLOWED_ROLES_MAX_COUNT,
  MAINTENANCE_MESSAGE_MAX_LENGTH,
  MAINTENANCE_ROLE_MAX_LENGTH,
  MAINTENANCE_ROLE_PATTERN,
  MAINTENANCE_SITE_IDS,
  MAINTENANCE_TITLE_MAX_LENGTH,
} from '../consts/maintenance';

/** Схема сайта с режимом обновления — для параметров роутов. */
export const maintenanceSiteIdSchema: z.ZodType<MaintenanceSiteId> =
  z.enum(MAINTENANCE_SITE_IDS);

/** Схема параметра `siteId` роутов: в query админки и в пути публичного. */
export const maintenanceSiteParamsSchema = z.object({
  siteId: maintenanceSiteIdSchema,
});

/**
 * Схема настройки режима обновления одного сайта. Одна на обе стороны: сервер
 * проверяет ей запись из хранилища, клиент — ответ API админки.
 */
export const maintenanceSiteSettingsSchema: z.ZodType<MaintenanceSiteSettings> =
  z.object({
    enabled: z.boolean(),
    // Записи, сохранённые до появления поля, пускают только администраторов.
    allowedRoles: z.array(z.string()).default([]),
    title: z.string(),
    message: z.string(),
    updatedAt: z.string().nullable(),
    updatedBy: z.string().nullable(),
  });

/** Схема тела запроса админки: пустые заголовок и текст не принимаются. */
export const maintenanceSettingsUpdateSchema: z.ZodType<MaintenanceSettingsUpdate> =
  z.object({
    enabled: z.boolean(),
    allowedRoles: z
      .array(
        z
          .string()
          .max(MAINTENANCE_ROLE_MAX_LENGTH)
          .regex(MAINTENANCE_ROLE_PATTERN),
      )
      .max(MAINTENANCE_ALLOWED_ROLES_MAX_COUNT)
      .transform((roles) => [...new Set(roles)]),
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
