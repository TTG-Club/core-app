import type { AbilityKey } from '~/shared/types';
import type { ActiveEffect } from '~active-effects/model';
import type { EditorBaseInfoState } from '~ui/editor';

import type { FeatMechanics, FeatPrerequisiteDetails } from './mechanics';
import type { FeatEditorRows } from './rows';

export interface FeatCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  category: string | undefined; // категория (общая, боевые стили, эпическая)
  prerequisite: string; // требования для получения черты как в книге
  prerequisiteDetails: FeatPrerequisiteDetails | undefined; // требования в разобранном виде
  repeatability: boolean; // повторяемость
  /**
   * Улучшаемые характеристики. Плоская проекция для фильтра «Характеристика»:
   * core-api пересобирает её из `mechanics.abilityBonuses` при сохранении и в
   * теле запроса больше не принимает, поэтому перед отправкой поле обнуляется.
   * В состоянии остаётся, чтобы читались снимки ревизий, снятые до этой правки.
   */
  abilities: Array<AbilityKey> | undefined;
  mechanics: FeatMechanics | undefined; // механика влияния на лист персонажа

  /**
   * Активные эффекты черты в вокабуляре VTTG — та же модель, что у заклинаний и
   * магических предметов. Рядом с `mechanics`, а не внутри неё: механика
   * описывает дары, которые лист проставляет сам (владения, повышения, выборы),
   * а эффект меняет числа готовой формулой и уезжает на виртуальный стол как
   * есть.
   */
  activeEffects: Array<ActiveEffect>;

  /**
   * Строки редактора механики: форма правит их, а не блоки механики. Перед
   * отправкой из них пересобираются `mechanics` и `prerequisiteDetails`, а само
   * поле обнуляется — в теле запроса ему места нет.
   */
  editorRows: FeatEditorRows | undefined;
}
