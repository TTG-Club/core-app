import { z } from 'zod';

import {
  createAuthValidationError,
  fetchAuthService,
} from '#server/utils/authService';

const passwordResetConfirmSchema = z.object({
  newPassword: z.string().min(8).max(100),
  token: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const parsedBody = passwordResetConfirmSchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!parsedBody.success) {
    throw createAuthValidationError();
  }

  await fetchAuthService<unknown>('/api/account/password/reset-confirm', {
    body: parsedBody.data,
    method: 'POST',
  });

  return null;
});
