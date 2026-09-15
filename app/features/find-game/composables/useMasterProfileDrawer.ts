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
   * Открывает профиль мастера. Имя дровер находит по идентификатору сам:
   * если оно ещё грузится, то появится, когда приедет.
   *
   * @param masterId Идентификатор мастера.
   */
  function open(masterId: string): void {
    drawer ??= overlay.create(MasterProfileDrawer, {
      props: {
        masterId,
        onClose: () => drawer?.close(),
      },
    });

    drawer.open({
      masterId,
      onClose: () => drawer?.close(),
    });
  }

  return { open };
}
