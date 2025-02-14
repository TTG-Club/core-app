import type { Rule } from 'ant-design-vue/es/form';
import { baseStringCheck } from '../base';
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

    return Promise.resolve();
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

      return Promise.resolve();
    },
  };
};
