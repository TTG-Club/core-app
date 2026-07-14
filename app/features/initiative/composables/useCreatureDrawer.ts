import { CreatureDrawer } from '~bestiary/drawer';

/**
 * Открывает статблок существа в overlay-дровере, не уходя со страницы.
 * Паттерн как в `LinkPreview`/`MarkupSectionLink`: создаём overlay по
 * компоненту `CreatureDrawer` и открываем его по клику.
 */
export function useCreatureDrawer() {
  const overlay = useOverlay();

  /**
   * Открывает дровер существа по его слагу из бестиария.
   * @param url Слаг существа (`participant.creatureUrl`).
   */
  function openCreature(url: string): void {
    const drawer = overlay.create(CreatureDrawer, {
      props: {
        url,
        onClose: () => drawer.close(),
      },
      destroyOnClose: true,
    });

    drawer.open();
  }

  return { openCreature };
}
