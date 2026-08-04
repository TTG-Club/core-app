import {
  MAILING_CODE_PLACEHOLDER,
  MAILING_EMAIL_PLACEHOLDER,
} from '#shared/consts';
import { applyMailingPlaceholders } from '#shared/utils';

/** Письмо в двух представлениях: обе части уходят в одном сообщении. */
export interface RenderedLetter {
  /** Текстовая версия (`text/plain`). */
  text: string;
  /** HTML-версия (`text/html`) в фирменной обёртке. */
  html: string;
}

/** Данные для сборки письма конкретному получателю. */
export interface CampaignLetterOptions {
  /** Тема письма (маркеры уже могут быть в ней). */
  subject: string;
  /** Текст письма, написанный админом, с маркерами. */
  bodyText: string;
  /** Промокод получателя. */
  code: string;
  /** Адрес получателя. */
  email: string;
  /** Базовый адрес сайта без завершающего слэша. */
  siteUrl: string;
}

/** Путь раздела кабинета, где пользователь активирует код. */
const ACTIVATION_PATH = '/user/profile/activation';

/** Подпись под письмом: объясняет, откуда письмо, и заменяет форму отписки. */
const LETTER_FOOTER_TEXT =
  'Это письмо отправил администратор TTG Club вручную. '
  + 'Если оно пришло вам по ошибке — просто ответьте на него, и мы уберём адрес из списка.';

/** Подпись кнопки-ссылки на активацию кода. */
const ACTIVATION_BUTTON_TEXT = 'Активировать код';

/** Брендовый акцент (oklch(0.55 0.11 80) сайта в hex — почтовики не знают oklch). */
const BRAND_COLOR = '#93690d';

/**
 * Экранирует спецсимволы HTML: текст письма пишет админ, и любые угловые скобки
 * в нём должны остаться текстом, а не разметкой.
 *
 * @param value исходная строка
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Превращает голые ссылки в кликабельные. Работает уже по экранированному тексту,
 * поэтому амперсанды в адресе выглядят как `&amp;` — это валидный href.
 *
 * @param escapedText экранированный текст
 */
function linkify(escapedText: string): string {
  return escapedText.replace(
    /(https?:\/\/[^\s<]+)/g,
    `<a href="$1" style="color:${BRAND_COLOR};">$1</a>`,
  );
}

/**
 * Собирает абзацы письма: пустая строка разделяет абзацы, одиночный перенос —
 * строка внутри абзаца.
 *
 * @param escapedText экранированный текст письма
 */
function renderParagraphs(escapedText: string): string {
  return escapedText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;">${linkify(paragraph).replaceAll('\n', '<br />')}</p>`,
    )
    .join('');
}

/**
 * Возвращает HTML промокода — заметный блок вместо обычного текста, чтобы
 * получатель не выискивал код глазами.
 *
 * @param code промокод получателя
 */
function renderCodeBadge(code: string): string {
  return (
    '<span style="display:inline-block;margin:4px 0;padding:8px 14px;'
    + "font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:700;"
    + 'letter-spacing:2px;color:#1f2430;background:#f4f5f7;border:1px solid #d8dae0;'
    + `border-radius:8px;">${escapeHtml(code)}</span>`
  );
}

/**
 * Собирает письмо получателю: подставляет маркеры и оборачивает текст в
 * фирменный HTML-шаблон, рядом кладя текстовую версию.
 *
 * Обе части обязательны: письмо только с HTML почтовые фильтры считают
 * подозрительным, а часть почтовиков показывает голый текст.
 *
 * @param options данные письма и получателя
 */
export function renderCampaignLetter(
  options: CampaignLetterOptions,
): RenderedLetter {
  const { subject, bodyText, code, email, siteUrl } = options;
  const activationUrl = `${siteUrl.replace(/\/$/, '')}${ACTIVATION_PATH}`;

  const text = [
    applyMailingPlaceholders(bodyText, code, email).trim(),
    `${ACTIVATION_BUTTON_TEXT}: ${activationUrl}`,
    LETTER_FOOTER_TEXT,
  ].join('\n\n');

  // Маркеры подставляем ПОСЛЕ экранирования: код показываем нарядным блоком,
  // а сам текст письма при этом остаётся безопасным.
  const body = renderParagraphs(escapeHtml(bodyText))
    .replaceAll(MAILING_CODE_PLACEHOLDER, renderCodeBadge(code))
    .replaceAll(MAILING_EMAIL_PLACEHOLDER, escapeHtml(email));

  const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(applyMailingPlaceholders(subject, code, email))}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;">
<div style="padding:24px 12px;background:#f4f5f7;">
<div style="max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;font-family:'Segoe UI',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#1f2430;">
<div style="margin-bottom:24px;font-size:18px;font-weight:700;color:${BRAND_COLOR};">TTG Club</div>
${body}
<div style="margin:32px 0 8px;">
<a href="${activationUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND_COLOR};color:#ffffff;font-weight:600;text-decoration:none;border-radius:8px;">${ACTIVATION_BUTTON_TEXT}</a>
</div>
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">${escapeHtml(LETTER_FOOTER_TEXT)}</div>
</div>
</div>
</body>
</html>`;

  return { text, html };
}
