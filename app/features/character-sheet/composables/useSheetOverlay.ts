/** Создание окна листа: та же подпись, что у `useOverlay().create`. */
type CreateOverlay = ReturnType<typeof useOverlay>['create'];

/**
 * Окна листа персонажа (модалки и дроверы), которые убираются вместе с
 * компонентом, создавшим их. Nuxt UI держит все созданные окна в одном
 * общем списке и сам оттуда их не убирает: каждый открытый лист оставлял бы
 * в нём десятки записей навсегда, а листов на странице может быть несколько
 * и открывают их много раз.
 *
 * Побочные действия: при уходе компонента его окна удаляются из общего
 * списка Nuxt UI; открытое в этот момент окно закрывается вместе с листом
 * и уходит из списка, когда доиграет закрытие.
 *
 * @returns создание окна, как у `useOverlay`.
 */
export function useSheetOverlay(): { create: CreateOverlay } {
  const overlay = useOverlay();

  /** Окна, созданные этим компонентом. */
  const createdIds = new Set<symbol>();

  /**
   * Создаёт окно и запоминает его, чтобы убрать вместе с компонентом.
   * @param component компонент окна.
   * @param options пропсы и настройки окна, как у `useOverlay().create`.
   * @returns созданное окно: его открывают, закрывают и правят как обычно.
   */
  const create: CreateOverlay = (component, options) => {
    const instance = overlay.create(component, options);

    createdIds.add(instance.id);

    return instance;
  };

  onScopeDispose(() => {
    // С конца: удаление не сдвигает ещё не просмотренные записи
    for (let i = overlay.overlays.length - 1; i >= 0; i--) {
      const created = overlay.overlays[i];

      if (!created || !createdIds.has(created.id)) {
        continue;
      }

      if (created.isMounted) {
        // Окно ещё на экране: закрываем, а запись Nuxt UI уберёт сам, когда
        // доиграет закрытие, — иначе он не нашёл бы окно, которое закрывает
        created.destroyOnClose = true;
        overlay.close(created.id);
      } else {
        overlay.overlays.splice(i, 1);
      }
    }
  });

  return { create };
}
