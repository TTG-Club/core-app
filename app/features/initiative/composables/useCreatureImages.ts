import type { TrackerParticipant } from '~initiative/model';

import { parseCreatureImage } from '~initiative/model';

/**
 * Догружает и кэширует картинки существ из бестиария по `creatureUrl`.
 * В модели участника картинок нет — они живут только в детальном ответе
 * `GET /api/v2/bestiary/{url}` (поле `image`, как в `CreatureDrawer`/`CreatureBody`).
 * Кэш и реестр запросов ОБЩИЕ (useState): лента и строки списка тянут одних и
 * тех же существ, поэтому дедупим сеть между всеми потребителями (включая дубли
 * «Крыса 1/2/3» с одним слагом).
 * @param participantsGetter Геттер актуального списка участников (реактивный).
 */
export function useCreatureImages(
  participantsGetter: () => Array<TrackerParticipant>,
) {
  const images = useState<Record<string, string>>(
    'initiative-creature-images',
    () => ({}),
  );

  const requested = useState<Set<string>>(
    'initiative-creature-images-requested',
    () => new Set(),
  );

  /**
   * Тянет картинку одного существа — один раз на слаг.
   * @param url Слаг существа.
   */
  async function fetchImage(url: string): Promise<void> {
    if (requested.value.has(url)) {
      return;
    }

    requested.value.add(url);

    try {
      const detail = await $fetch<unknown>(`/api/v2/bestiary/${url}`);
      const image = parseCreatureImage(detail);

      if (image) {
        images.value[url] = image;
      }
    } catch {
      // Транзиентная ошибка (503/таймаут) — снимаем метку, чтобы слаг мог
      // перезапроситься при следующей синхронизации/монтировании строки. Аватар
      // пока останется иконкой/аббревиатурой.
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
        void fetchImage(url);
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
      ? images.value[participant.creatureUrl]
      : undefined;
  }

  /**
   * Сбрасывает битую картинку (по `@error` у `<img>`) — аватар падает на иконку.
   * Пишем пустую строку (а не удаляем ключ): `imageFor` вернёт её как falsy, а
   * `requested` уже помечен, так что повторного запроса не будет.
   * @param url Слаг существа (может отсутствовать).
   */
  function dropImage(url: string | undefined): void {
    if (url) {
      images.value[url] = '';
    }
  }

  return { imageFor, dropImage };
}
