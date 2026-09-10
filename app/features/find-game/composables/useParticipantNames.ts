import type { MaybeRefOrGetter } from 'vue';

import { fetchParticipantNames, UNKNOWN_PARTICIPANT_NAME } from '../model';

/**
 * Отображаемые имена участников игры.
 *
 * find-game-api хранит только идентификаторы (`sub` токена) и имён не знает
 * вовсе, поэтому они резолвятся в core-api — владельце этих данных. Без
 * резолва в списке игроков стоял бы сырой UUID.
 *
 * `createSharedComposable`, а не `createGlobalState`: кэш имён нужен, пока
 * открыт раздел игр, и должен умирать вместе с ним — держать его в памяти
 * сервера между запросами незачем.
 */
export const useParticipantNames = createSharedComposable(() => {
  const nameByUserId = ref<Record<string, string>>({});

  // Идентификаторы, по которым запрос уже ушёл: без этого каждая перерисовка
  // списка отправляла бы повторный резолв того же участника.
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
   * Держит имена в актуальном состоянии: следит за списком идентификаторов и
   * дорезолвивает те, которых ещё нет. Каждый список раздела — заявки, состав
   * встречи, отметки, выдача каталога — приходит с одними идентификаторами, и
   * без общего слежения каждый заводил бы собственный `watch` с той же
   * оговоркой про core-api.
   *
   * @param userIdsSource Источник идентификаторов: ref, геттер или массив.
   */
  function watchParticipantNames(
    userIdsSource: MaybeRefOrGetter<ReadonlyArray<string>>,
  ): void {
    watch(
      () => toValue(userIdsSource),
      (userIds) => {
        void resolveNames(userIds);
      },
      { immediate: true },
    );
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
    getParticipantName,
    resolveNames,
    watchParticipantNames,
  };
});
