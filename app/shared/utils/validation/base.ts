import { isNumber } from 'lodash-es';

import type { Rule } from 'ant-design-vue/es/form';

class ValidationService {
  private onlyRusString =
    /[^0-9\u{0410}-\u{044F}\u{401}\u{0451}\u{0020}\u{0027}\u{2010}-\u{2014}\u{002D}\u{0028}\u{0029}\u{002F}\u{002B}\u{002C}]/u;

  private onlyEngString =
    /[^0-9\u{0041}-\u{005A}\u{0061}-\u{007A}\u{0020}\u{0027}\u{2010}-\u{2014}\u{002D}\u{0028}\u{0029}\u{002F}\u{002B}\u{002C}]/u;

  get rusStringRegex(): RegExp {
    return this.onlyRusString;
  }

  get engStringRegex(): RegExp {
    return this.onlyEngString;
  }

  baseStringCheck = (
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

  ruleString = (required = true): Rule => ({
    required,
    type: 'string',
    trigger: ['blur', 'change'],
    message: 'Поле обязательно для заполнения',
  });

  ruleNumber = (required = true): Rule => ({
    required,
    type: 'integer',
    trigger: ['blur', 'change'],
    message: 'Поле обязательно для заполнения',
  });

  ruleRusName = (required = true): Rule => {
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
        this.baseStringCheck(value, required, min, max);

        if (this.onlyRusString.test(value)) {
          throw new Error(
            'Допустимы только русские буквы, арабские цифры, круглые скобки, косая черта, дефис, апостроф, плюс, запятая и пробел',
          );
        }

        return Promise.resolve();
      },
    };
  };

  ruleEngName = (required = true): Rule => {
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
        this.baseStringCheck(value, required, min, max);

        if (this.onlyEngString.test(value)) {
          throw new Error(
            'Допустимы только английские буквы, арабские цифры, круглые скобки, косая черта, дефис, апостроф, плюс, запятая и пробел',
          );
        }

        return Promise.resolve();
      },
    };
  };

  ruleSourcePage = (isBookSelected: boolean = false): Rule => {
    return {
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
    };
  };

  ruleImage = (): Rule => ({
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
}

export const ValidationBase = new ValidationService();
