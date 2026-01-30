<script setup lang="ts">
  import type { HistoryEntry } from '~dice-roller/types';

  defineProps<{
    history: HistoryEntry[];
  }>();

  const scrollElementModel = defineModel<HTMLElement | null>('scrollElement');
  const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer');

  watchEffect(() => {
    scrollElementModel.value = scrollContainer.value;
  });

  const dayjs = useDayjs();

  function formatDateTime(iso: string): string | undefined {
    const date = dayjs(iso);

    if (!date.isValid()) {
      return undefined;
    }

    return date.local().format('LLL');
  }
</script>

<template>
  <div class="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
    <div class="flex h-full min-h-0 flex-col gap-3">
      <div
        ref="scrollContainer"
        class="flex h-full flex-col overflow-y-auto pr-1"
      >
        <ul class="mt-auto flex flex-col gap-2 pt-4">
          <template
            v-for="entry in history"
            :key="entry.id"
          >
            <slot
              name="item"
              :entry="entry"
              :formatted-date-time="formatDateTime(entry.timestamp)"
            />
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>
