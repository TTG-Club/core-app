<script setup lang="ts">
  import type { EncounterPartyRow } from '../model';

  import {
    MAX_CHARACTER_LEVEL,
    MAX_ROW_COUNT,
    MIN_CHARACTER_LEVEL,
    MIN_ROW_COUNT,
  } from '../model';

  const { party, canAdd = true } = defineProps<{
    party: Array<EncounterPartyRow>;
    canAdd?: boolean;
  }>();

  const emit = defineEmits<{
    add: [];
    update: [
      id: string,
      patch: Partial<Pick<EncounterPartyRow, 'level' | 'count'>>,
    ];
    remove: [id: string];
  }>();

  const characterCount = computed(() =>
    party.reduce((total, row) => total + row.count, 0),
  );

  function handleCountUpdate(
    id: string,
    value: number | null | undefined,
  ): void {
    if (typeof value === 'number') {
      emit('update', id, { count: value });
    }
  }

  function handleLevelUpdate(
    id: string,
    value: number | null | undefined,
  ): void {
    if (typeof value === 'number') {
      emit('update', id, { level: value });
    }
  }
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-xl border border-default bg-muted p-4"
  >
    <div class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon
        name="tabler:users"
        class="size-5 text-primary"
      />
      Группа

      <span class="ml-auto text-xs font-normal text-muted tabular-nums">
        Персонажей: {{ characterCount }}
      </span>
    </div>

    <p
      v-if="!party.length"
      class="text-sm text-secondary"
    >
      Добавьте персонажей группы.
    </p>

    <ul
      v-else
      class="flex flex-col gap-2"
    >
      <li
        v-for="row in party"
        :key="row.id"
        class="flex items-end gap-2"
      >
        <UFormField
          label="Персонажей"
          class="flex-1"
        >
          <UInputNumber
            :model-value="row.count"
            :min="MIN_ROW_COUNT"
            :max="MAX_ROW_COUNT"
            class="w-full"
            @update:model-value="handleCountUpdate(row.id, $event)"
          />
        </UFormField>

        <UFormField
          label="Уровень"
          class="flex-1"
        >
          <UInputNumber
            :model-value="row.level"
            :min="MIN_CHARACTER_LEVEL"
            :max="MAX_CHARACTER_LEVEL"
            class="w-full"
            @update:model-value="handleLevelUpdate(row.id, $event)"
          />
        </UFormField>

        <UButton
          icon="tabler:trash"
          color="neutral"
          variant="ghost"
          aria-label="Убрать строку группы"
          @click.left.exact.prevent="emit('remove', row.id)"
        />
      </li>
    </ul>

    <UButton
      icon="tabler:plus"
      variant="soft"
      class="self-start"
      :disabled="!canAdd"
      @click.left.exact.prevent="emit('add')"
    >
      Добавить
    </UButton>
  </section>
</template>
