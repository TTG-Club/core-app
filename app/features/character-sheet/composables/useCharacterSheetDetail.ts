import {
  CHARACTER_SHEET_ROUTE,
  CHARACTER_SHEET_SHARED_ROUTE,
  SHARED_DETAIL_QUERY_PREFIX,
} from '../model';

/**
 * Управление правой панелью списка листов персонажей в широком режиме.
 * Зеркалит логику `useSectionDetail`: выбранный лист задаётся кликом по
 * карточке через `?detail=<id>`, документ панель грузит сама
 * (`useCharacterSheetLoader`).
 *
 * Чужой лист, сохранённый по ссылке, живёт в том же параметре с префиксом
 * `shared:` — вторым параметром пришлось бы гасить первый при каждом
 * переключении карточек и учить этому общий `useSectionLink`.
 *
 * @returns Реактивный выбор панели и обработчики.
 */
export function useCharacterSheetDetail() {
  const route = useRoute();
  const router = useRouter();
  const { isSplitActive } = useLayoutWidth();

  const detailValue = computed(() => {
    const detail = route.query.detail;

    return typeof detail === 'string' && detail ? detail : '';
  });

  const isSharedDetail = computed(() =>
    detailValue.value.startsWith(SHARED_DETAIL_QUERY_PREFIX),
  );

  /** Токен ссылки выбранного чужого листа; '' — выбран свой лист или ничего. */
  const sharedToken = computed(() =>
    isSharedDetail.value
      ? detailValue.value.slice(SHARED_DETAIL_QUERY_PREFIX.length)
      : '',
  );

  /** Идентификатор выбранного своего листа; '' — выбран чужой или ничего. */
  const detailId = computed(() =>
    isSharedDetail.value ? '' : detailValue.value,
  );

  /** Идентификатор для загрузчика: id своего листа либо токен чужого. */
  const detailTarget = computed(() => sharedToken.value || detailId.value);

  const isDetailOpen = computed(() => Boolean(detailTarget.value));
  const isRouterReady = ref(false);

  const detailPagePath = computed(() =>
    isSharedDetail.value
      ? `${CHARACTER_SHEET_SHARED_ROUTE}/${sharedToken.value}`
      : `${CHARACTER_SHEET_ROUTE}/${detailId.value}`,
  );

  // Серверный редирект: расшаренная из широкого режима ссылка `?detail=`,
  // открытая в стандартном режиме, уводит на отдельную страницу листа.
  if (import.meta.server && !isSplitActive.value && isDetailOpen.value) {
    navigateTo(detailPagePath.value, { replace: true, redirectCode: 302 });
  }

  onMounted(async () => {
    await router.isReady();
    isRouterReady.value = true;

    if (!isSplitActive.value && isDetailOpen.value) {
      router.replace({ path: detailPagePath.value });
    }
  });

  watch(isSplitActive, (splitActive) => {
    if (!isRouterReady.value) {
      return;
    }

    // Ушли из широкого режима с открытой панелью — просто снимаем выбор
    // (в стандартном режиме лист открывается в drawer, а не в панели).
    if (!splitActive && isDetailOpen.value) {
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
    sharedToken,
    detailTarget,
    isSharedDetail,
    isDetailOpen,
    isSplitActive,
    detailPagePath,
    closeDetail,
  };
}
