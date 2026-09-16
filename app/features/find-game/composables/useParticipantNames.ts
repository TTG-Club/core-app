import { UNKNOWN_PARTICIPANT_NAME } from '../model';

/**
 * Отображаемые имена участников игры.
 *
 * find-game-api хранит только идентификаторы (`sub` токена) и имён не знает
 * вовсе. Имена вместе с аватарками резолвит общий для сайта кеш
 * `useUserPublicProfiles` — те же пачки запросов, что и у аватарок участников.
 * Раздел добавляет к нему свою подпись для пользователя без имени.
 */
export function useParticipantNames() {
  const { resolveProfiles, watchProfiles, getProfile, isProfilePending } =
    useUserPublicProfiles();

  /**
   * Имя участника. Если core-api имени не вернул, показывается нейтральная
   * подпись — сырой идентификатор пользователю ничего не говорит. Пока ответа
   * нет, на месте имени нужен скелетон: его рисует `ParticipantName`.
   *
   * @param userId идентификатор участника.
   */
  function getParticipantName(userId: string): string {
    return getProfile(userId)?.displayName ?? UNKNOWN_PARTICIPANT_NAME;
  }

  /**
   * Имя для инициалов аватарки участника. Пока имя грузится, инициалов нет:
   * иначе в кружке мелькала бы первая буква подписи-заглушки.
   *
   * @param userId идентификатор участника.
   * @returns имя; null — ответа core-api ещё не было.
   */
  function getParticipantAvatarName(userId: string): string | null {
    return isProfilePending(userId) ? null : getParticipantName(userId);
  }

  return {
    getParticipantName,
    getParticipantAvatarName,
    isParticipantNamePending: isProfilePending,
    resolveNames: resolveProfiles,
    watchParticipantNames: watchProfiles,
  };
}
