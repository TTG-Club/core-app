import { z } from 'zod';

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
  const { email, username } = await getValidatedQuery(event, existSchema.parse);

  try {
    await Promise.any([
      prisma.user.findUniqueOrThrow({
        where: {
          username,
        },
      }),
      prisma.user.findUniqueOrThrow({
        where: {
          email,
        },
      }),
    ]);

    return true;
  } catch (err) {
    console.error(err);

    return false;
  }
});
