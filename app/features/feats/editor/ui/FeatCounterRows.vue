<script setup lang="ts">
  import type { FeatCounterRow, FeatEditorLabelOverrides } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    COUNTER_COUNT_MAX,
    COUNTER_REST_AMOUNT_MIN,
    createCounterRow,
    FEAT_COUNTER_REST_FIELDS,
    FEAT_COUNTER_REST_MODE_OPTIONS,
    getFeatEditorLabels,
    isCounterRestAmount,
  } from '../../model';
  import FeatCounterMaxField from './FeatCounterMaxField.vue';
  import FeatRowsSection from './FeatRowsSection.vue';

  /**
   * Ресурсы черты: счётчик с максимумом-формулой и восстановлением на отдыхе.
   *
   * Максимум формулой, а не числом, потому что у большинства таких запасов он
   * привязан к бонусу мастерства и обязан расти вместе с ним («Удачливый»);
   * формулу раскладывает на понятный выбор {@link FeatCounterMaxField}.
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
        class="md:col-span-10"
        :label="texts.counterName"
      >
        <UInput
          v-model="counter.name"
          :placeholder="texts.counterNamePlaceholder"
        />
      </UFormField>

      <UFormField
        class="md:col-span-5"
        :label="texts.counterShortName"
      >
        <UInput v-model="counter.shortName" />
      </UFormField>

      <!-- Ключ виден, потому что по нему эффект умения тратит ресурс: без
        поля автор не знал, что вписать в «Тратит ресурс» -->
      <UFormField class="md:col-span-8">
        <template #label>
          <InfoTooltip
            :text="texts.counterKeyHint"
            icon="tabler:info-circle-filled"
          >
            <span>{{ texts.counterKey }}</span>
          </InfoTooltip>
        </template>

        <UInput
          v-model="counter.key"
          :placeholder="texts.counterKeyPlaceholder"
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

      <FeatCounterMaxField
        v-model="counter.max"
        v-model:minimum="counter.min"
        :labels="labels"
        class="md:col-span-24"
      />

      <!-- Короткий и продолжительный отдых раздельно: «Второе дыхание»
        возвращает один заряд коротким и все продолжительным, ярость — только
        продолжительным -->
      <div class="flex flex-col gap-2 md:col-span-24">
        <span class="text-xs font-medium text-muted">
          {{ texts.counterRecovery }}
        </span>

        <div class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="field in FEAT_COUNTER_REST_FIELDS"
            :key="field.key"
            class="flex flex-wrap items-end gap-2 rounded-md bg-elevated/60 p-2"
          >
            <UFormField class="min-w-40 grow">
              <template #label>
                <span class="flex items-center gap-1">
                  <UIcon
                    :name="field.icon"
                    class="size-4 shrink-0"
                  />

                  {{ field.label }}
                </span>
              </template>

              <USelect
                v-model="counter[field.key].mode"
                :items="FEAT_COUNTER_REST_MODE_OPTIONS"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <UFormField
              v-if="isCounterRestAmount(counter[field.key])"
              class="w-28"
              :label="texts.counterRestAmount"
            >
              <UInputNumber
                v-model="counter[field.key].amount"
                :min="COUNTER_REST_AMOUNT_MIN"
                :max="COUNTER_COUNT_MAX"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
      </div>

      <!-- Своей строкой, а не полем в ряду: подпись длинная, и в узкой колонке
        она не читается. Ряд по уровням справочник соберёт сам — у ресурса он
        уже задан ступенями либо формулой -->
      <div class="md:col-span-24">
        <UCheckbox
          v-model="counter.showInTable"
          :label="texts.counterShowInTable"
          :description="texts.counterShowInTableHint"
        />
      </div>

      <!-- Ступени старше формулы: ряд «4 с 3 уровня, 5 с 7, 6 с 15» формулой
        не пишется, и без них такой ресурс приходилось задавать одним числом -->
      <div class="flex flex-col gap-2 md:col-span-24">
        <span class="text-xs font-medium text-muted">
          {{ texts.counterScalingTitle }}
        </span>

        <!-- Без подсказки ступени читались только как рост: что первая из них
          ещё и открывает ресурс, из заголовка не видно -->
        <p class="text-xs text-dimmed">
          {{ texts.counterScalingHint }}
        </p>

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
