<script setup lang="ts">
  import { useDiceRollerState } from '../composables/useDiceRollerState';

  const { history } = useDiceRollerState();
  const dayjs = useDayjs();

  const formatTime = (iso: string) => {
    return dayjs(iso).format('HH:mm');
  };
</script>

<template>
  <div
    v-if="history.length"
    class="flex flex-col gap-3"
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="m-0 font-semibold text-[var(--ui-text)]">История бросков</p>

        <span class="text-xs text-[var(--ui-text-muted)]">
          последние {{ history.length }}
        </span>
      </div>
    </div>

    <slot
      name="scroller"
      :format-time="formatTime"
    />
  </div>
</template>
