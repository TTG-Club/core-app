<script setup lang="ts">
  import type { FilterGroups } from '../types';

  import { cloneDeep } from 'es-toolkit';

  import { FilterList } from '../list';

  defineEmits<{
    (event: 'save', value: FilterGroups): void;
    (event: 'reset'): void;
  }>();

  const { groups, title } = defineProps<{
    groups: FilterGroups;
    title: string;
  }>();

  const opened = defineModel<boolean>();

  const cloned = ref<FilterGroups>(cloneDeep(groups));

  watch(opened, (value) => {
    if (!value) {
      return;
    }

    cloned.value = cloneDeep(groups);
  });
</script>

<template>
  <USlideover
    v-model:open="opened"
    :title
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
