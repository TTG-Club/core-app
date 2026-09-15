import { PlayerProfileDrawer } from '../ui';

/**
 * Профиль игрока рядом с составом игры.
 *
 * Окно создаётся при первом открытии и дальше переиспользуется тем
 * компонентом, который вызвал composable: имя игрока стоит в каждой карточке
 * состава и в каждой заявке, и заводить дровер заранее под каждую было бы
 * расточительно.
 */
export function usePlayerProfileDrawer() {
  const overlay = useOverlay();

  let drawer: ReturnType<typeof overlay.create> | undefined;

  /**
   * Открывает профиль игрока. Имя дровер находит по идентификатору сам:
   * если оно ещё грузится, то появится, когда приедет.
   *
   * @param playerId Идентификатор игрока.
   */
  function open(playerId: string): void {
    drawer ??= overlay.create(PlayerProfileDrawer, {
      props: {
        playerId,
        onClose: () => drawer?.close(),
      },
    });

    drawer.open({
      playerId,
      onClose: () => drawer?.close(),
    });
  }

  return { open };
}
