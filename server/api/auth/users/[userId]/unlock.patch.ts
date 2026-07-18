import { z } from 'zod';

import { createAuthValidationError } from '#server/utils/authService';

const unlockUserParamsSchema = z.object({
  userId: z.string().uuid(),
});

/**
 * Снимает блокировку с пользователя в auth-service (BANNED → ACTIVE).
 * Доступно только администратору.
 */
export default defineEventHandler(async (event) => {
  const parsedParams = unlockUserParamsSchema.safeParse(getRouterParams(event));

  if (!parsedParams.success) {
    throw createAuthValidationError();
  }

  return parseAuthAdminUserResponse(
    await fetchAuthAdminService<unknown>(
      event,
      `/api/admin/users/${parsedParams.data.userId}/unlock`,
      { method: 'PATCH' },
    ),
  );
});
