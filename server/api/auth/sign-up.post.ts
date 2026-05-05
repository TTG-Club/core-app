import { z } from 'zod';

import { getFrontendOriginHeaders } from '../../utils/authService';

const signUpRequestSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(100),
  username: z.string().min(3).max(100),
});

export default defineEventHandler(async (event) => {
  const parsedBody = signUpRequestSchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!parsedBody.success) {
    throw createAuthValidationError();
  }

  return await fetchAuthService<unknown>('/api/auth/register', {
    body: parsedBody.data,
    headers: getFrontendOriginHeaders(event),
    method: 'POST',
  });
});
