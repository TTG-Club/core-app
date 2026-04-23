import type { JSONContent } from '@tiptap/core';

import type { AbilityKey } from '~/shared/types';
import type { EditorBaseInfoState } from '~ui/editor';

export interface BackgroundCreate extends EditorBaseInfoState {
  description: JSONContent; // описание маркап
  abilityScores: Array<AbilityKey>; // характеристики
  featUrl: string | undefined; // url черты
  featSuffix: string | undefined; // суффикс черты
  skillsProficiencies: Array<string>; // навыки
  toolProficiency: string; // владение инструментами
  equipment: string; // снаряжение
}
