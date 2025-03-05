import type { Rule } from 'ant-design-vue/es/form';
import { baseStringCheck } from '../base';
import { StatusCodes } from 'http-status-codes';

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
