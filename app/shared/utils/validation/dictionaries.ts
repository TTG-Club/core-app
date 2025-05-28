import { isArray, isUndefined } from 'lodash-es';

import { DictionaryService } from '~/shared/api';
import { getEnumFromDictionary } from '~/shared/utils/validation/base';

import type { Rule } from 'ant-design-vue/es/form';
import type {
  SelectOption,
  SelectOptionWithNumericValue,
} from '~/shared/types';

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

export const ruleTimeUnit = (required = true): Rule => ({
  required,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: async (rule: Rule, value: string | undefined) => {
    if (!required && !value) {
      return;
    }

    if (!value) {
      throw new Error('Поле обязательно для заполнения');
    }

    const timeUnits = await DictionaryService.timeUnits();

    validateFromDictionary(value, timeUnits);
  },
});

export const ruleMagicSchool = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: async (rule: Rule, value: string | undefined) => {
    if (!value) {
      throw new Error('Поле обязательно для заполнения');
    }

    const magicSchools = await DictionaryService.magicSchools();

    validateFromDictionary(value, magicSchools);
  },
});

export const ruleSize = (options?: {
  required?: boolean;
  array?: boolean;
}): Rule => {
  const required = isUndefined(options?.required) ? true : options.required;
  const array = isUndefined(options?.array) ? false : options.array;

  return {
    required: required,
    trigger: ['change', 'blur'],
    type: !array ? 'string' : 'array',
    validator: async (
      rule: Rule,
      value: string | Array<string> | undefined,
    ) => {
      if (!required && !value) {
        return;
      }

      if (!value) {
        throw new Error('Поле обязательно для заполнения');
      }

      const sizes = await DictionaryService.sizes();

      validateFromDictionary(value, sizes);
    },
  };
};

export const ruleCreatureType = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: async (rule: Rule, value: string | undefined) => {
    if (!value) {
      throw new Error('Поле обязательно для заполнения');
    }

    const creatureTypes = await DictionaryService.creatureTypes();

    validateFromDictionary(value, creatureTypes);
  },
});

export const ruleFeatCategories = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: async (rule: Rule, value: string | undefined) => {
    if (!value) {
      throw new Error('Поле обязательно для заполнения');
    }

    const featCategories = await DictionaryService.featCategories();

    validateFromDictionary(value, featCategories);
  },
});

export const ruleRarity = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: async (rule: Rule, value: string | undefined) => {
    if (!value) {
      throw new Error('Поле обязательно для заполнения');
    }

    const rarity = await DictionaryService.rarity();

    validateFromDictionary(value, rarity);
  },
});
