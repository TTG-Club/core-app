import type { HomeTool } from './types';

import { CHARACTER_SHEET_ROUTE } from '~character-sheet/model';
import {
  INITIATIVE_TOOL_ROUTE,
  INITIATIVE_TOOL_TITLE,
} from '~initiative/model';

/** Инструменты блока на главной; порядок массива = порядок отображения */
export const HOME_TOOLS: Array<HomeTool> = [
  {
    label: 'Токенатор',
    icon: 'tabler:photo-circle',
    to: '/tokenator',
  },
  {
    label: INITIATIVE_TOOL_TITLE,
    icon: 'tabler:swords',
    to: INITIATIVE_TOOL_ROUTE,
  },
  {
    label: 'Создание мультикласса',
    icon: 'tabler:layers-intersect',
    action: 'open-multiclass',
  },
  {
    label: 'Калькулятор характеристик',
    icon: 'tabler:calculator',
    to: '/calculators/abilities',
  },
  {
    label: 'Лист персонажа',
    icon: 'tabler:id',
    to: CHARACTER_SHEET_ROUTE,
  },
];
