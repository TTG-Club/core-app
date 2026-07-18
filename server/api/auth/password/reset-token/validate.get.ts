import { z } from 'zod';

import {
  createAuthValidationError,
  fetchAuthService,
} from '#server/utils/authService';

const validateQuerySchema = z.object({
  token: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const parsedQuery = validateQuerySchema.safeParse(getQuery(event));

  if (!parsedQuery.success) {
    throw createAuthValidationError();
  }

  await fetchAuthService<unknown>(
    '/api/account/password/reset-token/validate',
    {
      method: 'GET',
      query: { token: parsedQuery.data.token },
    },
  );

  return null;
});
