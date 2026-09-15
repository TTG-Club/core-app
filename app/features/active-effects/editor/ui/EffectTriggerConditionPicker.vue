<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    EffectTriggerEvent,
    TriggerConditionKind,
    TriggerConditionParameter,
    TriggerConditionPart,
  } from '../../model';

  import {
    EFFECT_TRIGGER_CONDITION_DEFAULT_VALUES,
    EFFECT_TRIGGER_CONDITION_KIND_LABELS,
    EFFECT_TRIGGER_CONDITION_LABELS,
    EFFECT_TRIGGER_CONDITION_VALUE_OPTIONS,
    getTriggerConditionParameter,
    isEffectTag,
    listTriggerConditionKinds,
    readTriggerConditionParts,
    writeTriggerCondition,
  } from '../../model';

  /**
   * Условие срабатывания: части из словаря срабатываний, соединённые «и».
   * Какие части что-то значат на событии, решает модель
   * (`listTriggerConditionKinds`); часть, которую словарь не знает,
   * показывается как есть и не теряется.
   */
  const { event, knownTags } = defineProps<{
    /** Событие срабатывания: от него зависят доступные части. */
    event: EffectTriggerEvent;
    /** Отметки, которые ставит этот эффект: условие по отметке их предлагает. */
    knownTags: readonly string[];
  }>();

  /** Условие строкой словаря (`self.tag === "x" && …`); пусто — без условия. */
  const condition = defineModel<string | undefined>('condition', {
    required: true,
  });

  /** Строка списка частей: разобранная часть или строка как есть. */
  interface ConditionRow {
    key: string;
    part: TriggerConditionPart | null;
    text: string;
    /** Подсказка к строке, которую форма не узнала. */
    title?: string;
    /** Варианты значения части; пусто — значение не выбирается списком. */
    valueItems: Array<{ label: string; value: string }>;
    /** Значение части вводится строкой — ключ отметки. */
    isTagPart: boolean;
  }

  const parts = computed(() => readTriggerConditionParts(condition.value));

  const rows = computed<ConditionRow[]>(() =>
    parts.value.map((part, index) => {
      if (typeof part === 'string') {
        return {
          key: `${index}-raw`,
          part: null,
          text: part,
          title: EFFECT_TRIGGER_CONDITION_LABELS.unknown,
          valueItems: [],
          isTagPart: false,
        };
      }

      const parameter = getTriggerConditionParameter(part.kind);

      return {
        key: `${index}-${part.kind}`,
        part,
        text: EFFECT_TRIGGER_CONDITION_KIND_LABELS[part.kind],
        valueItems:
          parameter && parameter !== 'tag'
            ? EFFECT_TRIGGER_CONDITION_VALUE_OPTIONS[parameter]
            : [],
        isTagPart: parameter === 'tag',
      };
    }),
  );

  /**
   * Записывает части условия.
   *
   * @param nextParts части по порядку.
   */
  function writeParts(
    nextParts: ReadonlyArray<TriggerConditionPart | string>,
  ): void {
    condition.value = writeTriggerCondition(nextParts);
  }

  /**
   * Значение новой части: у отметки — первая отметка эффекта.
   *
   * @param parameter что выбирается.
   * @returns значение.
   */
  function getDefaultValue(parameter: TriggerConditionParameter): string {
    return parameter === 'tag'
      ? (knownTags[0] ?? EFFECT_TRIGGER_CONDITION_DEFAULT_VALUES.tag)
      : EFFECT_TRIGGER_CONDITION_DEFAULT_VALUES[parameter];
  }

  /**
   * Добавляет часть условия; у части со значением — значение по умолчанию.
   *
   * @param kind вид части.
   */
  function addPart(kind: TriggerConditionKind): void {
    const parameter = getTriggerConditionParameter(kind);

    writeParts([
      ...parts.value,
      parameter ? { kind, value: getDefaultValue(parameter) } : { kind },
    ]);
  }

  /**
   * Убирает часть условия.
   *
   * @param index номер части.
   */
  function removePart(index: number): void {
    writeParts(parts.value.filter((_, partIndex) => partIndex !== index));
  }

  /**
   * Меняет значение части условия.
   *
   * @param index номер части.
   * @param value новое значение.
   */
  function updatePartValue(index: number, value: string): void {
    writeParts(
      parts.value.map((part, partIndex) =>
        partIndex === index && typeof part !== 'string'
          ? { ...part, value }
          : part,
      ),
    );
  }

  /**
   * Меняет ключ отметки части. Негодный ключ не пишется: условие с ним
   * разобралось бы строкой, которую форма не знает, и поле ввода пропало бы.
   *
   * @param index номер части.
   * @param value введённый ключ.
   */
  function updatePartTag(index: number, value: string): void {
    const tag = value.trim();

    if (isEffectTag(tag)) {
      updatePartValue(index, tag);
    }
  }

  const addItems = computed<DropdownMenuItem[]>(() =>
    listTriggerConditionKinds(event).map((kind) => ({
      label: EFFECT_TRIGGER_CONDITION_KIND_LABELS[kind],
      onSelect: () => addPart(kind),
    })),
  );
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-xs font-medium text-default">
      {{ EFFECT_TRIGGER_CONDITION_LABELS.title }}
    </span>

    <p
      v-if="rows.length === 0"
      class="text-xs text-muted"
    >
      {{ EFFECT_TRIGGER_CONDITION_LABELS.always }}
    </p>

    <div
      v-for="(row, index) in rows"
      :key="row.key"
      class="flex flex-wrap items-center gap-2"
    >
      <span
        v-if="index > 0"
        class="text-xs text-muted"
      >
        {{ EFFECT_TRIGGER_CONDITION_LABELS.and }}
      </span>

      <span
        class="text-xs text-default"
        :title="row.title"
      >
        {{ row.text }}
      </span>

      <USelect
        v-if="row.part && row.valueItems.length > 0"
        :model-value="row.part.value"
        :items="row.valueItems"
        value-key="value"
        size="xs"
        class="w-44"
        @update:model-value="updatePartValue(index, $event)"
      />

      <template v-else-if="row.part && row.isTagPart">
        <UInput
          :model-value="row.part.value"
          size="xs"
          class="w-40"
          @update:model-value="updatePartTag(index, $event)"
        />

        <UButton
          v-for="tag in knownTags"
          :key="tag"
          color="neutral"
          variant="soft"
          size="xs"
          :label="tag"
          :title="EFFECT_TRIGGER_CONDITION_LABELS.knownTags"
          @click.left.exact.prevent="updatePartValue(index, tag)"
        />
      </template>

      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="tabler:x"
        :aria-label="EFFECT_TRIGGER_CONDITION_LABELS.remove"
        @click.left.exact.prevent="removePart(index)"
      />
    </div>

    <UDropdownMenu
      :items="addItems"
      :content="{ align: 'start' }"
      :ui="{ content: 'max-h-72 overflow-y-auto' }"
    >
      <UButton
        color="primary"
        variant="soft"
        size="xs"
        icon="tabler:filter-plus"
        class="w-fit"
        :label="EFFECT_TRIGGER_CONDITION_LABELS.add"
      />
    </UDropdownMenu>
  </div>
</template>
