import type { HomeMapPlacement, HomeMapPoint, HomeMapSize } from './types';

/** Первая строка заголовка главной — светлая, несёт суть проекта */
export const HOME_HERO_TITLE = 'Справочник и инструменты D&D 2024';

/** Вторая строка заголовка — приглушённая, про происхождение проекта */
export const HOME_HERO_SUBTITLE = 'Создан сообществом — для сообщества';

/** Роут настройки фона шапки: своя картинка или видео вместо карты */
export const HOME_HERO_API_URL = '/api/home/hero';

/** Ключ `useAsyncData` настройки фона — общий у шапки и админки */
export const HOME_HERO_DATA_KEY = 'home-hero-settings';

/* --- Живой фон карты ---------------------------------------------------- */

/**
 * Когда на карте шапки едет повозка и дымят трубы: устройство с мышью и без
 * системной просьбы «меньше движения». На телефонах и планшетах живого фона
 * нет — там он греет слабую графику и садит батарею.
 */
export const HOME_HERO_MOTION_QUERY =
  '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)';

/**
 * Ключ localStorage: посетитель выключил повозку и дым кнопкой в углу шапки.
 * По умолчанию живой фон включён.
 */
export const HOME_HERO_MOTION_STORAGE_KEY = 'home:hero-motion';

export const HOME_HERO_MOTION_PLAY_ICON = 'tabler:player-play-filled';

export const HOME_HERO_MOTION_PAUSE_ICON = 'tabler:player-pause-filled';

export const HOME_HERO_MOTION_PLAY_LABEL = 'Запустить анимацию фона';

export const HOME_HERO_MOTION_PAUSE_LABEL = 'Остановить анимацию фона';

/** Холст карты — `viewBox` рисунков `public/img/home/hero-map-*.svg` */
export const HOME_HERO_MAP_VIEWBOX: HomeMapPoint & HomeMapSize = {
  x: 0,
  y: -100,
  width: 3200,
  height: 1100,
};

/** Дорога повозки: идёт между колеями, начало и конец скрыты за холстом */
export const HOME_HERO_WAGON_ROUTE =
  'M-130 504C120 495 350 470 550 475S800 494 930 487S1160 466 1300 471S1510 487 1630 484S1900 459 2010 462S2200 473 2330 470S2530 467 2660 469S2920 499 3080 494S3260 490 3330 486';

/**
 * Шаг ключевых кадров вдоль дороги, единицы карты. Между кадрами фигура идёт
 * по прямой, а на таком шаге хорда от кривой дороги не отходит и на пиксель.
 */
export const HOME_HERO_ROUTE_SAMPLE_STEP = 20;

/** Один проезд повозки по дороге, мс */
export const HOME_HERO_WAGON_LAP = 65_000;

/** Лошадь опережает телегу на длину упряжи, единицы карты */
export const HOME_HERO_HORSE_LEAD = 74;

/** Телега: слой с запасом под оглобли и обводку */
export const HOME_HERO_WAGON_SIZE: HomeMapSize = { width: 132, height: 52 };

export const HOME_HERO_HORSE_SIZE: HomeMapSize = { width: 72, height: 24 };

/** Где телега стоит, пока анимация выключена, — там же, где на исходной карте */
export const HOME_HERO_WAGON_PARKING: HomeMapPlacement = {
  x: 1150,
  y: 486,
  angle: -4,
};

export const HOME_HERO_HORSE_PARKING: HomeMapPlacement = {
  x: 1223.82,
  y: 480.84,
  angle: -4,
};

/** Устья труб в координатах карты: ветер не зависит от поворота крыши */
export const HOME_HERO_CHIMNEYS: Array<HomeMapPoint> = [
  { x: 349.36, y: 249.57 },
  { x: 2781.95, y: 329.98 },
  { x: 2688, y: 732 },
];

/** Клуб дыма: слой с запасом под сдвиг формы от устья трубы */
export const HOME_HERO_SMOKE_PUFF_SIZE: HomeMapSize = { width: 40, height: 40 };

/** Клубов на трубу: они идут друг за другом со сдвигом в треть цикла */
export const HOME_HERO_SMOKE_PUFFS_PER_CHIMNEY = 3;
