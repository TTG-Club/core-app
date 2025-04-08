import { isNumber, omit, uniq } from 'lodash-es';

import type { Rule } from 'ant-design-vue/es/form';

export type BaseRule = Omit<Rule, 'validator' | 'transform' | 'type'>;

export type BaseRuleWithCheckExist = BaseRule & { checkExist?: boolean };

export const emailRegexp = /^[\w.%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const ALLOWED_SPECIAL_CHARACTERS = [
  "'",
  '-',
  '!',
  '"',
  '#',
  '$',
  '%',
  '&',
  '(',
  ')',
  '*',
  ',',
  '.',
  '/',
  ':',
  ';',
  '?',
  '@',
  '[',
  ']',
  '^',
  '_',
  '`',
  '{',
  '|',
  '}',
  '~',
  '+',
  '<',
  '=',
  '>',
];

const checkUsernameOrEmailExist = async (
  value: string,
  type: 'username' | 'email',
) => {
  try {
    const isExist = await $fetch<boolean>(`/api/auth/exist`, {
      method: 'get',
      query: {
        [type]: value,
      },
    });

    if (isExist) {
      switch (type) {
        case 'username':
          return Promise.reject('Имя пользователя уже занято');

        case 'email':
          return Promise.reject('Электронный адрес уже занят');

        default:
          return Promise.reject('Неизвестная ошибка');
      }
    }

    return Promise.resolve();
  } catch (err) {
    throw new Error('Неизвестная ошибка');
  }
};

export const ruleUsername = (config?: BaseRuleWithCheckExist): Rule => {
  const options: Rule = {
    required: true,
    trigger: ['change'],
    max: 1000,
    min: 3,
    ...omit(config, 'checkExist'),
  };

  return {
    ...options,
    type: 'string',
    validator: async (rule: Rule, value: string) => {
      if (options.required && !value?.length) {
        throw new Error('Поле обязательно для заполнения');
      }

      if (isNumber(options.max) && value.length > options.max) {
        throw new Error(`Не более ${options.max} символов`);
      }

      if (isNumber(options.min) && value.length < options.min) {
        throw new Error(`Не менее ${options.min} символов`);
      }

      if (/^\s/.test(value) || /\s$/.test(value)) {
        throw new Error('В начале и конце не может быть пробелов');
      }

      if (/[^\w\-.]/.test(value)) {
        throw new Error(
          'Допустимы латинские буквы, арабские цифры, подчеркивание, дефис, точка',
        );
      }

      if (config?.checkExist) {
        await checkUsernameOrEmailExist(value, 'username');
      }

      return Promise.resolve();
    },
  };
};

export const ruleEmail = (
  config?: Omit<BaseRuleWithCheckExist, 'min'>,
): Rule => {
  const options: Rule = {
    required: true,
    trigger: ['change'],
    max: 1000,
    ...omit(config, 'checkExist'),
  };

  return {
    ...options,
    type: 'email',
    pattern: emailRegexp,
    validator: async (rule: Rule, value: string) => {
      if (options.required && !value?.length) {
        throw new Error('Поле обязательно для заполнения');
      }

      if (isNumber(options.max) && value.length > options.max) {
        throw new Error(`Не более ${options.max} символов`);
      }

      if (/^\s/.test(value) || /\s$/.test(value)) {
        throw new Error('В начале и конце не может быть пробелов');
      }

      if (!emailRegexp.test(value)) {
        throw new Error('Недопустимый формат адреса');
      }

      if (config?.checkExist) {
        await checkUsernameOrEmailExist(value, 'email');
      }

      return Promise.resolve();
    },
  };
};

export const rulePassword = (config?: BaseRule): Rule => {
  const options: Rule = {
    required: true,
    trigger: ['change'],
    max: 1000,
    min: 8,
    ...config,
  };

  return {
    ...options,
    type: 'string',
    validator(rule: Rule, value: string) {
      if (options.required && !value?.length) {
        throw new Error('Поле обязательно для заполнения');
      }

      if (isNumber(options.max) && value.length > options.max) {
        throw new Error(`Не более ${options.max} символов`);
      }

      if (isNumber(options.min) && value.length < options.min) {
        throw new Error(`Не менее ${options.min} символов`);
      }

      if (/^\s/.test(value) || /\s$/.test(value)) {
        throw new Error('В начале и конце не может быть пробелов');
      }

      if (/[^\w'\-!"#$%&()*,./:;?@[\]^`{|}~+<=>]+/.test(value)) {
        const match = value.match(/[^\w'\-!"#$%&()*,./:;?@[\]^`{|}~+<=>]+/g);
        const matched = match?.flatMap((str) => str.split(''));
        const list = uniq(matched);
        const baseMsg = 'Недопустимые символы';

        if (!list?.length) {
          throw new Error(baseMsg);
        }

        const visible = list.slice(0, 3).join(', ');
        const other = list.slice(3);

        throw new Error(
          `${baseMsg}: ${visible}${!other.length ? '' : `, +${other.length} др.`}`,
        );
      }

      if (!/[a-z]+/.test(value)) {
        throw new Error('Хотя бы одна буква в нижнем регистре');
      }

      if (!/[A-Z]+/.test(value)) {
        throw new Error('Хотя бы одна буква в верхнем регистре');
      }

      if (!/\d+/.test(value)) {
        throw new Error('Хотя бы одна цифра');
      }

      if (!/['\-!"#$%&()*,./:;?@[\]^_`{|}~+<=>]+/.test(value)) {
        throw new Error('Хотя бы один спец. символ');
      }

      return Promise.resolve();
    },
  };
};

export const rulePasswordRepeat = (
  password: MaybeRef<string>,
  config?: BaseRule,
): Rule => {
  const options: Rule = {
    required: true,
    trigger: ['change'],
    ...config,
  };

  return {
    ...options,
    type: 'string',
    validator: (rule: Rule, value: string) => {
      if (options.required && !value?.length) {
        throw new Error('Поле обязательно для заполнения');
      }

      if (value !== unref(password)) {
        throw new Error('Пароли не совпадают');
      }

      return Promise.resolve();
    },
  };
};
