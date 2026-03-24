import { z } from 'zod';

export const displayNameSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Минимум 2 символа')
    .max(50, 'Максимум 50 символов')
    .regex(
      /^[\w\p{L}\s-]+$/u,
      'Только буквы, цифры, пробелы, дефисы и подчёркивания',
    ),
});
