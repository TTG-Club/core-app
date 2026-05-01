import { z } from 'zod';

const signInRequestSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const parsedBody = signInRequestSchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!parsedBody.success) {
    throw createAuthValidationError();
  }

  const tokenResponse = parseAuthTokenResponse(
    await fetchAuthService<unknown>('/api/auth/login', {
      body: parsedBody.data,
      method: 'POST',
    }),
  );

  setUserTokenCookie(event, tokenResponse);

  return tokenResponse;
});
