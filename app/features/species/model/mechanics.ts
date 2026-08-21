import type {
  FeatChoice,
  FeatModifiers,
  FeatProficiencyGrant,
} from '~feats/model';

/**
 * Механика влияния вида на лист персонажа: то, что лист считает сам, а не
 * показывает текстом.
 *
 * Зеркало `SpeciesMechanics` из core-api. Одна модель на два места: у самой
 * записи (`species.mechanics`) — то, что даёт выбор вида или происхождения
 * целиком, у умения (`features[].mechanics`) — то, что даёт конкретное умение.
 *
 * Блоки берутся у черты как есть. Не потому, что вид «часть» черты, а потому
 * что в core-api они лежат в общем пакете (`common/model/mechanics`) и на листе
 * применяются одинаково: разводить на фронте две одинаковые модели значило бы
 * править их парами. Своего у вида нет ничего — ни повышений характеристик (их
 * по правилам 2024 года даёт предыстория), ни выдачи заклинаний (заклинания
 * вида живут в `innateSpells` со своими требуемыми уровнями).
 */
export interface SpeciesMechanics {
  modifiers: FeatModifiers;
  proficiencies: FeatProficiencyGrant;
  choices: Array<FeatChoice>;
}
