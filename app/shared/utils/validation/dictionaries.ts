import type { Rule } from 'ant-design-vue/es/form';
import { Dictionaries } from '~/shared/api';
import { getEnumFromDictionary } from '~/shared/utils/validation/base';
import type { SelectOption } from '~/shared/types';

function validateFromDictionary(
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

    const timeUnits = await Dictionaries.timeUnits();

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

    const magicSchools = await Dictionaries.magicSchools();

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

    const sizes = await Dictionaries.sizes();

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

    const creatureTypes = await Dictionaries.creatureTypes();

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

    const featCategories = await Dictionaries.featCategories();

    validateFromDictionary(value, featCategories);
  },
});
