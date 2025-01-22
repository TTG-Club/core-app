import type { Rule } from 'ant-design-vue/es/form';
import { Dictionaries } from '~/shared/api';
import { baseStringCheck, getEnumFromDictionary } from '../base';
import { StatusCodes } from 'http-status-codes';
import type { SpellMaterialComponent } from '~/shared/types';

export const ruleUrl = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: async (rule: Rule, value: string) => {
    baseStringCheck(value, 3);

    await $fetch(`/api/v2/spells/${value}`, {
      method: 'head',
      retry: false,
      onRequestError: () => {
        throw new Error('Неизвестная ошибка');
      },
      onResponseError: (response) => {
        throw new Error(
          response.response.status === StatusCodes.CONFLICT
            ? 'Такое заклинание уже существует'
            : 'Неизвестная ошибка сервера',
        );
      },
    });
  },
});

export const ruleSchool = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: async (rule: Rule, value: string | undefined) => {
    if (!value) {
      throw new Error('Поле обязательно для заполнения');
    }

    const creatureTypes = await Dictionaries.schools({
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

export const ruleMaterialComponentName = (
  component: SpellMaterialComponent,
): Rule => {
  const { price, comparison, consumable } = component;
  const required = typeof price === 'number' || !!comparison || consumable;

  return {
    required,
    trigger: ['change', 'blur'],
    type: 'string',
    transform: (value) => value.trim(),
    validator: (rule: Rule, value: string | undefined) => {
      if (required && !value) {
        throw new Error('Необходимо заполнить название');
      }
    },
  };
};

export const ruleTimeType = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: async (rule: Rule, value: string | undefined) => {
    if (!value) {
      throw new Error('Поле обязательно для заполнения');
    }

    const creatureTypes = await Dictionaries.timeTypes({
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
