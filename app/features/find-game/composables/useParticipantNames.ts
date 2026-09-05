import { fetchParticipantNames, UNKNOWN_PARTICIPANT_NAME } from '../model';

/**
 * Отображаемые имена участников игры.
 *
 * find-game-api хранит только идентификаторы (`sub` токена) и имён не знает
 * вовсе, поэтому они резолвятся в core-api — владельце этих данных. Без
 * резолва в списке игроков и в чате стоял бы сырой UUID.
 *
 * `createSharedComposable`, а не `createGlobalState`: кэш имён нужен, пока
 * открыта страница игры с чатом, и должен умирать вместе с ней — держать его
 * в памяти сервера между запросами незачем.
 */
export const useParticipantNames = createSharedComposable(() => {
  const nameByUserId = ref<Record<string, string>>({});

  // Идентификаторы, по которым запрос уже ушёл: без этого каждое новое
  // сообщение в чате отправляло бы повторный резолв того же автора.
  const requested = new Set<string>();

  /**
   * Подтягивает недостающие имена. Уже известные и уже запрошенные
   * идентификаторы пропускаются.
   * @param userIds Идентификаторы участников.
   */
  async function resolveNames(userIds: ReadonlyArray<string>): Promise<void> {
    const missing = [...new Set(userIds.filter(Boolean))].filter(
      (userId) => !requested.has(userId),
    );

    if (!missing.length) {
      return;
    }

    for (const userId of missing) {
      requested.add(userId);
    }

    const resolved = await fetchParticipantNames(missing);

    if (!resolved.length) {
      // Резолв не удался — даём следующему вызову попробовать снова, иначе
      // имена не появятся до перезагрузки страницы.
      for (const userId of missing) {
        requested.delete(userId);
      }

      return;
    }

    nameByUserId.value = {
      ...nameByUserId.value,
      ...Object.fromEntries(
        resolved.map((entry) => [entry.userId, entry.displayName]),
      ),
    };
  }

  /**
   * Имя участника. Пока имя не приехало (или у пользователя его нет),
   * показывается нейтральная подпись — сырой идентификатор пользователю
   * ничего не говорит.
   * @param userId Идентификатор участника.
   */
  function getParticipantName(userId: string): string {
    return nameByUserId.value[userId] ?? UNKNOWN_PARTICIPANT_NAME;
  }

  return {
    nameByUserId: readonly(nameByUserId),

    getParticipantName,
    resolveNames,
  };
});
