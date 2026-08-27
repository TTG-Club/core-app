import type { FeatGrantedSpellRef } from '~feats/model';

import type { SpeciesFeatureCreate } from './types';

import { z } from 'zod';

import { normalizeLoadedActiveEffects } from '~active-effects/model';
import {
  createFeatMechanics,
  createPrerequisiteDetails,
  parseLoadedMechanics,
  toFeatEditorRows,
} from '~feats/model';

import { SPECIES_INNATE_SPELL_EDITOR } from './constants';

/**
 * Разбор блоков вида, пришедших с сервера.
 *
 * Данные приходят из `GET /api/v2/species/{url}/raw`, где дары и эффекты лежат
 * в JSONB: у записей, сохранённых до их появления, блоков нет вовсе. Задача
 * разбора не подставить значения, а отсеять чужое — недостающее дозаполняет
 * слияние с начальным состоянием формы внутри `useWorkshopForm`.
 */

const featureSchema = z.object({
  name: z
    .object({
      rus: z.string().optional(),
      eng: z.string().optional(),
    })
    .optional(),
  description: z.string().optional(),
  level: z.number().optional(),
  grantedSpells: z
    .array(
      z.object({
        url: z.string(),
        name: z.string().optional(),
        requiredLevel: z.number().optional(),
      }),
    )
    .optional(),
});

/**
 * Заклинания, привязанные к самому виду: так они хранились до переезда к
 * умениям. Разбираются отдельной схемой — в форму они не попадают, их
 * разбирает {@link attachLegacyInnateSpells}.
 */
const legacyInnateSpellSchema = z.object({
  spell: z.string(),
  requiredLevel: z.number().optional(),
});

/**
 * Приводит умение вида к структуре формы.
 *
 * Дары умения разбираются схемой черты — модель у них общая; строки редактора
 * собираются здесь же, потому что правит форма именно их.
 *
 * @param raw сырое умение из ответа сервера.
 * @returns умение для формы.
 */
function parseFeature(raw: unknown): SpeciesFeatureCreate {
  const parsed = featureSchema.safeParse(raw);
  const source = parsed.success ? parsed.data : {};

  const mechanics = parseLoadedMechanics(
    isRecord(raw) ? raw.mechanics : undefined,
  );

  return {
    name: {
      rus: source.name?.rus ?? '',
      eng: source.name?.eng ?? '',
    },
    description: source.description ?? '',
    level: source.level,
    grantedSpells: source.grantedSpells ?? [],
    mechanics,
    activeEffects: normalizeLoadedActiveEffects(
      isRecord(raw) ? raw.activeEffects : undefined,
    ),
    // Предусловий у вида нет: строки собираются с пустым предусловием, вкладки
    // требований в его форме тоже нет
    editorRows: toFeatEditorRows(mechanics, createPrerequisiteDetails()),
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
 * Приводит загруженный с сервера вид к структуре формы.
 *
 * @param raw сырой ответ формы вида.
 * @returns состояние с разобранными дарами, эффектами и умениями.
 */
export function normalizeLoadedSpecies(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const mechanics = parseLoadedMechanics(raw.mechanics);

  const features = Array.isArray(raw.features)
    ? raw.features.map(parseFeature)
    : [];

  return {
    ...raw,
    mechanics,
    // Эффекты разбирает своя схема раздела: битый эффект отбрасывается
    // поштучно, а не роняет весь список
    activeEffects: normalizeLoadedActiveEffects(raw.activeEffects),
    features: attachLegacyInnateSpells(features, raw.innateSpells),
    // Разобранные по умениям заклинания уходят обратно уже умениями; оставь их
    // здесь — и вид выдал бы каждое дважды
    innateSpells: [],
    editorRows: toFeatEditorRows(mechanics, createPrerequisiteDetails()),
  };
}

/**
 * Собирает заклинания, привязанные к самому виду, в отдельные умения.
 *
 * Хранились они одним списком с уровнем доступа, без указания умения, — так их
 * принимал core-api до того, как заклинания переехали к умению. Какое умение их
 * даёт, в этих данных не записано, и угадывать нечем: у тифлинга все три умения
 * приходят с первого уровня, а «Чудотворство» даёт из них одно.
 *
 * Поэтому заклинания собираются в своё умение — по одному на уровень, как их и
 * показывала система D&D: выгрузка компендиума до сих пор собирала под них
 * ровно такое же умение с этим же названием. Автор видит их отдельной строкой и
 * при желании переносит к нужному умению сам.
 *
 * Сохранение закрепляет разбор: обратно вид уходит уже с заклинаниями у умений
 * и пустым списком у себя.
 *
 * @param features умения вида, уже разобранные формой.
 * @param raw сырые заклинания вида из ответа сервера.
 * @returns умения с дописанными заклинаниями.
 */
function attachLegacyInnateSpells(
  features: Array<SpeciesFeatureCreate>,
  raw: unknown,
): Array<SpeciesFeatureCreate> {
  if (!Array.isArray(raw) || !raw.length) {
    return features;
  }

  const result = [...features];

  for (const entry of raw) {
    const parsed = legacyInnateSpellSchema.safeParse(entry);

    if (!parsed.success) {
      continue;
    }

    const level = parsed.data.requiredLevel ?? 1;

    const owner =
      findInnateSpellFeature(result, level)
      ?? pushInnateSpellFeature(result, level);

    const reference: FeatGrantedSpellRef = { url: parsed.data.spell };

    if (!owner.grantedSpells.some((spell) => spell.url === reference.url)) {
      owner.grantedSpells = [...owner.grantedSpells, reference];
    }
  }

  return result;
}

/**
 * Умение, собранное под врождённые заклинания этого уровня, если оно уже есть.
 *
 * Ищется по названию и уровню: заклинаний одного уровня бывает несколько, и
 * каждому заводить своё умение незачем.
 *
 * @param features умения вида.
 * @param level уровень персонажа, с которого заклинания доступны.
 * @returns найденное умение либо `undefined`.
 */
function findInnateSpellFeature(
  features: Array<SpeciesFeatureCreate>,
  level: number,
): SpeciesFeatureCreate | undefined {
  return features.find(
    (feature) =>
      feature.name.rus === SPECIES_INNATE_SPELL_EDITOR.title
      && (feature.level ?? 1) === level,
  );
}

/**
 * Заводит умение под врождённые заклинания вида.
 *
 * Названием повторяет то, что до сих пор собирала выгрузка компендиума: в
 * системе D&D такие заклинания и показывались отдельным умением с этим именем.
 * Английское название нужно ради устойчивого ключа выгрузки — он собирается из
 * него, когда своего url у умения ещё нет.
 *
 * Описания у такого умения нет, и на странице вида оно не показывается: пустой
 * раскрывающийся блок с одним заголовком там не нужен.
 *
 * @param features умения вида; новое дописывается в конец.
 * @param level уровень персонажа, с которого заклинания доступны.
 * @returns заведённое умение.
 */
function pushInnateSpellFeature(
  features: Array<SpeciesFeatureCreate>,
  level: number,
): SpeciesFeatureCreate {
  const feature: SpeciesFeatureCreate = {
    name: { rus: SPECIES_INNATE_SPELL_EDITOR.title, eng: 'Innate Spells' },
    description: '',
    level: level > 1 ? level : undefined,
    grantedSpells: [],
    mechanics: undefined,
    activeEffects: [],
    editorRows: toFeatEditorRows(
      createFeatMechanics(),
      createPrerequisiteDetails(),
    ),
  };

  features.push(feature);

  return feature;
}
