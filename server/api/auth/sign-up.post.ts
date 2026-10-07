import { z } from 'zod';

import {
  createAuthValidationError,
  fetchAuthService,
  getFrontendOriginHeaders,
} from '#server/utils/authService';

const signUpRequestSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(100),
  username: z.string().min(3).max(100),
  // Без обоих согласий регистрация не проходит. Редакции документов уходят в
  // auth-service вместе с согласиями и сохраняются в базе.
  offerAccepted: z.literal(true),
  offerVersion: z.string().trim().min(1).max(32),
  personalDataConsent: z.literal(true),
  privacyPolicyVersion: z.string().trim().min(1).max(32),
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
