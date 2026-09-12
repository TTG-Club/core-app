/** Ссылка из текста страницы — например, почта поддержки */
export interface CookiePolicyLink {
  /** Подпись ссылки */
  label: string;

  /** Адрес: страница или `mailto:` */
  url: string;

  /** Иконка перед подписью */
  icon: string;
}

/**
 * Раздел страницы о cookie. Каждый раздел — отдельная причина, по которой
 * сайт что-то хранит в браузере.
 */
export interface CookiePolicySection {
  /** Идентификатор раздела, он же якорь для ссылки на него */
  id: string;

  /** Заголовок раздела */
  title: string;

  /** Иконка раздела */
  icon: string;

  /** Текст раздела */
  paragraphs: Array<string>;

  /** Метка у заголовка — например, что без этих данных сайт не работает */
  badge?: string;

  /** Короткие правила списком */
  bullets?: Array<string>;

  /** Ссылки в конце раздела */
  links?: Array<CookiePolicyLink>;
}
