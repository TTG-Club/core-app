import type { AbilityKey } from '~/shared/types';
import type { EditorBaseInfoState } from '~ui/editor';

import type { FeatMechanics, FeatPrerequisiteDetails } from './mechanics';

export interface FeatCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  category: string | undefined; // категория (общая, боевые стили, эпическая)
  prerequisite: string; // требования для получения черты как в книге
  prerequisiteDetails: FeatPrerequisiteDetails | undefined; // требования в разобранном виде
  repeatability: boolean; // повторяемость
  /**
   * Улучшаемые характеристики. Поле в форме не редактируется: core-api
   * пересобирает его из `mechanics.abilityBonuses` при сохранении и держит
   * как плоскую проекцию для фильтра «Характеристика». В состоянии остаётся,
   * чтобы у черт без заполненной механики значение не потерялось.
   */
  abilities: Array<AbilityKey>;
  mechanics: FeatMechanics | undefined; // механика влияния на лист персонажа
}
