import { UNKNOWN_PARTICIPANT_NAME } from '../model';

/**
 * Отображаемые имена участников игры.
 *
 * find-game-api хранит только идентификаторы (`sub` токена) и имён не знает
 * вовсе. Имена вместе с аватарками резолвит общий для сайта кеш
 * `useUserPublicProfiles` — те же пачки запросов, что и у аватарок участников.
 * Раздел добавляет к нему свою подпись для ещё не приехавшего имени.
 */
export function useParticipantNames() {
  const { resolveProfiles, watchProfiles, getProfile } =
    useUserPublicProfiles();

  /**
   * Имя участника. Пока имя не приехало (или у пользователя его нет),
   * показывается нейтральная подпись — сырой идентификатор пользователю
   * ничего не говорит.
   *
   * @param userId идентификатор участника.
   */
  function getParticipantName(userId: string): string {
    return getProfile(userId)?.displayName ?? UNKNOWN_PARTICIPANT_NAME;
  }

  return {
    getParticipantName,
    resolveNames: resolveProfiles,
    watchParticipantNames: watchProfiles,
  };
}
