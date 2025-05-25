import { StatusCodes } from 'http-status-codes';
import { isString } from 'lodash-es';

import { ValidationBase } from '~/shared/utils';

import type { Rule } from 'ant-design-vue/es/form';
import type { RouteParamValue } from 'vue-router';

export const ruleUrl = (
  section: string,
  oldUrl?: RouteParamValue | RouteParamValue[],
): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: (rule: Rule, value: string) =>
    new Promise((resolve, reject) => {
      if (!isString(oldUrl)) {
        reject('Неизвестная ошибка');

        return;
      }

      if (oldUrl === value) {
        resolve();

        return;
      }

      ValidationBase.baseStringCheck(value, 3);

      $fetch(`/api/v2/${section}/${value}`, {
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
      }).then(() => reject('Такая url уже существует'));
    }),
});
