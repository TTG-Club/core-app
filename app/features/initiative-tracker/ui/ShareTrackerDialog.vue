<script setup lang="ts">
  import type { InitiativeTracker } from '../model';

  import { useClipboard } from '@vueuse/core';

  const props = defineProps<{
    tracker: InitiativeTracker;
    open: boolean;
    pending?: boolean;
  }>();

  const emit = defineEmits<{
    'update:open': [value: boolean];
    'enable': [];
    'disable': [];
  }>();

  const origin = computed(() => {
    if (!import.meta.client) {
      return '';
    }

    return window.location.origin;
  });

  const sharePath = computed(() => {
    if (!props.tracker.shareToken) {
      return '';
    }

    return `/tools/initiative-tracker/shared/${props.tracker.shareToken}`;
  });

  const shareUrl = computed(() => `${origin.value}${sharePath.value}`);
  const { copy, copied, isSupported } = useClipboard({ source: shareUrl });

  function emitOpenUpdate(value: boolean): void {
    emit('update:open', value);
  }

  function emitEnable(): void {
    emit('enable');
  }

  function emitDisable(): void {
    emit('disable');
  }

  async function copyShareUrl(): Promise<void> {
    if (!shareUrl.value) {
      return;
    }

    await copy(shareUrl.value);
  }
</script>

<template>
  <UModal
    :open
    title="Поделиться трекером"
    @update:open="emitOpenUpdate"
  >
    <template #body>
      <div class="grid gap-4">
        <UAlert
          icon="tabler:eye"
          color="neutral"
          variant="soft"
          title="Shared-страница доступна только для просмотра"
        />

        <div
          v-if="tracker.shareToken"
          class="grid gap-2"
        >
          <UFormField label="Ссылка">
            <UInput
              :model-value="shareUrl"
              readonly
            />
          </UFormField>

          <div class="flex flex-wrap gap-2">
            <UButton
              icon="tabler:copy"
              :disabled="!isSupported"
              @click.left.exact.prevent="copyShareUrl"
            >
              {{ copied ? 'Скопировано' : 'Скопировать' }}
            </UButton>

            <UButton
              icon="tabler:link-off"
              color="error"
              variant="soft"
              :loading="pending"
              @click.left.exact.prevent="emitDisable"
            >
              Отключить
            </UButton>
          </div>
        </div>

        <UButton
          v-else
          icon="tabler:link-plus"
          :loading="pending"
          @click.left.exact.prevent="emitEnable"
        >
          Создать ссылку
        </UButton>
      </div>
    </template>
  </UModal>
</template>
