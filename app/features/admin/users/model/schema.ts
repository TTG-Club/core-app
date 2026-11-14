import * as z from 'zod';

/** Из страницы списка пользователей плитке дашборда нужен только итог. */
const adminUsersTotalSchema = z.object({
  totalElements: z.number().int().nonnegative(),
});

/**
 * Достаёт из страницы списка пользователей их общее число.
 *
 * @param usersPageResponse Ответ ручки списка пользователей.
 * @returns Сколько всего пользователей зарегистрировано.
 */
export function parseAdminUsersTotal(usersPageResponse: unknown): number {
  return adminUsersTotalSchema.parse(usersPageResponse).totalElements;
}
