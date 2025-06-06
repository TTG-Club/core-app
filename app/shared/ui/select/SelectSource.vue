<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import type { BookLink, SelectOptionWithShortName } from '~/shared/types';

  const { multiple = false } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData<
    Array<SelectOptionWithShortName>
  >(
    'books',
    async () => {
      const bookLinks = await $fetch<Array<BookLink>>('/api/v2/books/search', {
        method: 'post',
      });

      return bookLinks.map((book) => ({
        label: `${book.name.rus} [${book.name.eng}]`,
        value: book.url,
        shortName: book.name.label,
      }));
    },
    { dedupe: 'defer' },
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
  };

  watch(model, () => {
    context.onFieldChange();
  });
</script>

<template>
  <ASelect
    v-model:value="model"
    :loading="status === 'pending'"
    :options="data || []"
    :mode="multiple ? 'multiple' : undefined"
    :disabled
    placeholder="Выбери книгу"
    max-tag-count="responsive"
    allow-clear
    show-search
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
