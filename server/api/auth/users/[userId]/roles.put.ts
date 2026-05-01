import { z } from 'zod';

const updateUserRolesParamsSchema = z.object({
  userId: z.string().uuid(),
});

const updateUserRolesBodySchema = z.object({
  roleIds: z.array(z.number().int().positive()).min(1),
});

export default defineEventHandler(async (event) => {
  const parsedParams = updateUserRolesParamsSchema.safeParse(
    getRouterParams(event),
  );

  const parsedBody = updateUserRolesBodySchema.safeParse(
    await readBody<unknown>(event),
  );

  if (!parsedParams.success || !parsedBody.success) {
    throw createAuthValidationError();
  }

  return parseAuthAdminRolesResponse(
    await fetchAuthAdminService<unknown>(
      event,
      `/api/admin/users/${parsedParams.data.userId}/roles`,
      {
        body: parsedBody.data,
        method: 'PUT',
      },
    ),
  );
});
