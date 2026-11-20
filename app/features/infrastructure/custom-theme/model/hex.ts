import Color from 'colorjs.io';
import { z } from 'zod';

/** Цвет в формате `#rrggbb` — так он хранится в настройках своей темы. */
export const customThemeHexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);

/**
 * Код цвета, набранный руками: с решёткой или без, из трёх или шести
 * шестнадцатеричных цифр. Короткую запись раскрывает colorjs.io
 * (`abc` → `#aabbcc`), результат — в нижнем регистре, как в настройках темы.
 */
const hexColorInputSchema = z
  .string()
  .trim()
  .regex(/^#?(?:[0-9a-f]{3}){1,2}$/i)
  .transform((value) =>
    new Color(`#${value.replace('#', '')}`).toString({
      format: 'hex',
      collapse: false,
    }),
  )
  .pipe(customThemeHexColorSchema);

/**
 * Разбирает код цвета из поля ввода своей темы.
 *
 * @param value Текст поля: `#A1B2C3`, `a1b2c3`, `#ABC` или `abc`.
 * @returns Цвет в формате `#rrggbb` или `undefined`, если код неверный.
 */
export function parseCustomThemeHexColor(value: string): string | undefined {
  const result = hexColorInputSchema.safeParse(value);

  return result.success ? result.data : undefined;
}

/**
 * Код цвета для поля ввода — заглавными буквами, как его обычно пишут.
 *
 * @param color Цвет в формате `#rrggbb`.
 * @returns Код вида `#A1B2C3`.
 */
export function formatCustomThemeHexColor(color: string): string {
  return color.toUpperCase();
}

/**
 * Текст поля кода цвета. Пока человек набирает код, поле показывает его
 * набор — и неверный, чтобы подсветить ошибку, и верный, пока он совпадает с
 * цветом темы. Если цвет сменили иначе (готовым цветом, палитрой, ползунком),
 * поле показывает новый цвет.
 *
 * @param draft Набранный текст или `undefined`, если поле не правили.
 * @param color Текущий цвет в формате `#rrggbb`.
 * @returns Текст для поля.
 */
export function getCustomThemeHexFieldText(
  draft: string | undefined,
  color: string,
): string {
  if (draft === undefined) {
    return formatCustomThemeHexColor(color);
  }

  const parsed = parseCustomThemeHexColor(draft);

  return parsed === undefined || parsed === color
    ? draft
    : formatCustomThemeHexColor(color);
}
