<script setup lang="ts">
  import type { SpellClassPageGroup } from '../model';

  import SpellClassGroup from './SpellClassGroup.vue';

  defineProps<{
    groups: Array<SpellClassPageGroup>;
  }>();

  const emit = defineEmits<{
    'load-more': [classKey: string];
  }>();

  /** Запрашивает следующую страницу выбранного класса. */
  function handleLoadMore(classKey: string): void {
    emit('load-more', classKey);
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <SpellClassGroup
      v-for="classGroup in groups"
      :key="classGroup.key"
      :group="classGroup"
      @load-more="handleLoadMore"
    />
  </div>
</template>
