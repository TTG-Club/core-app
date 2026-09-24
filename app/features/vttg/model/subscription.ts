import type { ButtonProps } from '@nuxt/ui';

import type {
  FaqItem,
  VttgHeading,
  VttgHighlight,
  VttgSubscriptionPerkGroup,
} from './types';

import { VTTG_LANDING_PATH } from './passwordReset';

/** Адрес страницы подписки. Пока страница видна только администраторам. */
export const VTTG_SUBSCRIPTION_PATH = '/vttg/subscription';

/** Подпись пункта меню. */
export const VTTG_SUBSCRIPTION_NAVIGATION_LABEL = 'Подписка';

/** Заголовок и описание страницы для поисковиков и вкладки браузера. */
export const VTTG_SUBSCRIPTION_SEO = {
  title: 'Подписка — Virtual TTG Club',
  description:
    'Подписка TTG Club открывает привилегии на сайте и в виртуальном столе.',
  /** Страница пока закрыта для всех, кроме администраторов, — в поиск ей рано. */
  robots: 'noindex, nofollow',
} as const;

/** Цена подписки. Число и знак валюты раздельно: на карточке цены они разного цвета. */
export const VTTG_SUBSCRIPTION_PRICE = {
  amount: '300',
  currency: '₽',
  cycle: '/ месяц',
  perDay: '≈ 10 ₽ в день',
} as const;

/** Якорь списка привилегий, к которому прокручивает кнопка первого экрана. */
export const VTTG_SUBSCRIPTION_PERKS_SECTION_ID = 'subscription-perks';

/** Первый экран страницы подписки. */
export const VTTG_SUBSCRIPTION_HERO = {
  badge: 'Скоро на TTG Club',
  icon: 'tabler:crown',
  titleLead: 'Играйте бесплатно.',
  titleAccent: 'Играйте с размахом.',
  description:
    'Всё основное на TTG Club и в Virtual TTG Club остаётся бесплатным. Подписка добавляет привилегии на сайте и в виртуальном столе — и помогает проекту расти.',
  priceCaption: VTTG_SUBSCRIPTION_NAVIGATION_LABEL,
  priceHint: 'Меньше, чем набор кубиков. Отменить можно в любой момент.',
} as const;

/** Кнопка первого экрана «к привилегиям». */
export const VTTG_SUBSCRIPTION_PERKS_BUTTON: ButtonProps = {
  label: 'Что даёт подписка',
  icon: 'tabler:arrow-down',
  size: 'xl',
  color: 'primary',
};

/** Кнопка оформления: оплата ещё не подключена, поэтому кнопка выключена. */
export const VTTG_SUBSCRIBE_BUTTON: ButtonProps = {
  label: 'Оформить — скоро',
  icon: VTTG_SUBSCRIPTION_HERO.icon,
  size: 'xl',
  color: 'neutral',
  variant: 'subtle',
  disabled: true,
};

/** Короткие факты на первом экране. */
export const VTTG_SUBSCRIPTION_FACTS: Array<VttgHighlight> = [
  {
    icon: 'tabler:world',
    title: 'Сайт и стол',
    description: 'Одна подписка на оба',
  },
  {
    icon: 'tabler:lock-open',
    title: 'Без ловушек',
    description: 'Базовое остаётся бесплатным',
  },
  {
    icon: 'tabler:calendar-repeat',
    title: 'Помесячно',
    description: 'Без долгих обязательств',
  },
];

export const VTTG_SUBSCRIPTION_PERKS_HEADING: VttgHeading = {
  title: 'Что даёт подписка',
  subtitle:
    'Привилегии работают в двух местах сразу: в виртуальном столе и на сайте ttg.club.',
};

/**
 * Привилегии подписки, разложенные по месту действия. Числа лимитов — зеркало
 * бэкендов: листы — `CharacterSheetLimits` в core-api, игроки за столом и
 * поднятия игры — `GameService` в find-game-api, туннель — `TIERS` в
 * tunnel-service. Поменялись там — поправить здесь.
 */
