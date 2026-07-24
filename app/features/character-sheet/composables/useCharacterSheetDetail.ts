import type { MaybeRefOrGetter } from 'vue';

import { toValue } from 'vue';

import { CHARACTER_SHEET_ROUTE } from '../model';

/**
 * Управление правой панелью списка листов персонажей в широком режиме.
 * Зеркалит логику `useSectionDetail`, но без загрузки с API — лист живёт в
 * общем состоянии `useCharacterSheet`, поэтому «деталь» здесь — это лишь факт
 * выбора листа через `?detail=<id>`.
 *
 * @param characterId Идентификатор единственного листа для автовыбора.
 * @returns Реактивный id выбранного листа и обработчики панели.
 */
export function useCharacterSheetDetail(characterId: MaybeRefOrGetter<string>) {
  const route = useRoute();
  const router = useRouter();
  const { isSplitActive } = useLayoutWidth();

  const detailId = computed(() => {
    const detail = route.query.detail;

    return typeof detail === 'string' && detail ? detail : '';
  });

  const isDetailOpen = computed(() => Boolean(detailId.value));
  const isDetailDismissed = ref(false);
  const isRouterReady = ref(false);

  const detailPagePath = computed(
    () => `${CHARACTER_SHEET_ROUTE}/${detailId.value}`,
  );

  // Серверный редирект: расшаренная из широкого режима ссылка `?detail=`,
  // открытая в стандартном режиме, уводит на отдельную страницу листа.
  if (import.meta.server && !isSplitActive.value && detailId.value) {
    navigateTo(detailPagePath.value, { replace: true, redirectCode: 302 });
  }

  /** Автовыбор единственного листа при активном широком режиме. */
  function autoSelectFirst(): void {
    if (!isSplitActive.value || isDetailDismissed.value || detailId.value) {
      return;
    }

    router.replace({
      query: {
        ...route.query,
        detail: toValue(characterId),
      },
    });
  }

  onMounted(async () => {
    await router.isReady();
    isRouterReady.value = true;

    if (!isSplitActive.value && detailId.value) {
      router.replace({ path: detailPagePath.value });

      return;
    }

    autoSelectFirst();
  });

  watch(isSplitActive, (splitActive) => {
    if (!isRouterReady.value) {
      return;
    }

    // Ушли из широкого режима с открытой панелью — просто снимаем выбор
    // (в стандартном режиме лист открывается в drawer, а не в панели).
    if (!splitActive && detailId.value) {
      router.replace({
        query: {
          ...route.query,
          detail: undefined,
        },
      });

      return;
    }

    autoSelectFirst();
  });

  /** Закрывает правую панель и снимает выбор листа. */
  function closeDetail(): void {
    isDetailDismissed.value = true;

    router.push({
      query: {
        ...route.query,
        detail: undefined,
      },
    });
  }

  return {
    detailId,
    isDetailOpen,
    isDetailDismissed,
    isSplitActive,
    closeDetail,
  };
}
