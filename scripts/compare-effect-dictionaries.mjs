/**
 * Сверяет словари редактора эффектов со словарями системы dnd5e-2024.
 *
 * Порт справочников (`app/features/active-effects/model/constants.ts`) снят с
 * системы, версия записана в `EFFECT_SYSTEM_VERSION`. Разойтись они могут молча:
 * значения (`value`) уходят в компендиум как есть, и запись, которой VTTG не
 * знает, выглядит настроенной, но ничего не делает. Тест
 * `test/active-effects/dictionaries.test.ts` держит только размеры — этот скрипт
 * показывает, чего именно не хватает.
 *
 * И там и там справочники собираются функциями (флаги по характеристикам,
 * состояниям, типам урона), поэтому сравнивать текстом нельзя: оба модуля
 * читаются с диска через `jiti` и сравниваются готовыми объектами.
 *
 * Система и её зависимость `@vtt/shared` лежат рядом с core-app; путь задаётся
 * переменной `EFFECT_SYSTEM_PATH`, если чекаут в другом месте.
 *
 * Запуск: `node scripts/compare-effect-dictionaries.mjs`
 */

import { fileURLToPath, URL } from 'node:url';

import { createJiti } from 'jiti';

/** Корень core-app: скрипт лежит в его `scripts/`. */
const CORE_APP_PATH = fileURLToPath(new URL('..', import.meta.url));

/** Чекаут системы dnd5e-2024; рядом с core-app, если не задан переменной. */
const SYSTEM_PATH =
  process.env.EFFECT_SYSTEM_PATH
  ?? fileURLToPath(new URL('../../dnd5-test-migrate', import.meta.url));

/** Пакет общих утилит VTTG: система импортирует его по псевдониму. */
const SHARED_PATH = fileURLToPath(
  new URL('../../vttg/packages/shared/index.ts', import.meta.url),
);

const jiti = createJiti(import.meta.url, {
  alias: { '@vtt/shared': SHARED_PATH },
  interopDefault: true,
});

/**
 * Чего из левого набора нет в правом.
 *
 * @param {string[]} left ключи, которые должны быть.
 * @param {string[]} right ключи, которые есть.
 * @returns {string[]} недостающие ключи по порядку.
 */
function findMissing(left, right) {
  const known = new Set(right);

  return left.filter((key) => !known.has(key));
}

/**
 * Пары «значение → подпись» из списка подсказок.
 *
 * @param {Array<{ value: string, label: string }>} suggestions подсказки.
 * @returns {Record<string, string>} подписи по значению.
 */
function toLabelMap(suggestions) {
  return Object.fromEntries(
    suggestions.map((suggestion) => [suggestion.value, suggestion.label]),
  );
}

/**
 * Расхождения подписей по совпадающим ключам. Часть из них — наша: названия
 * состояний, типов урона и характеристик берутся из справочника сайта, где они
 * уже так называются в каталоге.
 *
 * @param {Record<string, string>} system подписи системы.
 * @param {Record<string, string>} site наши подписи.
 * @returns {string[]} строки «ключ: система / сайт».
 */
function findLabelDiff(system, site) {
  return Object.entries(system)
    .filter(([key, label]) => site[key] !== undefined && site[key] !== label)
    .map(([key, label]) => `${key}: «${label}» / «${site[key]}»`);
}

const site = await jiti.import(
  `${CORE_APP_PATH}/app/features/active-effects/model/constants.ts`,
);

const system = await jiti.import(
  `${SYSTEM_PATH}/src/engine/activeEffectTypes.ts`,
);

const siteFlags = Object.keys(site.EFFECT_FLAG_LABELS);
const systemFlags = Object.keys(system.EFFECT_FLAG_LABELS);
const siteKeys = toLabelMap(site.EFFECT_TARGET_KEY_SUGGESTIONS);
const systemKeys = toLabelMap(system.EFFECT_TARGET_SUGGESTIONS);
const siteConditions = toLabelMap(site.EFFECT_CONDITION_EXPR_SUGGESTIONS);
const systemConditions = toLabelMap(system.EFFECT_CONDITION_SUGGESTIONS);
const siteValues = toLabelMap(site.EFFECT_VALUE_SUGGESTIONS);
const systemValues = toLabelMap(system.EFFECT_VALUE_SUGGESTIONS);

const report = {
  siteVersion: site.EFFECT_SYSTEM_VERSION,
  sizes: {
    flags: `${siteFlags.length} / ${systemFlags.length}`,
    changeKeys: `${Object.keys(siteKeys).length} / ${Object.keys(systemKeys).length}`,
    conditions: `${Object.keys(siteConditions).length} / ${Object.keys(systemConditions).length}`,
    values: `${Object.keys(siteValues).length} / ${Object.keys(systemValues).length}`,
  },
  missingFlags: findMissing(systemFlags, siteFlags),
  unknownFlags: findMissing(siteFlags, systemFlags),
  missingChangeKeys: findMissing(
    Object.keys(systemKeys),
    Object.keys(siteKeys),
  ),
  missingConditions: findMissing(
    Object.keys(systemConditions),
    Object.keys(siteConditions),
  ),
  missingValues: findMissing(
    Object.keys(systemValues),
    Object.keys(siteValues),
  ),
  labelDiff: {
    flags: findLabelDiff(system.EFFECT_FLAG_LABELS, site.EFFECT_FLAG_LABELS),
    changeKeys: findLabelDiff(systemKeys, siteKeys),
    conditions: findLabelDiff(systemConditions, siteConditions),
    values: findLabelDiff(systemValues, siteValues),
  },
};

console.log(JSON.stringify(report, null, 2));
