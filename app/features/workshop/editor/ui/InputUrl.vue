<script setup lang="ts">
  import type { BookLink } from '~/shared/types';
  import { getSlug } from '~~/shared/utils';
  import { Form } from 'ant-design-vue';

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

  const model = defineModel<string>();

  const acronym = ref<string>();

  const getSlugifyUrl = (value: string) =>
    getSlug(value, {
      trim: true,
      lowercase: true,
      allowedChars: 'a-zA-Z0-9-',
    });

  const handleUrlChange = (url: string) => {
    model.value = getSlugifyUrl(url);

    context.onFieldChange();
  };

  const getBookAcronym = async (): Promise<string> => {
    if (!props.sourceUrl) {
      return '';
    }

    if (acronym.value) {
      return acronym.value;
    }

    try {
      const book = await $fetch<BookLink>(`/api/v2/books/${props.sourceUrl}`);

      return book.name.short;
    } catch (error) {
      return '';
    }
  };

  const setUrlWithAcronym = () => {
    if (!props.engName) {
      return;
    }

    const sourcePostfix = acronym.value ? `-${acronym.value}` : '';

    handleUrlChange(`${props.engName}${sourcePostfix}`);
  };

  watch(
    () => props.sourceUrl,
    async (value) => {
      acronym.value = undefined;

      if (value) {
        acronym.value = await getBookAcronym();
      }

      setUrlWithAcronym();
    },
  );

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
