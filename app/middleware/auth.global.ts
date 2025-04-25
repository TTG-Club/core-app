import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { useToast } from '~ui/toast';
import { getStatusMessage } from '~~/shared/utils';

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

    const $toast = useToast();

    $toast.error({
      title: 'Ошибка доступа',
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

  const requestFetch = useRequestFetch();

  try {
    const roles = await requestFetch<Array<string>>('/api/user/roles');

    for (const role of roles) {
      if (to.meta.auth.roles.includes(role)) {
        return true;
      }
    }

    return preventRouting(StatusCodes.FORBIDDEN);
  } catch (err) {
    return preventRouting(StatusCodes.FORBIDDEN);
  }
});
