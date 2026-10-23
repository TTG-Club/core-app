import { AdminUserDrawer } from '../ui';

/**
 * Профиль пользователя в дровере по логину.
 *
 * Окно создаётся при первом открытии и дальше переиспользуется: логин стоит
 * в каждой строке списка, и заводить дровер под каждую было бы расточительно.
 */
export function useAdminUserDrawer() {
  const overlay = useOverlay();

  let drawer: ReturnType<typeof overlay.create> | undefined;

  /**
   * Открывает профиль пользователя.
   *
   * @param username Логин пользователя.
   */
  function open(username: string): void {
    drawer ??= overlay.create(AdminUserDrawer, {
      props: {
        username,
        onClose: () => drawer?.close(),
      },
    });

    drawer.open({
      username,
      onClose: () => drawer?.close(),
    });
  }

  return { open };
}
