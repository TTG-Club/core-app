<script setup lang="ts">
  import { clamp } from 'es-toolkit';

  import {
    DEFAULT_ARMOR_CLASS,
    MAX_ARMOR_CLASS,
    MIN_ARMOR_CLASS,
  } from '~initiative/model';

  import ParticipantStatTile from './ParticipantStatTile.vue';

  const { current = undefined, disabled = false } = defineProps<{
    /** КД игрока (нет записи — не задан, в плитке прочерк). */
    current?: number;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    change: [value: number];
  }>();

  const isOpen = ref(false);

  const display = computed(() =>
    current !== undefined ? String(current) : '—',
  );

  const draft = ref<number | null>(DEFAULT_ARMOR_CLASS);

  // Черновик следует за актуальным значением при каждом открытии попапа.
  watch(
    () => isOpen.value,
    (open) => {
      if (open) {
        draft.value = current ?? DEFAULT_ARMOR_CLASS;
      }
    },
  );

  /** Применяет КД из черновика; пустое поле закрывает попап без изменений. */
  function applyDraft(): void {
    isOpen.value = false;

    if (typeof draft.value !== 'number') {
      return;
    }

    const clamped = clamp(draft.value, MIN_ARMOR_CLASS, MAX_ARMOR_CLASS);

    if (clamped !== current) {
      emit('change', clamped);
    }
  }
</script>

<template>
  <UPopover
    v-model:open="isOpen"
    class="w-full"
  >
    <!-- Триггер — плитка КД: клик открывает попап ввода значения. -->
    <button
      type="button"
      class="w-full cursor-pointer rounded-lg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      :disabled
      aria-label="Изменить КД"
    >
      <ParticipantStatTile
        label="КД"
        class="w-full transition-colors hover:border-accented"
      >
        {{ display }}
      </ParticipantStatTile>
    </button>

    <template #content>
      <div class="flex w-44 items-center gap-2 p-3">
        <UInputNumber
          v-model="draft"
          :min="MIN_ARMOR_CLASS"
          :max="MAX_ARMOR_CLASS"
          class="flex-1"
          aria-label="КД игрока"
          @keydown.enter.prevent="applyDraft"
        />

        <UButton
          color="neutral"
          variant="subtle"
          @click.left.exact.prevent="applyDraft"
        >
          ОК
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
