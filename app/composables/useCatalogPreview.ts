import { ItemDrawer } from '~items/drawer';
import { MagicItemDrawer } from '~magic-items/drawer';

/**
 * Раздел каталога, карточку которого показывает предпросмотр. Значение — первый
 * сегмент адреса раздела на сайте: `/items/leather-armor`.
 */
export type CatalogPreviewSection = 'items' | 'magic-items';

/**
 * Дровер карточки: слаг он получает снаружи и грузит запись сам. Тип взят у
 * готового дровера — у всех разделов он одинаков: слаг и событие закрытия.
 */
type PreviewDrawer = typeof ItemDrawer;

/** Дровер каждого раздела — по нему и открывается предпросмотр. */
const PREVIEW_DRAWERS: Record<CatalogPreviewSection, PreviewDrawer> = {
  'items': ItemDrawer,
  'magic-items': MagicItemDrawer,
};

/**
 * Предпросмотр карточки каталога дровером поверх текущей страницы.
 *
 * Нужен там, где запись выбирают или упоминают, а уходить со страницы ради её
 * описания нельзя: из формы существа переход на карточку предмета потерял бы
 * несохранённую правку, а в карточке существа — увёл бы из бестиария.
 */
export function useCatalogPreview() {
  const overlay = useOverlay();

  /** Управление заведённым дровером: его отдаёт `overlay.create`. */
  type PreviewDrawerInstance = ReturnType<typeof overlay.create<PreviewDrawer>>;

  /**
   * Дроверы разделов, которые уже открывали. Дровер заводится один на раздел и
   * переоткрывается с новым слагом: `UDrawer` не сообщает о конце анимации
   * закрытия, поэтому `destroyOnClose` его не уносит — каждое открытие своим
   * экземпляром копило бы их в памяти.
   */
  const drawers = new Map<CatalogPreviewSection, PreviewDrawerInstance>();

  /**
   * Заводит дровер раздела. Слаг остаётся пустым: его передаёт открытие.
   *
   * @param section - раздел каталога
   */
  function createDrawer(section: CatalogPreviewSection): PreviewDrawerInstance {
    // Дровер закрывает сам себя: колбэк ссылается на ещё не присвоенную
    // переменную, но зовут его позже — к тому времени она уже заполнена
    const drawer: PreviewDrawerInstance = overlay.create(
      PREVIEW_DRAWERS[section],
      {
        props: {
          url: '',
          onClose: () => {
            drawer.close();
          },
        },
      },
    );

    return drawer;
  }

  /**
   * Открывает карточку раздела дровером.
   *
   * @param section - раздел каталога
   * @param url - слаг записи; пустой открывать нечем
   */
  function openPreview(section: CatalogPreviewSection, url: string): void {
    if (!url) {
      return;
    }

    const drawer = drawers.get(section) ?? createDrawer(section);

    drawers.set(section, drawer);

    drawer.open({ url });
  }

  return {
    openPreview,
  };
}
