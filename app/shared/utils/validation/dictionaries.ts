import { DictionaryService } from '~/shared/api';
import { getEnumFromDictionary } from '~/shared/utils/validation/base';

import type { Rule } from 'ant-design-vue/es/form';
import type { SelectOption } from '~/shared/types';

export function validateFromDictionary(
  value: string,
  dictionary: Array<SelectOption>,
) {
  if (!getEnumFromDictionary(dictionary).includes(value)) {
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

export const ruleSize = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: async (rule: Rule, value: string | undefined) => {
    if (!value) {
      throw new Error('Поле обязательно для заполнения');
    }

    const sizes = await DictionaryService.sizes();

    validateFromDictionary(value, sizes);
  },
});

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
