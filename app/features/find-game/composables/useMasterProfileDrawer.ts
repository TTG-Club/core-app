import { MasterProfileDrawer } from '../ui';

/**
 * Профиль мастера рядом с объявлением.
 *
 * Окно одно на страницу и создаётся при первом открытии: имя мастера стоит в
 * каждой карточке каталога, и заводить дровер под каждую было бы расточительно.
 */
export function useMasterProfileDrawer() {
  const overlay = useOverlay();

  let drawer: ReturnType<typeof overlay.create> | undefined;

  /**
   * Открывает профиль мастера.
   *
   * @param masterId Идентификатор мастера.
   * @param masterName Отображаемое имя: сервис поиска игр знает только
   *   идентификатор, имя приходит из core-api.
   */
  function open(masterId: string, masterName: string): void {
    drawer ??= overlay.create(MasterProfileDrawer, {
      props: {
        masterId,
        masterName,
        onClose: () => drawer?.close(),
      },
    });

    drawer.open({
      masterId,
      masterName,
      onClose: () => drawer?.close(),
    });
  }

  return { open };
}
