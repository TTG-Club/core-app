import { isArray, isUndefined } from 'lodash-es';

import { DictionaryService } from '~/shared/api';

import type { Rule } from 'ant-design-vue/es/form';
import type {
  SelectOption,
  SelectOptionWithNumericValue,
} from '~/shared/types';

interface Options {
  required?: boolean;
  array?: boolean;
}

class ValidationService {
  ruleTimeUnits = (options?: Options): Rule =>
    this.validator(DictionaryService.timeUnits, options);

  ruleMagicSchools = (options?: Options): Rule =>
    this.validator(DictionaryService.magicSchools, options);

  ruleSizes = (options?: Options): Rule =>
    this.validator(DictionaryService.sizes, options);

  ruleCreatureTypes = (options?: Options): Rule =>
    this.validator(DictionaryService.creatureTypes, options);

  ruleFeatCategories = (options?: Options): Rule =>
    this.validator(DictionaryService.featCategories, options);

  ruleRarity = (options?: Options): Rule =>
    this.validator(DictionaryService.rarity, options);

  ruleLanguages = (options?: Options): Rule =>
    this.validator(DictionaryService.languages, options);

  ruleSkills = (options?: Options): Rule =>
    this.validator(DictionaryService.skills, options);

  ruleHabitats = (options?: Options): Rule =>
    this.validator(DictionaryService.habitats, options);

  ruleTreasures = (options?: Options): Rule =>
    this.validator(DictionaryService.treasures, options);

  ruleAlignments = (options?: Options): Rule =>
    this.validator(DictionaryService.alignments, options);

  ruleMagicItemCategories = (options?: Options): Rule =>
    this.validator(DictionaryService.magicItemCategory, options);

  private validator = (
    dictionaryCallback: () => Promise<
      Array<SelectOption> | Array<SelectOptionWithNumericValue>
    >,
    options?: Options,
  ): Rule => {
    const required = isUndefined(options?.required) ? true : options.required;
    const array = isUndefined(options?.array) ? false : options.array;

    return {
      required,
      trigger: ['change', 'blur'],
      type: !array ? 'string' : 'array',
      validator: async (
        rule: Rule,
        value: string | Array<string> | undefined,
      ) => {
        if (!value) {
          throw new Error('Поле обязательно для заполнения');
        }

        const dictionary = await dictionaryCallback();

        this.validateFromDictionary(value, dictionary);
      },
    };
  };

  private validateFromDictionary = (
    value: string | number | Array<string | number>,
    dictionary: Array<SelectOption | SelectOptionWithNumericValue>,
  ) => {
    const _value = !isArray(value) ? [value] : value;

    if (
      _value.some(
        (item) => !this.getEnumFromDictionary(dictionary).includes(item),
      )
    ) {
      throw new Error('Недопустимое значение');
    }
  };

  private getEnumFromDictionary = <
    T extends SelectOption | SelectOptionWithNumericValue,
  >(
    dictionary: Array<T>,
  ): Array<T['value']> => dictionary.map((option) => option.value);
}

export const ValidationDictionaries = new ValidationService();
