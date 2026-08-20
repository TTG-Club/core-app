<script setup lang="ts">
  import type { FeatCounterRow } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    createCounterRow,
    FEAT_COUNTER_RECOVERY_OPTIONS,
    FEAT_EDITOR_LABELS,
  } from '../../model';

  /**
   * Ресурсы черты: счётчик с максимумом-формулой и откатом от отдыха.
   *
   * Максимум формулой, а не числом, потому что у большинства таких запасов он
   * привязан к бонусу мастерства и обязан расти вместе с ним («Удачливый»).
   */
  const model = defineModel<Array<FeatCounterRow>>({ required: true });

  /** Заводит ресурс со свободным ключом: занятый схлопнул бы два счётчика. */
  function addCounter() {
    model.value = [
      ...model.value,
      createCounterRow(model.value.map((row) => row.key)),
    ];
  }

  /**
   * Убирает ресурс.
   *
   * @param index номер строки в списке.
   */
  function removeCounter(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <InfoTooltip
      :text="FEAT_EDITOR_LABELS.countersHintDetails"
      icon="tabler:info-circle-filled"
      class="text-sm text-dimmed"
    >
      <span>{{ FEAT_EDITOR_LABELS.countersHint }}</span>
    </InfoTooltip>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      {{ FEAT_EDITOR_LABELS.countersEmpty }}
    </p>

    <div
      v-for="(counter, index) in model"
      :key="counter.uid"
      class="grid grid-cols-1 items-end gap-3 rounded-lg bg-elevated/40 p-2 md:grid-cols-24"
    >
      <UFormField
        class="md:col-span-8"
        :label="FEAT_EDITOR_LABELS.counterName"
      >
        <UInput
          v-model="counter.name"
          :placeholder="FEAT_EDITOR_LABELS.counterNamePlaceholder"
        />
      </UFormField>

      <UFormField
        class="md:col-span-4"
        :label="FEAT_EDITOR_LABELS.counterShortName"
      >
        <UInput v-model="counter.shortName" />
      </UFormField>

      <UFormField
        class="md:col-span-4"
        :label="FEAT_EDITOR_LABELS.counterMax"
      >
        <UInput
          v-model="counter.max"
          placeholder="@prof"
        />
      </UFormField>

      <UFormField
        class="md:col-span-7"
        :label="FEAT_EDITOR_LABELS.counterRecovery"
      >
        <USelect
          v-model="counter.recovery"
          :items="FEAT_COUNTER_RECOVERY_OPTIONS"
          value-key="value"
        />
      </UFormField>

      <div class="flex justify-end md:col-span-1">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="counter.name || FEAT_EDITOR_LABELS.countersTitle"
          @click.left.exact.prevent="removeCounter(index)"
        />
      </div>
    </div>

    <UButton
      icon="tabler:plus"
      :label="FEAT_EDITOR_LABELS.addCounter"
      color="primary"
      variant="soft"
      block
      @click.left.exact.prevent="addCounter"
    />
  </div>
</template>
