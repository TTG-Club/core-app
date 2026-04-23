import type { JSONContent } from '@tiptap/core';

import type { AbilityKey } from '~/shared/types';
import type { EditorBaseInfoState } from '~ui/editor';

export interface FeatCreate extends EditorBaseInfoState {
  description: JSONContent; // описание маркап
  category: string | undefined; // категория (общая, боевые стили, эпическая)
  prerequisite: JSONContent; // требования для получения черты
  repeatability: boolean; // повторяемость
  abilities: Array<AbilityKey>; // улучшаемые характеристики
}
