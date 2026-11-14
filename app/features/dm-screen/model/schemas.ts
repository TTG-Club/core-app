import * as z from 'zod';

/**
 * Окно ширмы: запись сайта или заметка, её место, размер, слой и
 * свёрнутость. В таком виде окна лежат и в браузере, и на сервере.
 */
export const screenWindowSchema = z.object({
  id: z.string().min(1),
  /** Адрес записи на сайте либо путь заметки (`note:…`). */
  path: z.string().min(1),
  title: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  /** Чем больше, тем выше окно среди остальных. */
  layer: z.number().int(),
  isMinimized: z.boolean(),
  /** Текст заметки в хранимой разметке; у записей сайта его нет. */
  content: z.string().nullish(),
});

export type ScreenWindow = z.infer<typeof screenWindowSchema>;

export const screenWindowListSchema = z.array(screenWindowSchema);

/** Ширма пользователя с сервера. */
export const screenStateSchema = z.object({
  windows: screenWindowListSchema,
  updatedAt: z.string().nullish(),
});

export type ScreenState = z.infer<typeof screenStateSchema>;

/** Из загруженной записи окну нужно только название. */
export const screenEntryNameSchema = z.object({
  name: z.union([z.string(), z.object({ rus: z.string() })]),
});

/** Ответ поиска по сайту: из записи нужны адрес, раздел и название. */
export const screenSearchResponseSchema = z.object({
  items: z.array(
    z.object({
      url: z.string(),
      type: z.string(),
      name: z.object({ rus: z.string(), eng: z.string().nullish() }),
    }),
  ),
});

export type ScreenSearchResponse = z.infer<typeof screenSearchResponseSchema>;

/** Где показывать панель раскладок, пока окно тащат: сверху, снизу, нигде. */
export const screenPickerPlacementSchema = z.enum(['top', 'bottom', 'hidden']);

export type ScreenPickerPlacement = z.infer<typeof screenPickerPlacementSchema>;
