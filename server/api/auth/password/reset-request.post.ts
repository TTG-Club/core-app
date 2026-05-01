import { z } from 'zod';

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
    method: 'POST',
  });

  return null;
});
