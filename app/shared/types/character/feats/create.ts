import type { EditorBaseInfoState } from '~ui/editor';

import type { AbilityKey } from '~/shared/types';

export interface FeatCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  category: string | undefined; // категория (общая, боевые стили, эпическая)
  prerequisite: string; // требования для получения черты
  repeatability: boolean; // повторяемость
  abilities: Array<AbilityKey>; // улучшаемые характеристики
}
