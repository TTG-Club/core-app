import type { Rule } from 'ant-design-vue/es/form';
import { Dictionaries } from '~/shared/api';
import { getEnumFromDictionary } from '~/shared/utils/validation/base';
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type { SelectOption } from '~/shared/types';

const fetchConfig: Omit<NitroFetchOptions<NitroFetchRequest>, 'method'> = {
  onRequestError: () => {
    throw new Error('Неизвестная ошибка');
  },
  onResponseError: () => {
    throw new Error('Неизвестная ошибка');
  },
};

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

    const timeUnits = await Dictionaries.timeUnits(fetchConfig);

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

    const magicSchools = await Dictionaries.magicSchools(fetchConfig);

    validateFromDictionary(value, magicSchools);
  },
});

export const ruleSize = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'array',
  validator: async (rule: Rule, value: Array<string> | undefined) => {
    if (!value?.length) {
      throw new Error('Поле обязательно для заполнения');
    }

    const sizes = await Dictionaries.sizes(fetchConfig);

    for (const size of value) {
      validateFromDictionary(size, sizes);
    }
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

    const creatureTypes = await Dictionaries.creatureTypes(fetchConfig);

    validateFromDictionary(value, creatureTypes);
  },
});
