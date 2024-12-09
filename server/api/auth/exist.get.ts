import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

const existSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(1000)
    .refine((string) => !string.startsWith(' ') && !string.endsWith(' '))
    .optional(),
  email: z
    .string()
    .email()
    .refine((string) => !string.startsWith(' ') && !string.endsWith(' '))
    .optional(),
});

interface Request {
  query: z.infer<typeof existSchema>;
}

export default defineEventHandler<Request>(async (event) => {
  let email, username;

  try {
    ({ email, username } = await getValidatedQuery(event, existSchema.parse));
  } catch (err) {
    throw createError(
      getErrorResponse(StatusCodes.BAD_REQUEST, {
        message: 'Неверно заполнено поле',
      }),
    );
  }

  try {
    return !!(await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    }));
  } catch (err) {
    throw createError(
      getErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: 'Неизвестная ошибка ',
        data: err,
      }),
    );
  }
});
