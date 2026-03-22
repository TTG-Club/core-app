<script setup lang="ts">
  import type { FilterSection } from '../types';

  import { cloneDeep } from 'es-toolkit';

  import { FilterList } from '../list';

  defineEmits<{
    (e: 'save', value: FilterSection): void;
    (e: 'reset'): void;
  }>();

  const { sources } = defineProps<{
    sources: FilterSection;
  }>();

  const opened = defineModel<boolean>();

  const cloned = ref<FilterSection>(sources);

  watch(opened, (value) => {
    if (!value) {
      return;
    }

    cloned.value = cloneDeep(sources);
  });
</script>

<template>
  <USlideover
    v-model:open="opened"
    title="Источники"
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
