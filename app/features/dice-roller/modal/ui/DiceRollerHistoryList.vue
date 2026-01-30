<script setup lang="ts">
  import type { HistoryEntry } from '~dice-roller/types';

  const { history } = defineProps<{
    history: HistoryEntry[];
  }>();

  const scrollElementModel = defineModel<HTMLElement | null>('scrollElement');
  const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer');

  watchEffect(() => {
    scrollElementModel.value = scrollContainer.value;
  });
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <div class="flex h-full min-h-0 flex-col gap-3">
      <div
        ref="scrollContainer"
        class="flex h-full flex-col overflow-y-auto"
      >
        <ul class="mt-auto flex flex-col gap-2 p-4">
          <template
            v-for="entry in history"
            :key="entry.id"
          >
            <slot
              name="item"
              :entry="entry"
            />
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>
