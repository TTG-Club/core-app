<script setup lang="ts">
  import {
    MAX_INITIATIVE_BONUS,
    MAX_PARTICIPANT_NAME_LENGTH,
    MAX_PLAYERS,
    MIN_INITIATIVE_BONUS,
  } from '~initiative/model';

  const {
    disabled = false,
    loading = false,
    count = 0,
  } = defineProps<{
    disabled?: boolean;
    loading?: boolean;
    count?: number;
  }>();

  const emit = defineEmits<{
    add: [name: string, bonus: number];
  }>();

  const name = ref('');
  const bonus = ref(0);

  const canSubmit = computed(() => Boolean(name.value.trim()) && !disabled);

  // Счётчик краснеет, когда лимит игроков исчерпан (форма недоступна).
  const countColorClass = computed(() =>
    disabled ? 'text-error' : 'text-muted',
  );

  function submit(): void {
    if (!canSubmit.value || loading) {
      return;
    }

    emit('add', name.value.trim(), bonus.value);
    name.value = '';
    bonus.value = 0;
  }
</script>

<template>
  <form
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
    @submit.prevent="submit"
  >
    <div class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon
        name="tabler:user-plus"
        class="size-5 text-primary"
      />
      Игрок

      <span
        class="ml-auto shrink-0 text-xs font-normal tabular-nums"
        :class="countColorClass"
      >
        {{ count }} / {{ MAX_PLAYERS }}
      </span>
    </div>

    <div class="flex items-end gap-2">
      <UFormField
        label="Имя игрока"
        class="min-w-0 flex-1"
      >
        <UInput
          v-model="name"
          placeholder="Арагорн"
          :maxlength="MAX_PARTICIPANT_NAME_LENGTH"
          :disabled
        />
      </UFormField>

      <UFormField
        label="Бонус"
        class="shrink-0"
      >
        <UInputNumber
          v-model="bonus"
          :min="MIN_INITIATIVE_BONUS"
          :max="MAX_INITIATIVE_BONUS"
          :disabled
          class="w-28"
        />
      </UFormField>

      <UButton
        type="submit"
        icon="tabler:plus"
        class="shrink-0"
        :loading
        :disabled="!canSubmit || loading"
        aria-label="Добавить игрока"
      />
    </div>
  </form>
</template>
