<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectSaveOverride,
    SaveOverridePeriod,
  } from '../../model';

  import { InfoTooltip } from '~ui/tooltip';

  import {
    DEFAULT_SAVE_OVERRIDE,
    EFFECT_SAVE_OVERRIDE_LABELS,
    MAX_SAVE_OVERRIDE_USES,
    MIN_SAVE_OVERRIDE_USES,
    SAVE_OVERRIDE_PERIOD_OPTIONS,
    toDraftSaveOverride,
    toDraftSaveOverrideCounter,
  } from '../../model';

  /**
   * Раздел «Провал в успех»: носитель, проваливший спасбросок, может потратить
   * единицу и преуспеть («Легендарное сопротивление», черты и предметы
   * игроков). Платит своим счётчиком «N раз до отдыха» либо ресурсом листа.
   */
  const effect = defineModel<ActiveEffect>('effect', { required: true });

  /**
   * Записывает блок; блок, которому нечем платить, не пишется вовсе.
   *
   * @param nextSaveOverride новый блок.
   */
  function writeSaveOverride(
    nextSaveOverride: EffectSaveOverride | undefined,
  ): void {
    effect.value = {
      ...effect.value,
      saveOverride: toDraftSaveOverride(nextSaveOverride),
    };
  }

  const hasSaveOverride = computed({
    get: () => effect.value.saveOverride !== undefined,
    set: (enabled: boolean) =>
      writeSaveOverride(enabled ? DEFAULT_SAVE_OVERRIDE : undefined),
  });

  /** Свой счётчик; у блока только с ресурсом — счётчик нового блока. */
  const saveOverrideLimit = computed(
    () => effect.value.saveOverride?.limit ?? DEFAULT_SAVE_OVERRIDE.limit,
  );

  const saveOverrideTimes = computed({
    get: () => saveOverrideLimit.value?.max ?? MIN_SAVE_OVERRIDE_USES,
    set: (enteredTimes: number | null | undefined) => {
      // Очищенное поле числа отдаёт `undefined`: число остаётся прежним
      if (typeof enteredTimes === 'number' && saveOverrideLimit.value) {
        writeSaveOverride({
          ...effect.value.saveOverride,
          limit: { ...saveOverrideLimit.value, max: enteredTimes },
        });
      }
    },
  });

  const saveOverridePeriod = computed({
    get: () => saveOverrideLimit.value?.per,
    set: (nextPeriod: SaveOverridePeriod) =>
      writeSaveOverride({
        ...effect.value.saveOverride,
        limit: { max: saveOverrideTimes.value, per: nextPeriod },
      }),
  });

  const saveOverrideCounter = computed({
    get: () => effect.value.saveOverride?.counter ?? '',
    set: (enteredCounter: string) =>
      writeSaveOverride({
        ...effect.value.saveOverride,
        counter: toDraftSaveOverrideCounter(enteredCounter),
      }),
  });
</script>

<template>
  <div class="flex flex-col gap-2">
    <USwitch
      v-model="hasSaveOverride"
      :label="EFFECT_SAVE_OVERRIDE_LABELS.toggle"
      :description="EFFECT_SAVE_OVERRIDE_LABELS.toggleHint"
    />

    <div
      v-if="effect.saveOverride"
      class="flex flex-wrap items-end gap-3"
    >
      <UFormField
        :label="EFFECT_SAVE_OVERRIDE_LABELS.times"
        class="w-24"
      >
        <UInputNumber
          v-model="saveOverrideTimes"
          :min="MIN_SAVE_OVERRIDE_USES"
          :max="MAX_SAVE_OVERRIDE_USES"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="EFFECT_SAVE_OVERRIDE_LABELS.per"
        class="w-full sm:w-56"
      >
        <USelect
          v-model="saveOverridePeriod"
          :items="SAVE_OVERRIDE_PERIOD_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <!-- Подсказка под значком: так поле стоит в одном ряду с «Раз» и «До» -->
      <UFormField class="w-full sm:w-72">
        <template #label>
          <InfoTooltip
            :text="EFFECT_SAVE_OVERRIDE_LABELS.counterHint"
            icon="tabler:info-circle-filled"
          >
            <span>{{ EFFECT_SAVE_OVERRIDE_LABELS.counter }}</span>
          </InfoTooltip>
        </template>

        <UInput
          v-model="saveOverrideCounter"
          :placeholder="EFFECT_SAVE_OVERRIDE_LABELS.counterPlaceholder"
          size="sm"
          class="w-full font-mono"
        />
      </UFormField>
    </div>
  </div>
</template>
