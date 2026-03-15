import { intersection } from 'es-toolkit';
import { StatusCodes } from 'http-status-codes';

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.meta.auth?.roles?.length) {
    return true;
  }

  const { roles, pending, fetch } = useUser();

  try {
    if (!roles.value && !pending.value) {
      await fetch();
    }

    if (!roles.value) {
      return preventRouting(StatusCodes.UNAUTHORIZED);
    }

    const intersectionRoles = intersection(
      roles.value || [],
      to.meta.auth.roles,
    );

    if (intersectionRoles.length > 0) {
      return true;
    }

    return preventRouting(StatusCodes.FORBIDDEN);
  } catch {
    return preventRouting(StatusCodes.UNAUTHORIZED);
  }
});
