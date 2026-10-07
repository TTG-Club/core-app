import type { HomeActivityTab } from './types';

/** Вкладка, открытая по умолчанию — живая лента обсуждений */
export const HOME_ACTIVITY_TAB_DEFAULT: HomeActivityTab = 'comments';

/**
 * Вкладки объединённого блока «жизнь сайта»: обсуждения читателей и правки
 * каталога. Порядок массива = порядок вкладок.
 */
export const HOME_ACTIVITY_TABS: Array<{
  value: HomeActivityTab;
  label: string;
  icon: string;
}> = [
  {
    value: 'comments',
    label: 'Обсуждения',
    icon: 'tabler:message-circle',
  },
  {
    value: 'changes',
    label: 'Обновления',
    icon: 'tabler:history',
  },
];
