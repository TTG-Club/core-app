import { z } from 'zod';
import type { EventHandlerRequest } from 'h3';
import { StatusCodes } from 'http-status-codes';
import { deleteFromS3 } from '~~/server/utils/s3';

const requestSchema = z.object({
  key: z.string().min(3, 'Слишком короткий ключ объекта'),
});

interface Request extends EventHandlerRequest {
  query: z.infer<typeof requestSchema>;
}

export default defineEventHandler<Request>(async (event) => {
  verifyToken(event);

  let key: string | undefined;

  try {
    const query = await getValidatedQuery(event, requestSchema.parse);

    key = query.key;
  } catch (err) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Отсутствует ключ объекта для удаления',
      }),
    );
  }

  return deleteFromS3(key);
});
