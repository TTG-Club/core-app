<script setup lang="ts">
  import { useDiceRollerState } from '../composables/useDiceRollerState';

  const { history } = useDiceRollerState();
  const dayjs = useDayjs();

  function formatTime(iso: string) {
    return dayjs(iso).format('HH:mm');
  }
</script>

<template>
  <div
    v-if="history.length"
    class="flex h-full min-h-0 flex-col gap-3"
  >
    <slot
      name="scroller"
      :format-time="formatTime"
    />
  </div>
</template>
