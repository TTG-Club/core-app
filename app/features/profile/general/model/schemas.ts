import { z } from 'zod';

import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_MIN_LENGTH } from './consts';

export const displayNameSchema = z.object({
  displayName: z
    .string()
    .min(DISPLAY_NAME_MIN_LENGTH, `Минимум ${DISPLAY_NAME_MIN_LENGTH} символа`)
    .max(DISPLAY_NAME_MAX_LENGTH, `Максимум ${DISPLAY_NAME_MAX_LENGTH} символа`)
    .regex(
      /^[\w\p{L}\s-]+$/u,
      'Только буквы, цифры, пробелы, дефисы и подчёркивания',
    ),
});
