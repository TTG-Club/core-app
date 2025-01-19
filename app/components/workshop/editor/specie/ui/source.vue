<script setup lang="ts">
  import type { BookLink } from '#shared/types/wiki/books';

  const model = defineModel<string>();

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
    placeholder="Выбери книгу"
    allow-clear
    show-search
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
