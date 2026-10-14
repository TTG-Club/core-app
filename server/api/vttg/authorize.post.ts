import { StatusCodes } from 'http-status-codes';

import {
  vttgAuthorizeBodySchema,
  vttgIdentityTicketSchema,
} from '#server/domain/vttg';
import { fetchAuthService } from '#server/utils/authService';

/**
 * Справка о личности для мира VTTG.
 *
 * Мир работает на машине мастера, и отдавать ему токен пользователя нельзя: с
 * токеном можно действовать от имени человека на всём сайте. Вместо токена мир
 * получает справку от auth-service — в ней только id и ник, она живёт минуту и
 * годится лишь для адреса, который в неё вписан.
 *
 * Роут вызывается только по кнопке «Разрешить» на странице согласия: согласие
 * человека — единственное, что отделяет мир от его ника.
 */
export default defineEventHandler(
  async (event): Promise<{ ticket: string }> => {
    await getUserFromToken(event);

    const parsedBody = vttgAuthorizeBodySchema.safeParse(
      await readBody<unknown>(event),
    );

    if (!parsedBody.success) {
      throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
    }

    const issued = vttgIdentityTicketSchema.safeParse(
      await fetchAuthService<unknown>('/api/auth/identity-ticket', {
        body: parsedBody.data,
        headers: {
          authorization: `Bearer ${getTokenFromRequest(event)}`,
        },
        method: 'POST',
      }),
    );

    if (!issued.success) {
      throw createError(getErrorResponse(StatusCodes.BAD_GATEWAY));
    }

    return { ticket: issued.data.ticket };
  },
);
