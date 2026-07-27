import type { Role } from '~/shared/types';

/** Инструмент в блоке «Инструменты» на главной */
export interface HomeTool {
  label: string;

  /** Иконка Tabler */
  icon: string;

  /** Маршрут инструмента-ссылки */
  to?: string;

  /** Идентификатор действия для инструментов без маршрута */
  action?: 'open-multiclass';

  /** Пункт виден только пользователям с одной из ролей (как в меню сайдбара) */
  roles?: Array<Role>;
}
