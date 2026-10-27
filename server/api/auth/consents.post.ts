import { StatusCodes } from 'http-status-codes';

import {
  authConsentsSchema,
  createAuthValidationError,
  fetchAuthService,
} from '#server/utils/authService';

/**
 * Принимает оферту и согласие на обработку персональных данных для аккаунта,
 * созданного до галочек при регистрации (их просят отметить при первой оплате).
 */
export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event);

  const parsedBody = authConsentsSchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!parsedBody.success) {
    throw createAuthValidationError();
  }

  await fetchAuthService<unknown>('/api/auth/consents', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: parsedBody.data,
  });

  setResponseStatus(event, StatusCodes.NO_CONTENT);

  return null;
});
