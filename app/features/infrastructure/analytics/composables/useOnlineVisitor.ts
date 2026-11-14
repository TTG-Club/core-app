import type { OnlineVisitor } from '../model';

import { v7 as uuidv7 } from 'uuid';

import {
  ONLINE_VISITOR_ID_COOKIE,
  ONLINE_VISITOR_ID_COOKIE_MAX_AGE_SECONDS,
  parseOnlineVisitorId,
  REGISTERED_ONLINE_TYPE,
  VISITOR_ONLINE_TYPE,
} from '../model';

/**
 * Кем посетитель представляется сервису учёта. Вошедший — логином, гость —
 * случайным идентификатором из cookie; гостю без cookie идентификатор выдаётся
 * при первом обращении.
 *
 * Состояние общее: счётчик онлайна и учёт работы с инструментами читают одну и
 * ту же cookie, иначе новый гость получил бы два идентификатора и стал двумя
 * людьми.
 */
export const useOnlineVisitor = createSharedComposable(() => {
  const storedVisitorId = useCookie<unknown>(ONLINE_VISITOR_ID_COOKIE, {
    maxAge: ONLINE_VISITOR_ID_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
  });

  const visitorId = computed(() => parseOnlineVisitorId(storedVisitorId.value));
  const { isLoggedIn, user } = useUser();

  /** Возвращает логин вошедшего или идентификатор гостя, выдавая его при нужде. */
  function getVisitor(): OnlineVisitor {
    if (isLoggedIn.value && user.value?.username) {
      return {
        key: user.value.username,
        ...(visitorId.value ? { previousGuestKey: visitorId.value } : {}),
        type: REGISTERED_ONLINE_TYPE,
      };
    }

    const guestId = visitorId.value ?? uuidv7();

    storedVisitorId.value = guestId;

    return { key: guestId, type: VISITOR_ONLINE_TYPE };
  }

  return { getVisitor };
});
