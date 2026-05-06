<script setup lang="ts">
  import type { InitiativeTracker } from '../model';

  import { TRACKER_STATUS_LABELS } from '../model';

  defineProps<{
    tracker: InitiativeTracker;
    readonly?: boolean;
  }>();

  const emit = defineEmits<{
    'open-share': [];
  }>();

  function emitOpenShare(): void {
    emit('open-share');
  }
</script>

<template>
  <header
    class="sticky top-0 z-10 -mx-4 border-b border-default bg-default/90 px-4 py-3 backdrop-blur"
  >
    <div
      class="mx-auto flex max-w-330 flex-wrap items-center justify-between gap-3"
    >
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="truncate text-xl font-bold text-highlighted">
            {{ tracker.title }}
          </h1>

          <UBadge
            variant="soft"
            color="primary"
          >
            {{ TRACKER_STATUS_LABELS[tracker.status] }}
          </UBadge>
        </div>

        <p class="text-sm text-muted">Раунд {{ tracker.currentRound }}</p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          v-if="!readonly"
          icon="tabler:share-3"
          variant="soft"
          color="neutral"
          @click.left.exact.prevent="emitOpenShare"
        >
          Поделиться
        </UButton>
      </div>
    </div>
  </header>
</template>
