import { PlayerProfileDrawer } from '../ui';

/**
 * Профиль игрока рядом с составом игры.
 *
 * Окно одно на страницу и создаётся при первом открытии: имя игрока стоит в
 * каждой карточке состава и в каждой заявке, и заводить дровер под каждую
 * было бы расточительно.
 */
export function usePlayerProfileDrawer() {
  const overlay = useOverlay();

  let drawer: ReturnType<typeof overlay.create> | undefined;

  /**
   * Открывает профиль игрока.
   *
   * @param playerId Идентификатор игрока.
   * @param playerName Отображаемое имя: сервис поиска игр знает только
   *   идентификатор, имя приходит из core-api.
   */
  function open(playerId: string, playerName: string): void {
    drawer ??= overlay.create(PlayerProfileDrawer, {
      props: {
        playerId,
        playerName,
        onClose: () => drawer?.close(),
      },
    });

    drawer.open({
      playerId,
      playerName,
      onClose: () => drawer?.close(),
    });
  }

  return { open };
}
