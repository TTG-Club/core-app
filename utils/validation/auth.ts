import type { Rule } from 'ant-design-vue/es/form';
import { isNumber, omit, uniq } from 'lodash-es';
import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

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
  const { $api } = useNuxtApp();

  try {
    await $api(`/auth/exist`, {
      method: 'post',
      query: {
        [type]: value,
      },
    });
  } catch (err) {
    if (
      !(err instanceof FetchError) ||
      err.statusCode !== StatusCodes.IM_A_TEAPOT
    ) {
      return Promise.reject('Неизвестная ошибка');
    }

    switch (type) {
      case 'username':
        return Promise.reject('Имя пользователя уже занято');

      case 'email':
        return Promise.reject('Электронный адрес уже занят');

      default:
        return Promise.reject('Неизвестная ошибка');
    }
  }
};

export const ruleUsername = (
  config?: BaseRule & { checkExist?: boolean },
): Rule => {
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
        return Promise.reject('Поле обязательно для заполнения');
      }

      if (isNumber(options.max) && value.length > options.max) {
        return Promise.reject(`Не более ${options.max} символов`);
      }

      if (isNumber(options.min) && value.length < options.min) {
        return Promise.reject(`Не менее ${options.min} символов`);
      }

      if (/^\s/.test(value) || /\s$/.test(value)) {
        return Promise.reject('В начале и конце не может быть пробелов');
      }

      if (/[^\w\-.]/.test(value)) {
        return Promise.reject('Допустимы латинские буквы, 0-9 - _ .');
      }

      if (!config?.checkExist) {
        return Promise.resolve();
      }

      return checkUsernameOrEmailExist(value, 'username');
    },
  };
};

export const ruleEmail = (
  config?: Omit<BaseRule, 'min'> & { checkExist?: boolean },
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
        return Promise.reject('Поле обязательно для заполнения');
      }

      if (isNumber(options.max) && value.length > options.max) {
        return Promise.reject(`Не более ${options.max} символов`);
      }

      if (/^\s/.test(value) || /\s$/.test(value)) {
        return Promise.reject('В начале и конце не может быть пробелов');
      }

      if (!emailRegexp.test(value)) {
        return Promise.reject('Недопустимый формат адреса');
      }

      if (!config?.checkExist) {
        return Promise.resolve();
      }

      return checkUsernameOrEmailExist(value, 'email');
    },
  };
};

export const rulePassword = (
  config?: Omit<Rule, 'validator' | 'transform' | 'type'>,
): Rule => {
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
        return Promise.reject('Поле обязательно для заполнения');
      }

      if (isNumber(options.max) && value.length > options.max) {
        return Promise.reject(`Не более ${options.max} символов`);
      }

      if (isNumber(options.min) && value.length < options.min) {
        return Promise.reject(`Не менее ${options.min} символов`);
      }

      if (/^\s/.test(value) || /\s$/.test(value)) {
        return Promise.reject('В начале и конце не может быть пробелов');
      }

      if (/[^\w'\-!"#$%&()*,./:;?@[\]^`{|}~+<=>]+/.test(value)) {
        const match = value.match(/[^\w'\-!"#$%&()*,./:;?@[\]^`{|}~+<=>]+/g);
        const matched = match?.flatMap((str) => str.split(''));
        const list = uniq(matched);
        const baseMsg = 'Недопустимые символы';

        if (!list?.length) {
          return Promise.reject(baseMsg);
        }

        const visible = list.slice(0, 3).join(', ');
        const other = list.slice(3);

        return Promise.reject(
          `${baseMsg}: ${visible}${!other.length ? '' : `, +${other.length} др.`}`,
        );
      }

      if (!/[a-z]+/.test(value)) {
        return Promise.reject('Хотя бы одна буква в нижнем регистре');
      }

      if (!/[A-Z]+/.test(value)) {
        return Promise.reject('Хотя бы одна буква в верхнем регистре');
      }

      if (!/\d+/.test(value)) {
        return Promise.reject('Хотя бы одна цифра');
      }

      if (!/['\-!"#$%&()*,./:;?@[\]^_`{|}~+<=>]+/.test(value)) {
        return Promise.reject('Хотя бы один спец. символ');
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
        return Promise.reject('Поле обязательно для заполнения');
      }

      if (value !== unref(password)) {
        return Promise.reject('Пароли не совпадают');
      }

      return Promise.resolve();
    },
  };
};
