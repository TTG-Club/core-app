import type { SelectValue } from 'ant-design-vue/es/select';
import { chain, difference, isArray, isString, trim } from 'lodash-es';
import type { DefaultOptionType } from 'ant-design-vue/es/vc-select/Select';

export const useTagsInput = () => {
  const tags = ref<Array<string>>([]);

  const options = computed<Array<DefaultOptionType>>(() =>
    tags.value.map((tag) => ({
      label: tag,
      value: tag,
    })),
  );

  const updateTags = (value: SelectValue) => {
    if (!value || !(isString(value) || isArray(value))) {
      return;
    }

    const collection = chain(isString(value) ? [value] : value)
      .filter(isString)
      .map(trim)
      .union()
      .value();

    tags.value.push(...difference(collection, tags.value));
  };

  return {
    tags,
    options,

    updateTags,
  };
};
