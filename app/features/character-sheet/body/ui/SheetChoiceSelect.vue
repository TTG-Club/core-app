<script setup lang="ts">
  /** Опция списка с пометкой того, что выбор у персонажа уже есть. */
  interface ChoiceItem {
    label: string;
    value: string;
    hint: string;
  }

  const {
    count = 0,
    hints = {},
    items,
    placeholder = '',
    warning = '',
  } = defineProps<{
    items: string[];

    /** Сколько значений нужно выбрать; 0 — без ограничения. */
    count?: number;

    placeholder?: string;

    /** Пометки опций: значение → подпись бейджа (например, «уже есть»). */
    hints?: Record<string, string>;

    /** Предупреждение под списком, если выбрана помеченная опция. */
    warning?: string;
  }>();

  const model = defineModel<string[]>({ default: () => [] });

  // Выбор одного значения — одиночный селект: один клик сразу переключает выбор
  // (в множественном пришлось бы снимать старый и ставить новый). Несколько или
  // без ограничения — множественный селект.
  const isMultiple = computed(() => count !== 1);

  const options = computed<ChoiceItem[]>(() =>
    items.map((name) => ({
      label: name,
      value: name,
      hint: hints[name] ?? '',
    })),
  );

  const singleValue = computed<string | undefined>({
    get: () => model.value[0],
    set: (value) => {
      model.value = value ? [value] : [];
    },
  });

  const isWarningVisible = computed(
    () => Boolean(warning) && model.value.some((name) => hints[name]),
  );

  // Пометка опции одна и та же в обоих селектах, а слот у каждого свой.
  const [DefineHintBadge, ReuseHintBadge] = createReusableTemplate<{
    hint: string;
  }>();
</script>

<template>
  <div class="flex flex-col gap-1">
    <DefineHintBadge v-slot="{ hint }">
      <UBadge
        v-if="hint"
        size="sm"
        color="neutral"
        variant="subtle"
      >
        {{ hint }}
      </UBadge>
    </DefineHintBadge>

    <USelectMenu
      v-if="isMultiple"
      v-model="model"
      :items="options"
      :placeholder="placeholder"
      label-key="label"
      value-key="value"
      multiple
      searchable
    >
      <template #item-trailing="{ item }">
        <ReuseHintBadge :hint="item.hint" />
      </template>
    </USelectMenu>

    <USelectMenu
      v-else
      v-model="singleValue"
      :items="options"
      :placeholder="placeholder"
      label-key="label"
      value-key="value"
      searchable
    >
      <template #item-trailing="{ item }">
        <ReuseHintBadge :hint="item.hint" />
      </template>
    </USelectMenu>

    <span
      v-if="isWarningVisible"
      class="text-xs text-warning"
    >
      {{ warning }}
    </span>
  </div>
</template>
