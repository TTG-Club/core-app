<script setup lang="ts">
  import type { FeatCounterRow, FeatEditorLabelOverrides } from '../../model';

  import {
    COUNTER_MINIMUM_MAX,
    COUNTER_MINIMUM_MIN,
    createCounterRow,
    FEAT_COUNTER_RECOVERY_OPTIONS,
    getFeatEditorLabels,
  } from '../../model';
  import FeatRowsSection from './FeatRowsSection.vue';

  /**
   * Ресурсы черты: счётчик с максимумом-формулой и откатом от отдыха.
   *
   * Максимум формулой, а не числом, потому что у большинства таких запасов он
   * привязан к бонусу мастерства и обязан расти вместе с ним («Удачливый»).
   */
  const { labels = {}, title = undefined } = defineProps<{
    /**
     * Подписи формы-владельца: чертой источник даров называет только форма
     * черты, у умения класса и вида свои формулировки.
     */
    labels?: FeatEditorLabelOverrides;

    /**
     * Заголовок блока: с ним строки рисуются в рамке с кнопкой добавления в
     * шапке. Пусто — форма-владелец рисует заголовок сама.
     */
    title?: string;
  }>();

  const model = defineModel<Array<FeatCounterRow>>({ required: true });

  /** Подписи с поправками формы-владельца. */
  const texts = computed(() => getFeatEditorLabels(labels));

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

  /**
   * Заводит ступень максимума: следующая начинается уровнем позже последней.
   *
   * @param counter строка ресурса.
   */
  function addScaling(counter: FeatCounterRow) {
    const last = counter.scaling.at(-1);

    counter.scaling = [
      ...counter.scaling,
      {
        level: Math.min(20, (last?.level ?? 0) + 1),
        max: (last?.max ?? 0) + 1,
      },
    ];
  }

  /**
   * Убирает ступень максимума.
   *
   * @param counter строка ресурса.
   * @param index номер ступени.
   */
  function removeScaling(counter: FeatCounterRow, index: number) {
    counter.scaling = counter.scaling.filter(
      (_, position) => position !== index,
    );
  }
</script>

<template>
  <FeatRowsSection
    :title="title"
    :summary="texts.countersHint"
    :hint="texts.countersHintDetails"
    :empty="texts.countersEmpty"
    :count="model.length"
    :add-label="texts.addCounter"
    @add="addCounter"
  >
    <div
      v-for="(counter, index) in model"
      :key="counter.uid"
      class="grid grid-cols-1 items-end gap-3 rounded-lg bg-elevated/40 p-2 md:grid-cols-24"
    >
      <UFormField
        class="md:col-span-6"
        :label="texts.counterName"
      >
        <UInput
          v-model="counter.name"
          :placeholder="texts.counterNamePlaceholder"
        />
      </UFormField>

      <UFormField
        class="md:col-span-3"
        :label="texts.counterShortName"
      >
        <UInput v-model="counter.shortName" />
      </UFormField>

      <UFormField
        class="md:col-span-3"
        :label="texts.counterMax"
      >
        <UInput
          v-model="counter.max"
          placeholder="@prof"
        />
      </UFormField>

      <!-- Нижняя граница максимума: вдохновение барда равно модификатору
        Харизмы, но с Харизмой +0 бард всё равно вдохновляет один раз -->
      <UFormField
        class="md:col-span-3"
        :label="texts.counterMin"
      >
        <UInputNumber
          v-model="counter.min"
          :min="COUNTER_MINIMUM_MIN"
          :max="COUNTER_MINIMUM_MAX"
          class="w-full"
        />
      </UFormField>

      <UFormField
        class="md:col-span-8"
        :label="texts.counterRecovery"
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
          :aria-label="counter.name || texts.countersTitle"
          @click.left.exact.prevent="removeCounter(index)"
        />
      </div>

      <!-- Ступени старше формулы: ряд «4 с 3 уровня, 5 с 7, 6 с 15» формулой
        не пишется, и без них такой ресурс приходилось задавать одним числом -->
      <div class="flex flex-col gap-2 md:col-span-24">
        <span class="text-xs font-medium text-muted">
          {{ texts.counterScalingTitle }}
        </span>

        <p
          v-if="!counter.scaling.length"
          class="text-xs text-dimmed italic"
        >
          {{ texts.counterScalingEmpty }}
        </p>

        <div
          v-for="(step, stepIndex) in counter.scaling"
          :key="`${counter.uid}-${stepIndex}`"
          class="flex items-end gap-2"
        >
          <UFormField
            class="w-28"
            :label="texts.counterScalingLevel"
          >
            <UInputNumber
              v-model="step.level"
              :min="1"
              :max="20"
              class="w-full"
            />
          </UFormField>

          <UFormField
            class="w-28"
            :label="texts.counterScalingMax"
          >
            <UInputNumber
              v-model="step.max"
              :min="1"
              class="w-full"
            />
          </UFormField>

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            :aria-label="texts.counterScalingTitle"
            @click.left.exact.prevent="removeScaling(counter, stepIndex)"
          />
        </div>

        <UButton
          icon="tabler:plus"
          :label="texts.addCounterScaling"
          color="neutral"
          variant="soft"
          size="xs"
          @click.left.exact.prevent="addScaling(counter)"
        />
      </div>
    </div>
  </FeatRowsSection>
</template>
