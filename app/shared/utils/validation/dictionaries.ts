import { isArray, isUndefined } from 'lodash-es';

import { DictionaryService } from '~/shared/api';
import { getEnumFromDictionary } from '~/shared/utils/validation/base';

import type { Rule } from 'ant-design-vue/es/form';
import type {
  SelectOption,
  SelectOptionWithNumericValue,
} from '~/shared/types';

interface Options {
  required?: boolean;
  array?: boolean;
}

export const ruleTimeUnit = (options?: Options): Rule =>
  validator(DictionaryService.timeUnits, options);

export const ruleMagicSchool = (options?: Options): Rule =>
  validator(DictionaryService.magicSchools, options);

export const ruleSize = (options?: Options): Rule =>
  validator(DictionaryService.sizes, options);

export const ruleCreatureType = (options?: Options): Rule =>
  validator(DictionaryService.creatureTypes, options);

export const ruleFeatCategories = (options?: Options): Rule =>
  validator(DictionaryService.featCategories, options);

export const ruleRarity = (options?: Options): Rule =>
  validator(DictionaryService.rarity, options);

export const ruleLanguage = (options?: Options): Rule =>
  validator(DictionaryService.languages, options);

export const ruleSkill = (options?: Options): Rule =>
  validator(DictionaryService.skills, options);

function validator(
  dictionaryCallback: () => Promise<
    Array<SelectOption> | Array<SelectOptionWithNumericValue>
  >,
  options: Options | undefined,
): Rule {
  const required = isUndefined(options?.required) ? true : options.required;
  const array = isUndefined(options?.array) ? false : options.array;

  return {
    required,
    trigger: ['change', 'blur'],
    type: !array ? 'string' : 'array',
    validator: async (
      rule: Rule,
      value: string | Array<string> | undefined,
    ) => {
      if (!value) {
        throw new Error('Поле обязательно для заполнения');
      }

      const dictionary = await dictionaryCallback();

      validateFromDictionary(value, dictionary);
    },
  };
}

export function validateFromDictionary(
  value: string | number | Array<string | number>,
  dictionary: Array<SelectOption | SelectOptionWithNumericValue>,
) {
  const _value = !isArray(value) ? [value] : value;

  if (
    _value.some((item) => !getEnumFromDictionary(dictionary).includes(item))
  ) {
    throw new Error('Недопустимое значение');
  }
}