export const VTTG_SUBSCRIPTION_PERK_GROUPS: Array<VttgSubscriptionPerkGroup> = [
  {
    title: 'В виртуальном столе',
    description: 'Весь контент ttg.club и игра без настройки сети.',
    icon: 'tabler:device-desktop',
    perks: [
      {
        icon: 'tabler:books',
        title: 'Полный компендиум',
        description:
          'Все заклинания, существа, предметы и классы с ttg.club, а не только SRD. В столе они обновляются сами.',
      },
      {
        icon: 'tabler:world-share',
        title: 'Подключение без белого IP',
        description:
          'Стол получает постоянный адрес вида имя-мир.play.ttg.club: игроки заходят по ссылке без белого IP, проброса портов и настройки роутера.',
        limit: {
          label: 'Миров, запущенных одновременно',
          base: null,
          subscriber: 5,
        },
      },
    ],
  },
  {
    title: 'На сайте',
    description: 'Больше места для персонажей и своих игр.',
    icon: 'tabler:world',
    perks: [
      {
        icon: 'tabler:id-badge-2',
        title: 'Больше листов персонажа',
        description:
          'До 40 сохранённых чужих листов вместо 16, а в истории удалённых хранится 30 листов вместо 20.',
        limit: { label: 'Активных листов', base: 8, subscriber: 20 },
      },
      {
        icon: 'tabler:users-group',
        title: 'Больше игроков за столом',
        description:
          'В поиске игр можно собрать большой стол или несколько групп в одной игре.',
        limit: { label: 'Игроков в одной игре', base: 5, subscriber: 15 },
      },
      {
        icon: 'tabler:arrow-big-up-lines',
        title: 'Чаще наверху списка',
        description:
          'Поднимайте свою игру в поиске чаще, чтобы её быстрее заметили игроки.',
        limit: { label: 'Поднятий игры в сутки', base: 1, subscriber: 3 },
      },
      {
        icon: 'tabler:rosette',
        title: 'Значок подписчика',
        description: 'Отметка подписчика в вашем профиле — своих видно сразу.',
      },
    ],
  },
];

/** Подписи столбцов сравнения лимитов на карточке привилегии. */
export const VTTG_SUBSCRIPTION_LIMIT_LABELS = {
  base: 'Бесплатно',
  subscriber: 'С подпиской',
  /** Вместо числа, когда без подписки возможности нет совсем. */
  unavailable: 'Нет',
} as const;

export const VTTG_SUBSCRIPTION_FAQ_HEADING: VttgHeading = {
  title: 'Частые вопросы',
};

export const VTTG_SUBSCRIPTION_FAQ_ITEMS: Array<FaqItem> = [
  {
    label: 'Что останется бесплатным?',
    content:
      'Справочник правил, инструменты сайта, поиск игр и сам виртуальный стол со всеми функциями. Подписка ничего не отнимает у бесплатных возможностей — только добавляет.',
  },
  {
    label: 'Одна подписка работает и на сайте, и в столе?',
    content:
      'Да. Подписка привязана к аккаунту TTG Club: войдите в стол под тем же аккаунтом, и привилегии включатся сами.',
  },
  {
    label: 'Что будет, если не продлить подписку?',
    content:
      'Аккаунт и всё, что вы создали, останутся на месте: листы сверх базового лимита не удалятся, просто новые можно будет создать, когда их станет меньше лимита. Выключатся только привилегии подписки — например, в компендиуме стола снова будет только SRD.',
  },
  {
    label: 'Зачем адрес play.ttg.club, если стол и так запускается?',
    content:
      'Без него игроки подключаются к компьютеру мастера напрямую — для этого нужен белый IP и проброс портов на роутере. С подпиской стол сам выходит в сеть по постоянному адресу, и игрокам достаточно ссылки.',
  },
  {
    label: 'Можно ли отменить подписку?',
    content:
      'Да, в любой момент. Подписка продолжит работать до конца оплаченного месяца.',
  },
  {
    label: 'Когда появится оплата?',
    content:
      'Мы готовим подключение оплаты. Как только оно будет готово, кнопка «Оформить» на этой странице заработает.',
  },
];

/** Финальный призыв внизу страницы. */
export const VTTG_SUBSCRIPTION_CTA = {
  title: 'Поддержите проект — и получите больше',
  description:
    'Каждая подписка помогает развивать TTG Club и Virtual TTG Club: новые функции, контент и сервера.',
  links: [
    { ...VTTG_SUBSCRIBE_BUTTON, color: 'primary', variant: 'solid' },
    {
      label: 'О виртуальном столе',
      trailingIcon: 'tabler:arrow-right',
      to: VTTG_LANDING_PATH,
      size: 'xl',
      color: 'neutral',
      variant: 'ghost',
    },
  ] satisfies Array<ButtonProps>,
} as const;
