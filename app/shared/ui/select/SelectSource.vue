<script setup lang="ts">
  import type { BookLink, SelectOptionWithShortName } from '~/shared/types';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

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
</script>

<template>
  <USelect
    v-model="model"
    :loading="status === 'pending'"
    :items="data || []"
    :multiple="multiple"
    :disabled="disabled"
    placeholder="Выбери книгу"
    searchable
    clearable
    @open="handleDropdownOpening(true)"
  />
</template>
