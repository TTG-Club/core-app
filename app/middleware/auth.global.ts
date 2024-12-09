import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { notification } from 'ant-design-vue';

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.meta.auth?.roles?.length) {
    return true;
  }

  const preventRouting = (code: StatusCodes) => {
    if (import.meta.server) {
      return abortNavigation(
        createError({
          statusCode: code,
          statusMessage: getReasonPhrase(code),
          message: getStatusMessage(code),
        }),
      );
    }

    const nuxtApp = useNuxtApp();

    if (nuxtApp.isHydrating) {
      return abortNavigation();
    }

    notification.error({
      message: 'Ошибка доступа',
      description: getStatusMessage(code),
    });

    return abortNavigation(
      createError({
        statusCode: code,
        statusMessage: getReasonPhrase(code),
        message: getStatusMessage(code),
      }),
    );
  };

  const cookie = useCookie(USER_TOKEN_COOKIE);

  if (!cookie.value) {
    return preventRouting(StatusCodes.UNAUTHORIZED);
  }

  const requestFetch = useRequestFetch();

  try {
    const role = await requestFetch('/api/user/role');

    if (!to.meta.auth.roles.includes(role)) {
      return preventRouting(StatusCodes.FORBIDDEN);
    }

    return true;
  } catch (err) {
    return preventRouting(StatusCodes.BAD_REQUEST);
  }
});
