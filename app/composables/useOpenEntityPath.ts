/**
 * Хранит относительный путь сущности, открытой в overlay-drawer-е
 * (стандартный режим просмотра).
 *
 * Нужен баг-репорту: в стандартном режиме деталь открывается в drawer
 * через overlay и НЕ меняет маршрут (URL остаётся `/feats`), поэтому
 * `route.query.detail` пуст. Drawer публикует сюда свой путь
 * (например, `/feats/unarmed-fighting`), а `useBugReport` берёт его
 * как фолбэк, чтобы зафиксировать точный URL сущности.
 *
 * В широком режиме (Wide Mode) деталь рендерит `UiDetailPane` и пишет
 * `query.detail`, поэтому этот канал не задействуется.
 *
 * Нейтральный composable уровня приложения: не зависит от фич, чтобы
 * `~ui/drawer` мог им пользоваться без нарушения слоёв.
 */
export function useOpenEntityPath() {
  const openEntityPath = useState<string>('open-entity-path', () => '');

  /** Сохраняет относительный путь открытой сущности. */
  function setOpenEntityPath(path: string): void {
    openEntityPath.value = path;
  }

  /** Сбрасывает путь (при закрытии или размонтировании drawer-а). */
  function clearOpenEntityPath(): void {
    openEntityPath.value = '';
  }

  return {
    openEntityPath: readonly(openEntityPath),
    setOpenEntityPath,
    clearOpenEntityPath,
  };
}
