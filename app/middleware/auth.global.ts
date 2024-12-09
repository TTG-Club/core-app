import { StatusCodes } from 'http-status-codes';
import { notification } from 'ant-design-vue';

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.meta.auth?.roles?.length) {
    return true;
  }

  const preventRouting = (code: StatusCodes) => {
    if (import.meta.server) {
      return createError({
        statusCode: code,
        message: getStatusMessage(code),
      });
    }

    notification.error({
      message: 'Ошибка доступа',
      description: getStatusMessage(StatusCodes.FORBIDDEN),
    });

    return abortNavigation();
  };

  const cookie = useCookie(USER_TOKEN_COOKIE);

  if (!cookie.value) {
    return preventRouting(StatusCodes.UNAUTHORIZED);
  }

  const requestFetch = useRequestFetch();

  try {
    const role = await requestFetch('/api/user/role');

    if (!to.meta.auth.roles.includes(role || ROLE.USER)) {
      return preventRouting(StatusCodes.FORBIDDEN);
    }

    return true;
  } catch (err) {
    return preventRouting(StatusCodes.BAD_REQUEST);
  }
});
