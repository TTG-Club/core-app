import { z } from 'zod';
import type { EventHandlerRequest } from 'h3';
import { StatusCodes } from 'http-status-codes';
import { getErrorResponse } from '~~/shared/utils';
import { S3Service } from '~~/server/services';

const requestSchema = z.object({
  path: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-/]+[a-z0-9]$/i)
    .optional(),
  keyOrUrl: z.string().min(3),
});

interface Request extends EventHandlerRequest {
  query: z.infer<typeof requestSchema>;
}

export default defineEventHandler<Request>(async (event) => {
  const { username } = getUserFromToken(event);

  let path: string | undefined;
  let keyOrUrl: string | undefined;

  try {
    const query = await getValidatedQuery(event, requestSchema.parse);

    path = query?.path;
    keyOrUrl = query.keyOrUrl;
  } catch (err) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Некорректные ключ или ссылка на объект',
      }),
    );
  }

  const key = getKeyFromUrl(keyOrUrl);

  if (!hasUserAccess(key, username, path)) {
    throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
  }

  return S3Service.delete(key);
});
