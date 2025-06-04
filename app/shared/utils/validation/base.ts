import { isNumber } from 'lodash-es';

import type { Rule } from 'ant-design-vue/es/form';
import type {
  SelectOption,
  SelectOptionWithNumericValue,
} from '~/shared/types';

export const getEnumFromDictionary = <
  T extends SelectOption | SelectOptionWithNumericValue,
>(
  dictionary: Array<T>,
): Array<T['value']> => dictionary.map((option) => option.value);

/**
 * Ищет нерусские буквы и все остальное, кроме пробела, апострофа, косой черты, дефисов, тире и цифр.
 */
export const onlyRusString =
  /[^0-9\u{0410}-\u{044F}\u{401}\u{0451}\u{0020}\u{0027}\u{2010}-\u{2014}\u{002D}\u{0028}\u{0029}\u{002F}\u{002B}\u{002C}]/u;

/**
 * Ищет неанглийские буквы и все остальное, кроме пробела, апострофа, косой черты, дефисов, тире и цифр.
 */
export const onlyEngString =
  /[^0-9\u{0041}-\u{005A}\u{0061}-\u{007A}\u{0020}\u{0027}\u{2010}-\u{2014}\u{002D}\u{0028}\u{0029}\u{002F}\u{002B}\u{002C}]/u;

export const baseStringCheck = (
  str: string,
  required: boolean,
  min?: number,
  max?: number,
) => {
  if (!required && !str) {
    return;
  }

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

export const ruleString = (required = true): Rule => ({
  required,
  type: 'string',
  trigger: ['blur', 'change'],
  message: 'Поле обязательно для заполнения',
});

export const ruleNumber = (required = true): Rule => ({
  required,
  type: 'integer',
  trigger: ['blur', 'change'],
  message: 'Поле обязательно для заполнения',
});

export const ruleRusName = (required = true): Rule => {
  const min = 3;
  const max = 1000;

  return {
    min,
    max,
    required,
    trigger: ['change', 'blur'],
    type: 'string',
    transform: (value: string) => value.trim(),
    validator: (rule: Rule, value: string) => {
      baseStringCheck(value, required, min, max);

      if (onlyRusString.test(value)) {
        throw new Error(
          'Допустимы только русские буквы, арабские цифры, круглые скобки, косая черта, дефис, апостроф, плюс, запятая и пробел',
        );
      }

      return Promise.resolve();
    },
  };
};

export const ruleEngName = (required = true): Rule => {
  const min = 3;
  const max = 1000;

  return {
    min,
    max,
    required,
    trigger: ['change', 'blur'],
    type: 'string',
    transform: (value: string) => value.trim(),
    validator: (rule: Rule, value: string) => {
      baseStringCheck(value, required, min, max);

      if (onlyEngString.test(value)) {
        throw new Error(
          'Допустимы только английские буквы, арабские цифры, круглые скобки, косая черта, дефис, апостроф, плюс, запятая и пробел',
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
