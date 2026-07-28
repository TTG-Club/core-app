/** Запись канала: путь сущности, опубликованный одним экземпляром drawer-а. */
interface OpenEntityRecord {
  /** Идентификатор экземпляра drawer-а. */
  id: string;

  /** Относительный путь сущности, например `/spells/fireball`. */
  path: string;
}

/**
 * Хранит относительные пути сущностей, открытых в overlay-drawer-ах
 * (стандартный режим просмотра).
 *
 * Нужен баг-репорту: в стандартном режиме деталь открывается в drawer
 * через overlay и НЕ меняет маршрут (URL остаётся `/feats`), поэтому
 * `route.query.detail` пуст. Drawer публикует сюда свой путь
 * (например, `/feats/unarmed-fighting`), а `useBugReport` берёт его
 * как фолбэк, чтобы зафиксировать точный URL сущности.
 *
 * Записи хранятся стопкой: дроверы вкладываются друг в друга (ссылка
 * `{@spell}` внутри описания открывает следующий drawer), и актуален всегда
 * верхний. Закрытый drawer снимает только свою запись, поэтому под ним
 * снова становится виден путь родительского.
 *
 * В широком режиме (Wide Mode) деталь рендерит `UiDetailPane` и пишет
 * `query.detail`, поэтому этот канал не задействуется.
 *
 * Нейтральный composable уровня приложения: не зависит от фич, чтобы
 * `~ui/drawer` мог им пользоваться без нарушения слоёв.
 */
export function useOpenEntityPath() {
  const records = useState<OpenEntityRecord[]>('open-entity-paths', () => []);

  /** Путь верхнего (последнего открытого) drawer-а или пустая строка. */
  const openEntityPath = computed(() => records.value.at(-1)?.path ?? '');

  /** Публикует путь открытой сущности от имени экземпляра drawer-а. */
  function setOpenEntityPath(id: string, path: string): void {
    const isKnown = records.value.some((record) => record.id === id);

    if (!isKnown) {
      records.value = [...records.value, { id, path }];

      return;
    }

    // Обновление пути не меняет порядок: вложенный drawer должен остаться сверху.
    records.value = records.value.map((record) =>
      record.id === id ? { ...record, path } : record,
    );
  }

  /** Снимает запись экземпляра (при закрытии или размонтировании drawer-а). */
  function clearOpenEntityPath(id: string): void {
    records.value = records.value.filter((record) => record.id !== id);
  }

  return {
    openEntityPath,
    setOpenEntityPath,
    clearOpenEntityPath,
  };
}

/**
 * Публикует путь сущности, пока компонент смонтирован.
 *
 * Вызывать ТОЛЬКО из содержимого дровера (`DrawerBody`): оно живёт ровно
 * столько, сколько дровер открыт, тогда как сам `UiDrawer` после закрытия
 * остаётся смонтированным (`useOverlay` снимает оверлей по событию
 * `after:leave`, которого `UDrawer` не эмитит).
 *
 * @param path Относительный путь сущности; пустое значение — не публиковать.
 */
export function usePublishOpenEntityPath(
  path: MaybeRefOrGetter<string | undefined>,
): void {
  const { setOpenEntityPath, clearOpenEntityPath } = useOpenEntityPath();

  const publisherId = useId();

  watch(
    () => toValue(path),
    (value) => {
      if (!value) {
        clearOpenEntityPath(publisherId);

        return;
      }

      setOpenEntityPath(publisherId, value);
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    clearOpenEntityPath(publisherId);
  });
}
