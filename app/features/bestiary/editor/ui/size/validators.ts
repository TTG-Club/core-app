import { Dictionaries } from '~/shared/api';
import { ValidationDictionaries } from '~/shared/utils';

import type { Rule } from 'ant-design-vue/es/form';

export const BeastSizeRule = (): Rule => ({
  required: true,
  trigger: ['change', 'blur'],
  type: 'string',
  validator: async (rule: Rule, value: string | undefined) => {
    if (!value) {
      throw new Error('Поле обязательно для заполнения');
    }

    const beastSize = await Dictionaries.sizes();

    ValidationDictionaries.validateFromDictionary(value, beastSize);
  },
});
