/**
 * Константы для страницы профиля пользователя
 */

/**
 * Типы табов профиля
 */
export const ProfileTabs = {
  GENERAL: 'general',
  SECURITY: 'security',
  STATISTICS: 'statistics',
  CONNECTIONS: 'connections',
} as const;

/**
 * Элементы табов для навигации
 */
export const ProfileTabItems = [
  {
    value: ProfileTabs.GENERAL,
    label: 'Общие',
    icon: 'i-fluent-person-24-regular',
  },
  {
    value: ProfileTabs.SECURITY,
    label: 'Безопасность',
    icon: 'i-fluent-shield-24-regular',
  },
  {
    value: ProfileTabs.STATISTICS,
    label: 'Статистика',
    icon: 'i-fluent-data-bar-vertical-24-regular',
  },
  {
    value: ProfileTabs.CONNECTIONS,
    label: 'Подключения',
    icon: 'i-fluent-plug-connected-24-regular',
  },
];

/**
 * Доступные социальные сети для подключения
 */
export const SocialConnections = [
  {
    id: 'discord',
    name: 'Discord',
    icon: 'i-ttg-discord',
    color: 'text-[#5865F2]',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'i-ttg-telegram',
    color: 'text-[#0088cc]',
  },
  {
    id: 'vk',
    name: 'VK',
    icon: 'i-ttg-vk',
    color: 'text-[#0077FF]',
  },
];

/**
 * Типы статистики пользователя
 */
export const StatisticTypes = [
  {
    key: 'characters_created',
    label: 'Создано персонажей',
    icon: 'i-fluent-person-add-24-regular',
  },
  {
    key: 'spells_viewed',
    label: 'Просмотрено заклинаний',
    icon: 'i-fluent-sparkle-24-regular',
  },
  {
    key: 'items_viewed',
    label: 'Просмотрено предметов',
    icon: 'i-fluent-cube-24-regular',
  },
  {
    key: 'bestiary_viewed',
    label: 'Просмотрено существ',
    icon: 'i-fluent-animal-cat-24-regular',
  },
];
