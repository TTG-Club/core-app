import { StatusCodes } from 'http-status-codes';
import { notification } from 'ant-design-vue';

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.meta.auth?.roles?.length) {
    return true;
  }

  const preventRouting = () => {
    if (import.meta.server) {
      return navigateTo('/');
    }

    notification.error({
      message: 'Ошибка доступа',
      description: getStatusMessage(StatusCodes.FORBIDDEN),
    });

    return abortNavigation();
  };

  const cookie = useCookie(USER_TOKEN_COOKIE);

  if (!cookie.value) {
    return preventRouting();
  }

  const requestFetch = useRequestFetch();

  try {
    const role = await requestFetch('/api/user/role');

    if (!to.meta.auth.roles.includes(role || ROLE.USER)) {
      return preventRouting();
    }

    return true;
  } catch (err) {
    return preventRouting();
  }
});
