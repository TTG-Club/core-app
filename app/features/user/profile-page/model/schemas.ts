import { z } from 'zod';

/**
 * Схема валидации для смены пароля
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z
      .string()
      .min(8, 'Минимум 8 символов')
      .regex(/[A-Z]/, 'Должна быть хотя бы одна заглавная буква')
      .regex(/[a-z]/, 'Должна быть хотя бы одна строчная буква')
      .regex(/\d/, 'Должна быть хотя бы одна цифра'),
    confirmPassword: z.string().min(1, 'Подтвердите новый пароль'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Новый пароль должен отличаться от текущего',
    path: ['newPassword'],
  });

/**
 * Схема валидации для отображаемого имени
 */
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

/**
 * Схема валидации для email
 */
export const emailSchema = z.object({
  email: z.string().email('Некорректный email адрес'),
});
