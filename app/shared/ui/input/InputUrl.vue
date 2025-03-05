<script setup lang="ts">
  import { getSlug } from '~~/shared/utils';
  import { Form } from 'ant-design-vue';
  import type { SelectOptionWithShortName } from '~/shared/types';

  const props = withDefaults(
    defineProps<{
      engName: string;
      sourceUrl: string | undefined;
      addonBefore?: string;
    }>(),
    {
      enName: '',
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

  function getSlugifyUrl(value: string) {
    return getSlug(value, {
      trim: true,
      lowercase: true,
      allowedChars: 'a-zA-Z0-9-',
    });
  }

  function handleUrlChange(url: string | undefined) {
    model.value = url ? getSlugifyUrl(url) : undefined;

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
    flush: 'pre',
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
