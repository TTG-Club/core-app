import { slugify } from 'transliteration';

import type { OptionsSlugify } from 'transliteration';

/**
 * Конвертирование строки в url-friendly строку
 *
 * @param string Конвертируемая строка
 * @param options Настройка конвертера. По умолчанию: `{
 *   lowercase: true,
 *   trim: true,
 *   allowedChars: 'a-zA-Z0-9-',
 * }`
 */
export const getSlug = (string: string, options?: OptionsSlugify) => {
  const config = Object.assign(
    {
      lowercase: true,
      trim: true,
      allowedChars: 'a-zA-Z0-9-',
    },
    options,
  );

  return slugify(string, config)
    .replace(/-+/g, '-')
    .replace(/^[^a-z0-9]+/gi, '')
    .replace(/[^a-z0-9]+$/gi, '');
};
