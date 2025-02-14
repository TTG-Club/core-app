import type { Rule } from 'ant-design-vue/es/form';
import { baseStringCheck } from '../base';
import { StatusCodes } from 'http-status-codes';

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
