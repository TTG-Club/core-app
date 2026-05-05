import { z } from 'zod';

import { getFrontendOriginHeaders } from '#server/utils/authService';

const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export default defineEventHandler(async (event) => {
  const parsedBody = passwordResetRequestSchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!parsedBody.success) {
    throw createAuthValidationError();
  }

  await fetchAuthService<unknown>('/api/account/password/reset-request', {
    body: parsedBody.data,
    headers: getFrontendOriginHeaders(event),
    method: 'POST',
  });

  return null;
});
