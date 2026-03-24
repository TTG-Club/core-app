import { z } from 'zod';

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

export const emailSchema = z.object({
  email: z.string().email('Некорректный email адрес'),
});
