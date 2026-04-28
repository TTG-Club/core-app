import type { ButtonProps } from '@nuxt/ui';

export interface CarouselCard {
  title: string;
  description: string;
  img: string;
  icon: string;
}

export interface FeatureItem {
  badge: string;
  badgeVariant: 'new' | 'beta' | 'soon';
  title: string;
  description: string;
  img: string;
  icon: string;
}

export interface FaqItem {
  label: string;
  content: string;
}

export const VIDEO_EXTENSIONS = ['.webm', '.mp4'] as const;

export type VideoExtension = (typeof VIDEO_EXTENSIONS)[number];

export const VTTG_SEO = {
  title: 'Virtual TTG Club — Виртуальный стол для D&D 5e',
  description:
    'VTTG — онлайн-платформа для игры в D&D 5e. Карты, броски кубиков, интеграция с ttg.club.',
} as const;

export const VTTG_HERO_BACKGROUND = '/s3/vttgw/main-bg.png';

export const VTTG_HERO_LINKS: ButtonProps[] = [
  {
    label: 'Поддержать проект',
    icon: 'tabler:heart',
    size: 'xl',
    color: 'primary',
  },
];

export const CAROUSEL_CARDS: CarouselCard[] = [
  {
    title: 'Интерактивные карты',
    description:
      'Создавайте подземелья, города и дикие земли прямо в браузере. Слои, туман войны, маркеры — всё под рукой.',
    img: '/s3/vttgw/slides/image-1.png',
    icon: 'tabler:map',
  },
  {
    title: 'Интеграция с ttg.club',
    description:
      'Все заклинания, существа и предметы из базы ttg.club доступны прямо во время игры — без переключения вкладок.',
    img: '/s3/vttgw/slides/image-2.png',
    icon: 'tabler:book-2',
  },
  {
    title: 'Управление персонажами',
    description:
      'Листы персонажей синхронизируются в реальном времени. HP, ресурсы, инвентарь — всё обновляется автоматически.',
    img: '/s3/vttgw/slides/image-3.png',
    icon: 'tabler:user-shield',
  },
];

export const FEATURE_ITEMS: FeatureItem[] = [
  {
    badge: 'Мощно',
    badgeVariant: 'new',
    title: 'Редактор стен',
    description:
      'Удобный инструмент для создания геометрии комнат, настройки дверей и невидимых препятствий.',
    img: '/s3/vttgw/blocks/walls.webm',
    icon: 'tabler:wall',
  },
  {
    badge: 'Атмосферно',
    badgeVariant: 'new',
    title: 'Система освещения',
    description:
      'Динамические источники света, направленное освещение и учёт радиуса видимости.',
    img: '/s3/vttgw/blocks/lighting.webm',
    icon: 'tabler:bulb',
  },
  {
    badge: 'Тактика',
    badgeVariant: 'new',
    title: 'Туман войны',
    description:
      'Автоматическое скрытие неизведанных областей. Игроки видят только то, что видят их персонажи.',
    img: '/s3/vttgw/blocks/fog.webm',
    icon: 'tabler:cloud-fog',
  },
  {
    badge: 'Удобно',
    badgeVariant: 'new',
    title: 'Токены',
    description:
      'Свободное размещение, масштабирование, привязка к сетке, статусы и отслеживание здоровья.',
    img: '/s3/vttgw/blocks/tokens.webm',
    icon: 'tabler:chess-knight',
  },
  {
    badge: 'Синхронизация',
    badgeVariant: 'new',
    title: 'Лист персонажа',
    description:
      'Полная интеграция с базой ttg.club, автоматический подсчет характеристик и броски навыков.',
    img: '/s3/vttgw/blocks/list.webm',
    icon: 'tabler:clipboard-list',
  },
  {
    badge: 'Автоматизация',
    badgeVariant: 'new',
    title: 'Трекер инициативы',
    description:
      'Удобное отслеживание ходов, передача инициативы, начало и конец боя.',
    img: '/s3/vttgw/blocks/tracker.webm',
    icon: 'tabler:list-numbers',
  },
  {
    badge: 'Рандом',
    badgeVariant: 'new',
    title: 'Кубики',
    description:
      '3D-кубики с физикой, история бросков, скрытые броски Мастера и поддержка сложных формул.',
    img: '/s3/vttgw/blocks/dice.webm',
    icon: 'tabler:dice-5',
  },
  {
    badge: 'Масштаб',
    badgeVariant: 'new',
    title: 'Карта и сцены',
    description:
      'Бесшовный переход между локациями, поддержка анимации, слоев и видео-фонов.',
    img: '/s3/vttgw/blocks/scenes.webm',
    icon: 'tabler:map-2',
  },
  {
    badge: 'Погружение',
    badgeVariant: 'new',
    title: 'Визуальные эффекты',
    description:
      'Добавьте атмосферы вашей сцене с помощью динамической погоды, частиц, заклинаний и фильтров.',
    img: '/s3/vttgw/blocks/effects.webm',
    icon: 'tabler:wand',
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    label: 'Нужно ли устанавливать что-то на компьютер?',
    content:
      'Да, но только Мастеру игры. Вы устанавливаете приложение на свой компьютер — оно выступает в роли локального сервера и хранит все карты, миры и ассеты, обеспечивая полный контроль над вашими данными. Игрокам же ничего скачивать не нужно: они просто переходят по вашей ссылке-приглашению и играют прямо в браузере.',
  },
  {
    label: 'Сколько это будет стоить?',
    content:
      'Базовая версия со всеми SRD данными по D&D 5.5 будет полностью БЕСПЛАТНОЙ.',
  },
  {
    label: 'Как работает интеграция с ttg.club?',
    content:
      'В дальнейшем появится возможность оформить подписку, благодаря которой вся база данных сайта ttg.club будет доступна вам прямо внутри приложения VTTG.',
  },
  {
    label: 'Можно ли использовать свои изображения для карт?',
    content:
      'Да. Карты поддерживают загрузку файлов в форматах PNG, JPEG, WebP, а также видеоформатов WEBM и MP4. Вы можете использовать в том числе и полностью анимированные карты.',
  },
  {
    label: 'Будет ли возможность делать свои модули?',
    content:
      'Да, это уже реализовано в альфа-режиме. Возможно, пока еще не везде есть полноценное API, но вы уже можете создавать и подключать собственные внешние модули.',
  },
];
