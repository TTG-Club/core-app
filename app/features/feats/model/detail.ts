import type { SourceResponse } from '~/shared/types';

import type { FeatPrerequisiteSource } from './prerequisite';

export interface FeatDetailResponse {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  category: string;

  /**
   * Условие строкой, как его набирали до разбора по полям. Карточка показывает
   * его, только пока `prerequisiteDetails` пусты: как только требования
   * разобраны, условие собирается из них.
   */
  prerequisite: string;

  /**
   * Требования в разобранном виде — из них собирается условие на карточке.
   * Поля приходят разреженно: пустые из ответа выброшены.
   */
  prerequisiteDetails?: FeatPrerequisiteSource;

  source: SourceResponse;
  description: Array<string>;
  backgrounds?: Array<FeatDetailBackgroundItem>;

  // Механику, выдаваемые заклинания (`grantedSpells`) и таблицу списка
  // (`spellListSpells`) деталь тоже отдаёт, но страница их не показывает: всё
  // это уже описано текстом самой черты. Листу персонажа они нужны, и он
  // разбирает их своей схемой.

  updatedAt: string;
}

export interface FeatDetailBackgroundItem {
  url: string;
  name: string;
}
