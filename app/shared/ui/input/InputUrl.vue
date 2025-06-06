<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { getSlug } from '~~/shared/utils';

  import type { SelectOptionWithShortName } from '~/shared/types';

  const props = withDefaults(
    defineProps<{
      engName: string;
      sourceUrl?: string | undefined;
      addonBefore?: string;
    }>(),
    {
      sourceUrl: '',
      addonBefore: '',
    },
  );

  const context = Form.useInjectFormItemContext();

  const { data: books } =
    useNuxtData<Array<SelectOptionWithShortName>>('books');

  const model = defineModel<string>();

  const acronym = computed(() => {
    if (!props.sourceUrl || !books.value?.length) {
      return undefined;
    }

    const index = books.value.findIndex((el) => el.value === props.sourceUrl);

    if (index < 0) {
      return undefined;
    }

    return books.value[index]?.shortName;
  });

  function handleUrlChange(url: string | undefined) {
    model.value = url ? getSlug(url) : undefined;

    context.onFieldChange();
  }

  function setUrlWithAcronym() {
    if (!props.engName) {
      return;
    }

    const sourcePostfix = acronym.value ? `-${acronym.value}` : '';

    handleUrlChange(`${props.engName}${sourcePostfix}`);
  }

  watch(acronym, setUrlWithAcronym, {
    immediate: true,
  });

  watch(
    () => props.engName,
    () => {
      setUrlWithAcronym();
    },
  );
</script>

<template>
  <AInput
    :value="model"
    :addon-before="addonBefore || ''"
    placeholder="Сгенерированный URL"
    @update:value="handleUrlChange"
  />
</template>
