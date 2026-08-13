/**
 * Бонус мастерства по уровню класса.
 *
 * Живёт в модели домена: им пользуются и таблица прогрессии на странице
 * (`useDndMechanics`), и сборка класса в Markdown.
 *
 * @param level - Уровень класса
 * @returns Бонус мастерства
 */
export function getClassProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}
