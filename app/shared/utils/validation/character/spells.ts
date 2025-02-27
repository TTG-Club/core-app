import type { Rule } from 'ant-design-vue/es/form';
import { baseStringCheck } from '../base';
import { StatusCodes } from 'http-status-codes';
import type { SpellMaterialComponent } from '~/shared/types';

export const ruleUrl = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: (rule: Rule, value: string) =>
    new Promise((resolve, reject) => {
      baseStringCheck(value, 3);

      $fetch(`/api/v2/spells/${value}`, {
        method: 'head',
        retry: false,
        onRequestError: () => {
          reject('Неизвестная ошибка');
        },
        onResponseError: (response) => {
          if (response.response.status === StatusCodes.NOT_FOUND) {
            return resolve();
          }

          return reject('Неизвестная ошибка');
        },
      }).then(() => reject('Такое заклинание уже существует'));
    }),
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
