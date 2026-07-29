<script setup lang="ts">
  import type { DistanceRowDraft } from '../../model';

  /** Опция типа с признаком занятости другой строкой. */
  interface DistanceTypeItem {
    label: string;
    value: string;
    disabled: boolean;
  }

  const {
    options,
    min,
    max,
    defaultValue,
    addLabel,
    removeLabel,
    emptyLabel,
    typePlaceholder,
  } = defineProps<{
    options: Array<{ label: string; value: string }>;
    min: number;
    max: number;

    /** Дистанция новой строки. */
    defaultValue: number;

    addLabel: string;
    removeLabel: string;
    emptyLabel: string;
    typePlaceholder: string;
  }>();

  const rows = defineModel<DistanceRowDraft[]>({ required: true });

  /** Первый ещё не заведённый тип; undefined — заведены все. */
  const freeOption = computed(() =>
    options.find(
      (option) => !rows.value.some((row) => row.key === option.value),
    ),
  );

  const isAddDisabled = computed(() => !freeOption.value);

  /**
   * Опции селектора строки: один тип нельзя завести дважды, поэтому занятый
   * другой строкой остаётся видимым, но недоступным.
   *
   * @param rowKey тип текущей строки — он доступен всегда.
   * @returns опции типов для селектора строки.
   */
  function typeItems(rowKey: string): DistanceTypeItem[] {
    return options.map((option) => ({
      ...option,
      disabled:
        option.value !== rowKey
        && rows.value.some((row) => row.key === option.value),
    }));
  }

  function handleAdd() {
    const option = freeOption.value;

    if (!option) {
      return;
    }

    rows.value = [
      ...rows.value,
      { id: crypto.randomUUID(), key: option.value, value: defaultValue },
    ];
  }

  function handleRemove(rowId: string) {
    rows.value = rows.value.filter((row) => row.id !== rowId);
  }

  function handleType(rowId: string, value: unknown) {
    const selectedOption = options.find((option) => option.value === value);

    if (!selectedOption) {
      return;
    }

    rows.value = rows.value.map((row) =>
      row.id === rowId ? { ...row, key: selectedOption.value } : row,
    );
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="row in rows"
      :key="row.id"
      class="flex items-center gap-2"
    >
      <USelect
        :model-value="row.key"
        :items="typeItems(row.key)"
        :placeholder="typePlaceholder"
        class="min-w-0 grow"
        @update:model-value="handleType(row.id, $event)"
      />

      <UInputNumber
        v-model="row.value"
        :min="min"
        :max="max"
        class="w-32 shrink-0"
      />

      <UTooltip :text="removeLabel">
        <UButton
          icon="tabler:trash"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          class="shrink-0"
          :aria-label="removeLabel"
          @click.left.exact.prevent="handleRemove(row.id)"
        />
      </UTooltip>
    </div>

    <span
      v-if="!rows.length"
      class="text-sm text-dimmed italic"
    >
      {{ emptyLabel }}
    </span>

    <div>
      <UButton
        :label="addLabel"
        icon="tabler:plus"
        color="neutral"
        variant="subtle"
        size="xs"
        :disabled="isAddDisabled"
        @click.left.exact.prevent="handleAdd"
      />
    </div>
  </div>
</template>
