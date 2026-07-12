<script setup lang="ts">
  import type { CreatureOption } from '~initiative/model';

  import { useCreatureSearch } from '~initiative/composables';
  import {
    MAX_CREATURES,
    MAX_PARTICIPANT_NAME_LENGTH,
    MIN_CREATURE_BATCH,
  } from '~initiative/model';

  const {
    disabled = false,
    loading = false,
    remaining = 0,
    count = 0,
  } = defineProps<{
    disabled?: boolean;
    loading?: boolean;
    remaining?: number;
    count?: number;
  }>();

  const emit = defineEmits<{
    add: [url: string, count: number, name?: string];
  }>();

  const { searchTerm, options, isLoading } = useCreatureSearch();

  const selected = ref<CreatureOption | undefined>(undefined);
  const batchCount = ref(1);
  const nameOverride = ref('');

  const maxCount = computed(() => Math.max(MIN_CREATURE_BATCH, remaining));

  const canSubmit = computed(
    () => Boolean(selected.value) && !disabled && remaining > 0,
  );

  const emptyLabel = computed(() =>
    searchTerm.value.trim()
      ? 'Ничего не найдено'
      : 'Начните вводить название существа',
  );

  // Счётчик краснеет, когда лимит существ исчерпан (форма недоступна).
  const countColorClass = computed(() =>
    disabled ? 'text-error' : 'text-muted',
  );

  // Держим количество в пределах оставшихся мест.
  watch(
    () => remaining,
    (value) => {
      if (batchCount.value > value) {
        batchCount.value = Math.max(MIN_CREATURE_BATCH, value);
      }
    },
  );

  function submit(): void {
    if (!canSubmit.value || loading || !selected.value) {
      return;
    }

    const override = nameOverride.value.trim();

    emit('add', selected.value.url, batchCount.value, override || undefined);

    selected.value = undefined;
    searchTerm.value = '';
    nameOverride.value = '';
    batchCount.value = 1;
  }
</script>

<template>
  <form
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
    @submit.prevent="submit"
  >
    <div class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon
        name="tabler:paw"
        class="size-5 text-primary"
      />
      Существа из бестиария

      <span
        class="ml-auto shrink-0 text-xs font-normal tabular-nums"
        :class="countColorClass"
      >
        {{ count }} / {{ MAX_CREATURES }}
      </span>
    </div>

    <div class="flex flex-wrap items-end gap-2">
      <UFormField
        label="Существо"
        class="min-w-48 flex-1"
      >
        <UInputMenu
          v-model="selected"
          v-model:search-term="searchTerm"
          :items="options"
          :loading="isLoading"
          ignore-filter
          by="url"
          label-key="label"
          placeholder="Найти существо…"
          icon="tabler:search"
          class="w-full"
          :disabled
        >
          <template #item-trailing="{ item }">
            <UBadge
              v-if="item.challengeRating"
              size="sm"
              color="neutral"
              variant="subtle"
            >
              ПО {{ item.challengeRating }}
            </UBadge>
          </template>

          <template #empty>
            <span class="text-sm text-secondary">
              {{ emptyLabel }}
            </span>
          </template>
        </UInputMenu>
      </UFormField>

      <UFormField
        label="Имя (необязательно)"
        class="min-w-40 flex-1"
      >
        <UInput
          v-model="nameOverride"
          placeholder="Базовое имя из статблока"
          :maxlength="MAX_PARTICIPANT_NAME_LENGTH"
          class="w-full"
          :disabled
        />
      </UFormField>

      <UFormField
        label="Количество"
        class="shrink-0"
      >
        <UInputNumber
          v-model="batchCount"
          :min="MIN_CREATURE_BATCH"
          :max="maxCount"
          :disabled="disabled || remaining < 1"
          class="w-28"
        />
      </UFormField>

      <UButton
        type="submit"
        icon="tabler:plus"
        class="shrink-0"
        :loading
        :disabled="!canSubmit || loading"
        aria-label="Добавить существ"
      />
    </div>
  </form>
</template>
