import { CHARACTER_SHEET_ROUTE } from '../model';

/**
 * Управление правой панелью списка листов персонажей в широком режиме.
 * Зеркалит логику `useSectionDetail`: выбранный лист задаётся кликом по
 * карточке через `?detail=<id>`, документ панель грузит сама
 * (`useCharacterSheetLoader`).
 *
 * @returns Реактивный id выбранного листа и обработчики панели.
 */
export function useCharacterSheetDetail() {
  const route = useRoute();
  const router = useRouter();
  const { isSplitActive } = useLayoutWidth();

  const detailId = computed(() => {
    const detail = route.query.detail;

    return typeof detail === 'string' && detail ? detail : '';
  });

  const isDetailOpen = computed(() => Boolean(detailId.value));
  const isRouterReady = ref(false);

  const detailPagePath = computed(
    () => `${CHARACTER_SHEET_ROUTE}/${detailId.value}`,
  );

  // Серверный редирект: расшаренная из широкого режима ссылка `?detail=`,
  // открытая в стандартном режиме, уводит на отдельную страницу листа.
  if (import.meta.server && !isSplitActive.value && detailId.value) {
    navigateTo(detailPagePath.value, { replace: true, redirectCode: 302 });
  }

  onMounted(async () => {
    await router.isReady();
    isRouterReady.value = true;

    if (!isSplitActive.value && detailId.value) {
      router.replace({ path: detailPagePath.value });
    }
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
    }
  });

  /** Закрывает правую панель и снимает выбор листа. */
  function closeDetail(): void {
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
    isSplitActive,
    closeDetail,
  };
}
