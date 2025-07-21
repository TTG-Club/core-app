<script setup lang="ts">
  import { DictionaryService } from '~/shared/api';

  const { disabled } = defineProps<{
    disabled?: boolean;
  }>();

  const model = defineModel<number>();
  const pb = defineModel<number>('proficiency-bonus');

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-challenge-rating',
    () => DictionaryService.challengeRating(),
    { dedupe: 'defer' },
  );

  const items = computed(() =>
    data.value?.map((item) => ({
      ...item,
      onSelect: () => {
        model.value = item.value;
        pb.value = item.pb;
      },
    })),
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!data.value?.length && !state) {
      return;
    }

    refresh();
  };
</script>

<template>
  <USelect
    v-model="model"
    :loading="status === 'pending'"
    :items
    :disabled="disabled"
    placeholder="Выбери показатель опасности"
    searchable
    @update:open="handleDropdownOpening(true)"
  />
</template>
