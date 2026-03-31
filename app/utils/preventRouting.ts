import type { StatusCodes } from 'http-status-codes';

export function preventRouting(code: StatusCodes) {
  if (import.meta.server) {
    return abortNavigation(createError(getErrorResponse(code)));
  }

  const nuxtApp = useNuxtApp();

  if (nuxtApp.isHydrating) {
    return abortNavigation();
  }

  const $toast = useToast();

  $toast.add({
    color: 'error',
    title: 'Ошибка доступа',
    description: getStatusMessage(code),
  });

  return abortNavigation(createError(getErrorResponse(code)));
}
