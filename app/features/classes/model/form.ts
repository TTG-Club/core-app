import type { ActiveEffect } from '~active-effects/model';
import type { FeatEditorRows, FeatMechanics } from '~feats/model';

import type {
  ClassColumnCreate,
  ClassCreate,
  ClassFeatureCreate,
  ClassFeatureOptionsChoiceCreate,
} from './create';

import { z } from 'zod';

import {
  normalizeActiveEffects,
  normalizeLoadedActiveEffects,
} from '~active-effects/model';
import {
  buildFeatMechanics,
  createFeatMechanics,
  createPrerequisiteDetails,
  fromFeatEditorRows,
  parseLoadedMechanics,
  toFeatEditorRows,
} from '~feats/model';

import { getLegacyFeatureFlags, withLegacyFeatureRows } from './features';

/**
 * Разбор загруженного класса и подготовка формы к отправке.
 *
 * Дары и эффекты приходят из `GET /api/v2/classes/{url}/raw` блоками JSONB: у
 * записей, сохранённых до их появления, блоков нет вовсе. Задача разбора не
 * подставить значения, а отсеять чужое — недостающее дозаполняет слияние с
 * начальным состоянием формы внутри `useWorkshopForm`.
 */

/** Носитель даров: и сама запись класса, и любое его умение. */
interface MechanicsHolder {
  mechanics: FeatMechanics | undefined;
  editorRows: FeatEditorRows | undefined;
}

/**
 * Поля умения, которые форма не правит напрямую: флаги прежних лет и блок
 * выбора навыков. Все они читаются в строки даров при загрузке
 * (`withLegacyFeatureRows`) и выводятся из строк при сохранении.
 */
const featureSchema = z.object({
  informationalOnly: z.boolean().optional(),
  abilityImprovement: z.boolean().nullish(),
  fightingStyleChoice: z.boolean().nullish(),
  skillChoice: z
    .object({
      count: z.number().optional(),
      skills: z.array(z.string()).optional(),
    })
    .nullish(),
});

/**
 * Настройка выбора из вариантов умения. Поля нет у записей, сохранённых до её
 * появления, и у умений, список вариантов которых остаётся справочным.
 */
const optionsChoiceSchema = z.object({
  label: z.string().nullish(),
  count: z.coerce.number().nullish(),
  scaling: z
    .array(
      z.object({
        level: z.coerce.number(),
        count: z.coerce.number(),
      }),
    )
    .nullish(),
});

/**
 * Разбирает настройку выбора из вариантов умения.
 *
 * @param raw сырое значение из ответа сервера.
 * @returns настройка выбора; `undefined` — список только справочный.
 */
function parseOptionsChoice(
  raw: unknown,
): ClassFeatureOptionsChoiceCreate | undefined {
  const parsed = optionsChoiceSchema.safeParse(raw);

  if (!parsed.success) {
    return undefined;
  }

  return {
    label: parsed.data.label ?? undefined,
    count: parsed.data.count ?? undefined,
    scaling: (parsed.data.scaling ?? []).map((step) => ({
      level: step.level,
      count: step.count,
    })),
  };
}

/**
 * Готовит настройку выбора к отправке: пустая подпись и пустые ступени в теле
 * запроса не нужны, а сама настройка уходит целиком — по её наличию потребитель
 * и отличает выбираемый список от справочного.
 *
 * @param choice настройка выбора из состояния формы.
 * @returns настройка для тела запроса.
 */
function transformOptionsChoice(
  choice: ClassFeatureOptionsChoiceCreate | undefined,
): ClassFeatureOptionsChoiceCreate | undefined {
  if (!choice) {
    return undefined;
  }

  return {
    label: choice.label?.trim() || undefined,
    count: choice.count,
    scaling: choice.scaling.filter((step) => step.level > 0 && step.count > 0),
  };
}

/**
 * Проверяет, что значение — объект: у полей, которые схема не описывает
 * (`mechanics`, `activeEffects`), свои разборщики, и обратиться к ним можно
 * только у объекта.
 *
 * @param value сырое значение.
 * @returns признак объекта.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Собирает у носителя даров разобранную механику, эффекты и строки редактора.
 *
 * Предусловий у класса нет: строки собираются с пустым предусловием, вкладки
 * требований в его форме тоже нет.
 *
 * @param raw сырой носитель даров из ответа сервера.
 * @returns блоки формы: механика, эффекты и строки редактора.
 */
function parseMechanicsHolder(raw: unknown): {
  mechanics: FeatMechanics;
  activeEffects: Array<ActiveEffect>;
  editorRows: FeatEditorRows;
} {
  const source = isRecord(raw) ? raw : {};
  const mechanics = parseLoadedMechanics(source.mechanics);

  return {
    mechanics,
    // Эффекты разбирает своя схема раздела: битый эффект отбрасывается
    // поштучно, а не роняет весь список
    activeEffects: normalizeLoadedActiveEffects(source.activeEffects),
    editorRows: toFeatEditorRows(mechanics, createPrerequisiteDetails()),
  };
}

