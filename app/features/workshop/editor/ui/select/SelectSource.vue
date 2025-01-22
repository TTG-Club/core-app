<script setup lang="ts">
  import type { BookLink } from '~/shared/types';

  withDefaults(
    defineProps<{
      multiple?: boolean;
    }>(),
    {
      multiple: false,
    },
  );

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'books-select',
    async () => {
      const bookLinks = await $fetch<Array<BookLink>>('/api/v2/books/search', {
        method: 'post',
      });

      return bookLinks.map((book) => ({
        label: `${book.name.rus} [${book.name.eng}]`,
        value: book.url,
        shortName: book.name.short,
      }));
    },
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
  };
</script>

<template>
  <ASelect
    v-model:value="model"
    :loading="status === 'pending'"
    :options="data || []"
    :mode="multiple ? 'multiple' : undefined"
    placeholder="Выбери книгу"
    max-tag-count="responsive"
    allow-clear
    show-search
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
