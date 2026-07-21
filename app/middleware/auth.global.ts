import { intersection } from 'es-toolkit';
import { StatusCodes } from 'http-status-codes';

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.meta.auth?.roles?.length) {
    return true;
  }

  const { roles, fetch } = useUser();

  try {
    // Перепроверяем сессию при каждом входе в защищённый раздел: доверять
    // закешированным roles нельзя — серверная сессия могла молча умереть
    // (протух/отозван refresh-токен), а клиентское состояние осталось
    // «залогинен». Иначе мы пускали в админку по мёртвой сессии, раздел молча
    // не грузился (данные отдавали 401), а разлогин был виден только после F5.
    await fetch();

    if (!roles.value) {
      return preventRouting(StatusCodes.UNAUTHORIZED);
    }

    const intersectionRoles = intersection(roles.value, to.meta.auth.roles);

    if (intersectionRoles.length > 0) {
      return true;
    }

    return preventRouting(StatusCodes.FORBIDDEN);
  } catch (err) {
    return preventRouting(StatusCodes.UNAUTHORIZED);
  }
});
