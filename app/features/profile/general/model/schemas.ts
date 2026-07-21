import { z } from 'zod';

export const displayNameSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Минимум 2 символа')
    .max(24, 'Максимум 24 символа')
    .regex(
      /^[\w\p{L}\s-]+$/u,
      'Только буквы, цифры, пробелы, дефисы и подчёркивания',
    ),
});
