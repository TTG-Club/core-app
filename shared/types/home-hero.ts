/** Вид фона шапки главной: картинка или видео — рисуются разными элементами. */
export type HomeHeroMediaKind = 'image' | 'video';

/** Своя картинка или видео вместо карты по умолчанию в шапке главной. */
export interface HomeHeroMedia {
  /** Ссылка на файл в хранилище сайта (`/s3/...`). */
  url: string;
  kind: HomeHeroMediaKind;
}

/**
 * Настройка фона шапки главной. `media: null` — своего фона нет, в шапке карта
 * по умолчанию под текущую тему.
 */
export interface HomeHeroSettings {
  media: HomeHeroMedia | null;
}
