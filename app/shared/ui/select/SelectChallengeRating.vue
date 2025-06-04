<script setup lang="ts">
  import { Form } from 'ant-design-vue';
  import { isNumber, isUndefined } from 'lodash-es';

  import { DictionaryService } from '~/shared/api';

  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { DefaultOptionType } from 'ant-design-vue/es/vc-select/Select';

  defineProps<{
    disabled?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<number>();
  const pb = defineModel<number>('proficiency-bonus');

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-challenge-rating',
    () => DictionaryService.challengeRating(),
    { dedupe: 'defer' },
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!data.value?.length && !state) {
      return;
    }

    refresh();
  };

  watch(model, () => {
    context.onFieldChange();
  });

  function change(value: SelectValue, option: DefaultOptionType) {
    if (!isNumber(value) && !isUndefined(value)) {
      throw new Error('[SelectChallengeRating] Invalid value');
    }

    model.value = value;
    pb.value = option.pb;
  }
</script>

<template>
  <ASelect
    :value="model"
    :loading="status === 'pending'"
    :options="data || []"
    :disabled
    placeholder="Выбери показатель опасности"
    show-search
    show-arrow
    @change="change"
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
