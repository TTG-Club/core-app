import type { ComputedRef, ShallowRef } from 'vue';

import type { ClassChoice, ClassOption, FeatSummary } from '../model';

import { omit } from 'es-toolkit';

import {
  CLASSES_SEARCH_PATH,
  fetchFeatDetail,
  getPickedFeatChoices,
  parseClassOptions,
  PICKED_FEAT_LABELS,
} from '../model';

interface PickedFeatChoices {
  /** Детали взятых черт по идентификатору выбора черты. */
  pickedFeats: Readonly<ShallowRef<Record<string, FeatSummary>>>;

  /**
   * Собственные выборы взятых черт по идентификатору выбора черты — все, а не
   * только показанные: по ним собираются пулы заклинаний и ответы записи черты.
   */
  choicesByPick: ComputedRef<Record<string, ClassChoice[]>>;

  /** Хоть одна деталь выбранной черты ещё в пути. */
  isLoading: ComputedRef<boolean>;

  /** Деталь черты этого выбора ещё в пути — её выборы пока не спросить. */
  isRequested: (choiceId: string) => boolean;

  /** Собственные выборы черты с подписями классов у выбора списка заклинаний. */
  getChoices: (summary: FeatSummary) => ClassChoice[];

  /**
   * Догружает деталь черты, выбранной в умении; '' вместо url — выбор снят.
   * Деталь прежней черты уходит сразу.
   */
  load: (choiceId: string, featUrl: string) => Promise<void>;

  /**
   * Деталь черты для записи на лист: пришедшая при выборе, а если тогда она не
   * загрузилась — запрошенная заново. Сбой запроса бросает.
   */
  resolve: (choiceId: string, featUrl: string) => Promise<FeatSummary | null>;

  /** Забывает все взятые черты: мастер открыт заново либо сменил цель. */
  reset: () => void;
}

/**
 * Собственные выборы черт, взятых выбором черты в мастере листа: «Посвящённый
 * в магию» просит список, заговоры и заклинание так же, как в окне добавления
 * черты. Один код на мастера вида, класса и повышения уровня: деталь черты
 * грузится сразу при выборе, и её выборы спрашиваются под полем черты.
 *
 * @returns детали взятых черт, их выборы и загрузка.
 */
export function usePickedFeatChoices(): PickedFeatChoices {
  const toast = useToast();

  // Словари заменяются целиком, поэтому глубокая реактивность им не нужна
  const pickedFeats = shallowRef<Record<string, FeatSummary>>({});

  /**
   * Детали черт в пути: идентификатор выбора черты → url черты, за которой ушёл
   * запрос. Применять мастер до их прихода рано — черта легла бы без ответов.
   */
  const requests = shallowRef<Record<string, string>>({});

  /**
   * Классы каталога — подписи выбора списка заклинаний у черты: в механике
   * классы лежат ссылками, и без каталога игрок увидел бы слаг. Грузятся, только
   * когда взятая черта такой выбор спрашивает.
   */
  const spellListClasses = shallowRef<ClassOption[]>([]);

  const isLoading = computed(() => Object.keys(requests.value).length > 0);

  const choicesByPick = computed<Record<string, ClassChoice[]>>(() =>
    Object.fromEntries(
      Object.entries(pickedFeats.value).map(([choiceId, summary]) => [
        choiceId,
        getPickedFeatChoices(summary, spellListClasses.value),
      ]),
    ),
  );

  /**
   * Ушёл ли запрос за деталью черты этого выбора и ещё не вернулся.
   *
   * @param choiceId идентификатор выбора черты.
   * @returns true — деталь в пути, выборы черты пока не спросить.
   */
  function isRequested(choiceId: string): boolean {
    return choiceId in requests.value;
  }

  /**
   * Собственные выборы черты с подписями классов у выбора списка заклинаний.
   *
   * @param summary деталь черты.
   * @returns выборы черты без повышения характеристик.
   */
  function getChoices(summary: FeatSummary): ClassChoice[] {
    return getPickedFeatChoices(summary, spellListClasses.value);
  }

  /**
   * Классы каталога для подписей выбора списка заклинаний. Сбой выбору не
   * мешает: подписью останется ссылка класса, а пул сузится и по ней.
   */
  async function loadSpellListClasses(): Promise<void> {
    if (spellListClasses.value.length) {
      return;
    }

    try {
      const response = await $fetch<unknown>(CLASSES_SEARCH_PATH, {
        method: 'GET',
        retry: 0,
      });

      spellListClasses.value = parseClassOptions(response, true);
    } catch (error) {
      consola.error(PICKED_FEAT_LABELS.spellListClassesErrorLog, error);
    }
  }

  /**
   * Деталь черты вместе с подписями классов для её выбора списка заклинаний.
   *
   * @param featUrl url черты.
   * @returns деталь черты; null — не загрузилась.
   */
  async function fetchPickedFeat(featUrl: string): Promise<FeatSummary | null> {
    try {
      const summary = await fetchFeatDetail(featUrl);

      // Подписи классов нужны до показа выбора: ответ хранится подписью, и её
      // смена после ответа потеряла бы выбранный список
      if (summary?.choices.some((choice) => choice.kind === 'spell-list')) {
        await loadSpellListClasses();
      }

      return summary;
    } catch (error) {
      consola.error(PICKED_FEAT_LABELS.detailErrorLog, error);

      return null;
    }
  }

  /**
   * Догружает деталь черты, выбранной в умении: её собственные выборы
   * спрашиваются тут же, под полем черты. Деталь прежней черты уходит сразу —
   * её выборы к новой черте не относятся.
   *
   * @param choiceId идентификатор выбора черты.
   * @param featUrl url выбранной черты; '' — выбор снят.
   */
  async function load(choiceId: string, featUrl: string): Promise<void> {
    pickedFeats.value = omit(pickedFeats.value, [choiceId]);

    if (!featUrl) {
      requests.value = omit(requests.value, [choiceId]);

      return;
    }

    requests.value = { ...requests.value, [choiceId]: featUrl };

    const summary = await fetchPickedFeat(featUrl);

    // Пока деталь шла, игрок мог выбрать другую черту или снять выбор — тогда
    // ответ устарел
    if (requests.value[choiceId] !== featUrl) {
      return;
    }

    requests.value = omit(requests.value, [choiceId]);

    if (!summary) {
      toast.add({
        color: 'error',
        icon: 'tabler:alert-triangle',
        title: PICKED_FEAT_LABELS.detailError,
      });

      return;
    }

    pickedFeats.value = { ...pickedFeats.value, [choiceId]: summary };
  }

  /**
   * Деталь черты для записи на лист. Запрос заново — только если при выборе
   * черты она не загрузилась; его сбой бросает.
   *
   * @param choiceId идентификатор выбора черты.
   * @param featUrl url выбранной черты.
   * @returns деталь черты; null — ответ неожиданной формы.
   */
  function resolve(
    choiceId: string,
    featUrl: string,
  ): Promise<FeatSummary | null> {
    // Деталь пришла ещё при выборе черты — на ней игрок и ответил на её выборы
    const loaded = pickedFeats.value[choiceId];

    return loaded?.url === featUrl
      ? Promise.resolve(loaded)
      : fetchFeatDetail(featUrl);
  }

  /** Забывает все взятые черты: мастер открыт заново либо сменил цель. */
  function reset(): void {
    pickedFeats.value = {};
    requests.value = {};
  }

  return {
    pickedFeats,
    choicesByPick,
    isLoading,
    isRequested,
    getChoices,
    load,
    resolve,
    reset,
  };
}
