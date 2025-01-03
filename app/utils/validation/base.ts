import type { Rule } from 'ant-design-vue/es/form';
import { isNumber } from 'lodash-es';

/**
 * Ищет нерусские буквы и все остальное, кроме пробела, апострофа, дефисов, тире и цифр.
 */
export const onlyRusString =
  /[^0-9\u{0410}-\u{044F}\u{401}\u{0451}\u{0020}\u{0027}\u{2010}-\u{2014}\u{002D}\u{0028}\u{0029}]/u;

/**
 * Ищет неанглийские буквы и все остальное, кроме пробела, апострофа, дефисов, тире и цифр.
 */
export const onlyEngString =
  /[^0-9\u{0041}-\u{005A}\u{0061}-\u{007A}\u{0020}\u{0027}\u{2010}-\u{2014}\u{002D}\u{0028}\u{0029}]/u;

export const baseStringCheck = (str: string, min?: number, max?: number) => {
  if (!str) {
    throw new Error('Поле обязательно для заполнения');
  }

  if (isNumber(min) && str.length < min) {
    throw new Error(`Не менее ${min} символов`);
  }

  if (isNumber(max) && str.length > max) {
    throw new Error(`Не более ${max} символов`);
  }

  if (/^\s/.test(str) || /\s$/.test(str)) {
    throw new Error('В начале и конце не может быть пробелов');
  }
};

export const ruleRusName = (): Rule => {
  const min = 3;
  const max = 1000;

  return {
    min,
    max,
    required: true,
    trigger: ['change', 'blur'],
    type: 'string',
    transform: (value: string) => value.trim(),
    validator: (rule: Rule, value: string) => {
      baseStringCheck(value, min, max);

      if (onlyRusString.test(value)) {
        throw new Error(
          'Допустимы только русские буквы, арабские цифры, круглые скобки, дефис, апостроф и пробел',
        );
      }

      return Promise.resolve();
    },
  };
};

export const ruleEngName = (): Rule => {
  const min = 3;
  const max = 1000;

  return {
    min,
    max,
    required: true,
    trigger: ['change', 'blur'],
    type: 'string',
    transform: (value: string) => value.trim(),
    validator: (rule: Rule, value: string) => {
      baseStringCheck(value, min, max);

      if (onlyEngString.test(value)) {
        throw new Error(
          'Допустимы только английские буквы, арабские цифры, круглые скобки, дефис, апостроф и пробел',
        );
      }

      return Promise.resolve();
    },
  };
};

export const ruleSourcePage = (isBookSelected: boolean = false): Rule => ({
  required: isBookSelected,
  trigger: ['change', 'blur'],
  type: 'integer',
  validator: (rule: Rule, value: number) => {
    if (!isBookSelected && isNumber(value)) {
      throw new Error('Нельзя указывать страницу, если книга не выбрана');
    }

    if (!isBookSelected) {
      return Promise.resolve();
    }

    if (!value) {
      throw new Error('Необходимо указать страницу');
    }

    if (value > 1000) {
      throw new Error('Таких больших справочников не бывает');
    }

    return Promise.resolve();
  },
});

export const ruleImage = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'url',
  validator: (rule: Rule, value: string) => {
    if (!value) {
      throw new Error('Необходимо добавить превью для страницы');
    }

    return Promise.resolve();
  },
});
