import { z } from 'zod';

import {
  createAuthValidationError,
  fetchAuthService,
} from '#server/utils/authService';

const passwordChangeRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export default defineEventHandler(async (event) => {
  const parsedBody = passwordChangeRequestSchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!parsedBody.success) {
    throw createAuthValidationError();
  }

  const token = getTokenFromRequest(event);

  await fetchAuthService<unknown>('/api/account/change-password', {
    body: parsedBody.data,
    headers: {
      authorization: `Bearer ${token}`,
    },
    method: 'POST',
  });

  return null;
});
