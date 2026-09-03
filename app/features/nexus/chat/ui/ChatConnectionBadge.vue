<script setup lang="ts">
  import type { ChatConnectionStatus } from '../../model';

  import {
    CHAT_CONNECTION_COLORS,
    CHAT_CONNECTION_LABELS,
    CHAT_RECONNECT_LABEL,
  } from '../../model';

  const { status, canReconnect } = defineProps<{
    status: ChatConnectionStatus;
    /** Попытки исчерпаны — подключиться можно только вручную. */
    canReconnect: boolean;
  }>();

  const emit = defineEmits<{
    reconnect: [];
  }>();

  const color = computed(() => CHAT_CONNECTION_COLORS[status]);
  const label = computed(() => CHAT_CONNECTION_LABELS[status]);

  const isBusy = computed(
    () => status === 'connecting' || status === 'reconnecting',
  );
</script>

<template>
  <div class="flex items-center gap-2">
    <UBadge
      :color="color"
      variant="subtle"
      size="sm"
      :icon="isBusy ? 'tabler:loader-2' : 'tabler:antenna-bars-5'"
      :label="label"
      :ui="{ leadingIcon: isBusy ? 'animate-spin' : '' }"
    />

    <UButton
      v-if="canReconnect"
      size="xs"
      color="neutral"
      variant="link"
      icon="tabler:refresh"
      class="px-0"
      :label="CHAT_RECONNECT_LABEL"
      @click.left.exact.prevent="emit('reconnect')"
    />
  </div>
</template>
