import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { fetchAuthService } from '#server/utils/authService';

const consentsBodySchema = z.object({
  offerAccepted: z.literal(true),
  offerVersion: z.string().min(1).max(32),
  personalDataConsent: z.literal(true),
  privacyPolicyVersion: z.string().min(1).max(32),
});

/**
 * Принимает оферту и согласие на обработку персональных данных для аккаунта,
 * созданного до галочек при регистрации (их просят отметить при первой оплате).
 */
export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event);
  const body = consentsBodySchema.safeParse(await readBody(event));

  if (!body.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }

  await fetchAuthService<unknown>('/api/auth/consents', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: body.data,
  });

  setResponseStatus(event, StatusCodes.NO_CONTENT);

  return null;
});
