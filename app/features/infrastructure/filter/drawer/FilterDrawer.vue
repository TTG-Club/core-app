<script setup lang="ts">
  import type { Filter } from '../types';

  import { cloneDeep } from 'es-toolkit';

  import { FilterList } from '../list';

  const { filter } = defineProps<{
    filter: Filter;
  }>();

  defineEmits<{
    (e: 'save', v: Filter): void;
    (e: 'reset'): void;
  }>();

  const opened = defineModel<boolean>();

  const cloned = ref<Filter>(filter);

  watch(opened, (value) => {
    if (!value) {
      return;
    }

    cloned.value = cloneDeep(filter);
  });
</script>

<template>
  <USlideover
    v-model:open="opened"
    title="Фильтры"
    :ui="{
      content: 'w-full max-w-192 min-w-80',
    }"
  >
    <template #body>
      <FilterList v-model="cloned" />
    </template>

    <template #footer>
      <div class="flex gap-2">
        <UButton @click.left.exact.prevent="$emit('save', cloned)">
          Применить
        </UButton>

        <UButton
          variant="ghost"
          color="error"
          trailing-icon="tabler:trash"
          @click.left.exact.prevent="$emit('reset')"
        >
          Сбросить
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
