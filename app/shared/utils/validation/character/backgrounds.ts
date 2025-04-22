import { StatusCodes } from 'http-status-codes';
import { isArray } from 'lodash-es';

import { baseStringCheck } from '../base';

import type { Rule } from 'ant-design-vue/es/form';
import type { RouteParamValue } from 'vue-router';

export const ruleUrl = (
  oldUrl?: RouteParamValue | RouteParamValue[],
): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: (rule: Rule, value: string) =>
    new Promise((resolve, reject) => {
      if (isArray(oldUrl)) {
        reject('Неизвестная ошибка');

        return;
      }

      if (oldUrl === value) {
        resolve();

        return;
      }

      baseStringCheck(value, 3);

      $fetch(`/api/v2/background/${value}`, {
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
      }).then(() => reject('Такая предыстория уже существует'));
    }),
});
