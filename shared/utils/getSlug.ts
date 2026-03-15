import { slugify } from 'transliteration';

type OptionsSlugify = Parameters<typeof slugify>[1];

const MULTIPLE_DASHES_REGEX = /-+/g;
const LEADING_NON_ALNUM_REGEX = /^[^a-z0-9]+/gi;
const TRAILING_NON_ALNUM_REGEX = /[^a-z0-9]+$/gi;

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
export function getSlug(string: string, options?: OptionsSlugify) {
  const config = {
    lowercase: true,
    trim: true,
    allowedChars: 'a-zA-Z0-9-',
    ...options,
  };

  return slugify(string, config)
    .replace(MULTIPLE_DASHES_REGEX, '-')
    .replace(LEADING_NON_ALNUM_REGEX, '')
    .replace(TRAILING_NON_ALNUM_REGEX, '');
}
