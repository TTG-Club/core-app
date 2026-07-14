import type { CreatureSummary, TrackerParticipant } from '~initiative/model';

import { parseCreatureSummary } from '~initiative/model';

/**
 * Догружает и кэширует сводки существ из бестиария по `creatureUrl`:
 * картинку аватара и КД. В модели участника этих полей нет — они живут только
 * в детальном ответе `GET /api/v2/bestiary/{url}` (поля `image` и `ac`, как в
 * `CreatureDrawer`/`CreatureBody`).
 * Кэш и реестр запросов ОБЩИЕ (useState): лента и строки списка тянут одних и
 * тех же существ, поэтому дедупим сеть между всеми потребителями (включая дубли
 * «Крыса 1/2/3» с одним слагом).
 * @param participantsGetter Геттер актуального списка участников (реактивный).
 */
export function useCreatureSummaries(
  participantsGetter: () => Array<TrackerParticipant>,
) {
  const summaries = useState<Record<string, CreatureSummary>>(
    'initiative-creature-summaries',
    () => ({}),
  );

  const requested = useState<Set<string>>(
    'initiative-creature-summaries-requested',
    () => new Set(),
  );

  /**
   * Тянет сводку одного существа — один раз на слаг.
   * @param url Слаг существа.
   */
  async function fetchSummary(url: string): Promise<void> {
    if (requested.value.has(url)) {
      return;
    }

    requested.value.add(url);

    try {
      const detail = await $fetch<unknown>(`/api/v2/bestiary/${url}`);

      summaries.value[url] = parseCreatureSummary(detail);
    } catch {
      // Транзиентная ошибка (503/таймаут) — снимаем метку, чтобы слаг мог
      // перезапроситься при следующей синхронизации/монтировании строки. Аватар
      // пока останется иконкой/аббревиатурой, а КД — скрытым.
      requested.value.delete(url);
    }
  }

  watch(
    () =>
      participantsGetter().flatMap((participant) =>
        participant.type === 'CREATURE' && participant.creatureUrl
          ? [participant.creatureUrl]
          : [],
      ),
    (urls) => {
      for (const url of new Set(urls)) {
        void fetchSummary(url);
      }
    },
    { immediate: true },
  );

  /**
   * URL картинки участника или `undefined` (игрок / картинки нет / битая).
   * @param participant Участник трекера.
   */
  function imageFor(participant: TrackerParticipant): string | undefined {
    return participant.creatureUrl
      ? summaries.value[participant.creatureUrl]?.image || undefined
      : undefined;
  }

  /**
   * Сводка существа для участника или `undefined` (игрок / ещё грузится).
   * @param participant Участник трекера.
   */
  function summaryFor(
    participant: TrackerParticipant,
  ): CreatureSummary | undefined {
    return participant.creatureUrl
      ? summaries.value[participant.creatureUrl]
      : undefined;
  }

  /**
   * Сбрасывает битую картинку (по `@error` у `<img>`) — аватар падает на иконку.
   * Пишем пустую строку (а не удаляем сводку): `imageFor` вернёт её как falsy,
   * `requested` уже помечен, так что повторного запроса не будет, а КД уцелеет.
   * @param url Слаг существа (может отсутствовать).
   */
  function dropImage(url: string | undefined): void {
    const summary = url ? summaries.value[url] : undefined;

    if (url && summary) {
      summaries.value[url] = { ...summary, image: '' };
    }
  }

  return { imageFor, summaryFor, dropImage };
}
