import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import {
  fetchAuthService,
  getFrontendOriginHeaders,
} from '#server/utils/authService';

const emailVerificationResendSchema = z.object({
  retryAfterSeconds: z.number().int().positive(),
});

export default defineEventHandler(async (event) => {
  const token = getTokenFromRequest(event);
  const headers = getFrontendOriginHeaders(event);

  headers.set('authorization', `Bearer ${token}`);

  const payload = await fetchAuthService<unknown>(
    '/api/auth/resend-verification',
    {
      headers,
      method: 'POST',
    },
  );

  const parsedPayload = emailVerificationResendSchema.safeParse(payload);

  if (!parsedPayload.success) {
    throw createError(getErrorResponse(StatusCodes.BAD_GATEWAY));
  }

  return parsedPayload.data;
});
