import { z } from 'zod';

import { createAuthValidationError } from '#server/utils/authService';

const lockUserParamsSchema = z.object({
  userId: z.string().uuid(),
});

const lockUserBodySchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

/**
 * Блокирует пользователя в auth-service: аккаунт переходит в статус BANNED,
 * все refresh-токены отзываются. Доступно только администратору.
 */
export default defineEventHandler(async (event) => {
  const parsedParams = lockUserParamsSchema.safeParse(getRouterParams(event));

  const parsedBody = lockUserBodySchema.safeParse(
    (await readBody<unknown>(event)) ?? {},
  );

  if (!parsedParams.success || !parsedBody.success) {
    throw createAuthValidationError();
  }

  return parseAuthAdminUserResponse(
    await fetchAuthAdminService<unknown>(
      event,
      `/api/admin/users/${parsedParams.data.userId}/lock`,
      {
        method: 'PATCH',
        body: {
          reason: parsedBody.data.reason || undefined,
        },
      },
    ),
  );
});
