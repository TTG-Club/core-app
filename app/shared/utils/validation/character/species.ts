import type { Rule } from 'ant-design-vue/es/form';
import { baseStringCheck, getEnumFromDictionary } from '../base';
import { StatusCodes } from 'http-status-codes';
import { Dictionaries } from '~/shared/api';

export const ruleUrl = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: async (rule: Rule, value: string) => {
    baseStringCheck(value, 3);

    await $fetch(`/api/v2/species/${value}`, {
      method: 'head',
      retry: false,
      onRequestError: () => {
        throw new Error('Неизвестная ошибка');
      },
      onResponseError: (response) => {
        throw new Error(
          response.response.status === StatusCodes.CONFLICT
            ? 'Такой вид уже существует'
            : 'Неизвестная ошибка сервера',
        );
      },
    });
  },
});

export const ruleSize = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'array',
  validator: async (rule: Rule, value: Array<string> | undefined) => {
    if (!value) {
      throw new Error('Поле обязательно для заполнения');
    }

    const sizes = await Dictionaries.sizes({
      onRequestError: () => {
        throw new Error('Неизвестная ошибка');
      },
      onResponseError: () => {
        throw new Error('Неизвестная ошибка');
      },
    });

    for (const size of value) {
      if (!getEnumFromDictionary(sizes).includes(size)) {
        throw new Error('Недопустимое значение');
      }
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

    const creatureTypes = await Dictionaries.creatureTypes({
      onRequestError: () => {
        throw new Error('Неизвестная ошибка');
      },
      onResponseError: () => {
        throw new Error('Неизвестная ошибка');
      },
    });

    if (!getEnumFromDictionary(creatureTypes).includes(value)) {
      throw new Error('Недопустимое значение');
    }
  },
});
