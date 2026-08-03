import {
  MAILING_CODE_LABEL_MAX_LENGTH,
  MAILING_CODE_PLACEHOLDER,
  MAILING_DEFAULT_LABEL,
  MAILING_EMAIL_PLACEHOLDER,
  MAILING_LABEL_SEPARATOR,
} from '../consts/mailing';

/**
 * Подставляет маркеры письма: `{{code}}` — промокод получателя, `{{email}}` —
 * его адрес. Одни и те же правила работают и в превью формы, и при отправке.
 *
 * @param source строка с маркерами (тема или текст письма)
 * @param code промокод получателя
 * @param email адрес получателя
 */
export function applyMailingPlaceholders(
  source: string,
  code: string,
  email: string,
): string {
  return source
    .replaceAll(MAILING_CODE_PLACEHOLDER, code)
    .replaceAll(MAILING_EMAIL_PLACEHOLDER, email);
}

/** Простая проверка адреса: один `@`, точка в домене, без пробелов. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

/**
 * Проверяет, похожа ли строка на почтовый адрес.
 *
 * @param value проверяемая строка
 */
export function isEmailAddress(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

/**
 * Собирает метку выпущенного кода: «название рассылки · адрес получателя».
 *
 * Метка — единственное место, где связь «кому ушёл код» переживает перезагрузку
 * страницы: она хранится вместе с кодом в subscriber-service и видна как в
 * истории рассылок, так и в детали кода в разделе промокодов.
 *
 * @param campaignLabel название рассылки (пустое — берётся значение по умолчанию)
 * @param email адрес получателя
 */
export function buildMailingCodeLabel(
  campaignLabel: string,
  email: string,
): string {
  const name = campaignLabel.trim() || MAILING_DEFAULT_LABEL;
  const suffix = `${MAILING_LABEL_SEPARATOR}${email}`;
  // Адрес важнее названия: если метка не влезает в колонку, режем название.
  const availableLength = MAILING_CODE_LABEL_MAX_LENGTH - suffix.length;

  if (availableLength <= 0) {
    return `${MAILING_LABEL_SEPARATOR}${email}`.slice(
      0,
      MAILING_CODE_LABEL_MAX_LENGTH,
    );
  }

  return `${name.slice(0, availableLength)}${suffix}`;
}

/**
 * Достаёт адрес получателя из метки кода — по нему рассылочные коды отличаются
 * от выпущенных вручную. Опознаём по последнему разделителю, а не по названию
 * рассылки: название админ задаёт произвольное.
 *
 * @param label метка кода или `null`
 * @returns адрес получателя либо `null`, если метка не от рассылки
 */
export function extractMailingEmail(label: string | null): string | null {
  if (!label) {
    return null;
  }

  const separatorIndex = label.lastIndexOf(MAILING_LABEL_SEPARATOR);

  if (separatorIndex === -1) {
    return null;
  }

  const email = label
    .slice(separatorIndex + MAILING_LABEL_SEPARATOR.length)
    .trim();

  return isEmailAddress(email) ? email : null;
}

/**
 * Возвращает название рассылки из метки кода.
 *
 * @param label метка кода
 */
export function extractMailingCampaign(label: string | null): string | null {
  if (!label || !extractMailingEmail(label)) {
    return null;
  }

  return (
    label.slice(0, label.lastIndexOf(MAILING_LABEL_SEPARATOR)).trim() || null
  );
}