/**
 * Пересобирает дары носителя из строк редактора и чистит блок перед отправкой.
 *
 * @param holder механика и строки одного носителя даров.
 * @returns готовая к отправке механика; `undefined` — даров нет.
 */
function buildMechanics(holder: MechanicsHolder): FeatMechanics | undefined {
  const built = holder.editorRows
    ? fromFeatEditorRows(
        holder.editorRows,
        holder.mechanics ?? createFeatMechanics(),
      ).mechanics
    : holder.mechanics;

  return built ? buildFeatMechanics(built) : undefined;
}

/**
 * Приводит умение класса к структуре формы.
 *
 * Флаги повышения характеристик и боевого стиля и блок выбора навыков читаются
 * в строки даров: форма правит их только строками. Списки роста и вариантов
 * приходят и пустыми, и пропущенными — форме нужны массивы.
 *
 * @param raw сырое умение из ответа сервера.
 * @returns умение с разобранными дарами и эффектами.
 */
function parseFeature(raw: unknown): Record<string, unknown> {
  const source = isRecord(raw) ? raw : {};
  const parsed = featureSchema.safeParse(source);
  const holder = parseMechanicsHolder(source);

  const legacy = parsed.success ? parsed.data : {};

  const skillChoice = legacy.skillChoice
    ? {
        count: legacy.skillChoice.count ?? 1,
        skills: legacy.skillChoice.skills ?? [],
      }
    : undefined;

  return {
    ...source,
    informationalOnly: legacy.informationalOnly ?? false,
    scaling: Array.isArray(source.scaling) ? source.scaling : [],
    options: Array.isArray(source.options) ? source.options : [],
    optionsChoice: parseOptionsChoice(source.optionsChoice),
    // Блок выбора навыков уехал в строки даров и в состоянии формы не живёт
    skillChoice: undefined,
    ...holder,
    editorRows: withLegacyFeatureRows(holder.editorRows, {
      abilityImprovement: legacy.abilityImprovement ?? false,
      fightingStyleChoice: legacy.fightingStyleChoice ?? false,
      skillChoice,
    }),
  };
}

/**
 * Приводит загруженный с сервера класс к структуре формы.
 *
 * @param raw сырой ответ формы класса.
 * @returns состояние с разобранными дарами, эффектами и умениями.
 */
export function normalizeLoadedClass(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...raw,
    ...parseMechanicsHolder(raw),
    features: Array.isArray(raw.features) ? raw.features.map(parseFeature) : [],
  };
}

/**
 * Готовит умение класса к отправке: дары из строк, эффекты через общий
 * нормализатор, строки редактора наружу не уходят.
 *
 * Флаги повышения характеристик и боевого стиля выводятся из строк даров: их
 * читают потребители, не знающие о выборе черты в механике, и запись обязана
 * говорить одно и то же обоими способами.
 *
 * @param feature умение из состояния формы.
 * @returns умение для тела запроса.
 */
function transformFeature(feature: ClassFeatureCreate): ClassFeatureCreate {
  const flags = feature.editorRows
    ? getLegacyFeatureFlags(feature.editorRows)
    : {
        abilityImprovement: feature.abilityImprovement ?? false,
        fightingStyleChoice: feature.fightingStyleChoice ?? false,
      };

  return {
    ...feature,
    ...flags,
    optionsChoice: transformOptionsChoice(feature.optionsChoice),
    mechanics: buildMechanics(feature),
    activeEffects: normalizeActiveEffects(feature.activeEffects),
    editorRows: undefined,
  };
}

/**
 * Приводит колонку таблицы к полям, которые правит форма.
 *
 * Колонка собирается заново, а не копией с правками: у записи, сохранённой
 * раньше, в ней лежат поля ресурса (`resourceRecovery`, `shortName`), формы у
 * них больше нет, и копия увезла бы их назад. Ресурс класса теперь заводится
 * строкой ресурса в дарах, и колонка, оставшаяся ресурсом, дала бы на листе
 * второй такой же счётчик.
 *
 * @param column колонка из состояния формы.
 * @returns колонка для тела запроса.
 */
function transformColumn(column: ClassColumnCreate): ClassColumnCreate {
  return {
    name: column.name,
    scaling: column.scaling,
    key: column.key,
    purpose: column.purpose,
  };
}

/**
 * Чистит состояние формы класса перед отправкой.
 *
 * @param state состояние формы.
 * @returns тело запроса без строк редактора и пустых блоков.
 */
export function transformClassBeforeSubmit(state: ClassCreate): ClassCreate {
  return {
    ...state,
    editorRows: undefined,
    table: state.table.map(transformColumn),
    mechanics: buildMechanics(state),
    // Эффекты чистит общий нормализатор раздела: он же обслуживает черты,
    // заклинания и магические предметы, поэтому правило «что считать пустым»
    // одно на всех
    activeEffects: normalizeActiveEffects(state.activeEffects),
    features: state.features.map(transformFeature),
  };
}
