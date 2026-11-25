import type { ImageFrame } from '~/shared/types';

import { z } from 'zod';

/**
 * Кадр обложки из ответа API. Пределы здесь не проверяются: значения вне них
 * прижимает `normalizeImageFrame`, и запись из-за кривого кадра не теряется.
 */
export const imageFrameSchema: z.ZodType<ImageFrame> = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});
