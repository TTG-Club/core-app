<script setup lang="ts">
  import type { SaveDcFieldMode } from '../../model';

  import {
    APPLIER_SAVE_DC,
    DEFAULT_EFFECT_SAVE_DC,
    describeSaveDcFormulaError,
    describeSaveDcFormulaHelp,
    EFFECT_SAVE_DC_FORMULA_LABELS,
    FIXED_MIN_SAVE_DC,
    listSaveDcFieldModeOptions,
    SAVE_DC_AUTO_MODE,
    SAVE_DC_AUTO_SEPARATOR,
    SAVE_DC_FORMULA_MODE,
    SAVE_DC_MANUAL_MODE,
  } from '../../model';

  /**
   * Поле Сл спасброска. Где у Сл есть источник (заклинатель, действие,
   * оружие), выбирается «Авто» — Сл источника, в данных это 0 — или «Вручную»
   * со своим числом. Где источника нет, остаётся число. У Сл эффекта есть ещё
   * «Формулой» — по владельцу эффекта («8 + @prof + @mod.str»); число тогда
   * запасное.
   */
  const {
    autoAllowed,
    autoLabel = '',
    autoValue = undefined,
    formulaAllowed = false,
    acceptsDamage = false,
  } = defineProps<{
    /** Подпись поля. */
    label: string;
    /** Можно ли «Авто»: у Сл есть источник. */
    autoAllowed: boolean;
    /** Чья Сл подставляется в «Авто» («Сл заклинателя»). */
    autoLabel?: string;
    /** Сл источника, если форма её знает (Сл действия существа). */
    autoValue?: number;
    /** Можно ли «Формулой»: у Сл эффекта есть владелец. */
    formulaAllowed?: boolean;
    /** Есть ли у события урон — токен `@damage` в формуле. */
    acceptsDamage?: boolean;
  }>();

  /** Сл: `APPLIER_SAVE_DC` — «Авто». */
  const saveDc = defineModel<number>({ required: true });

  /** Сл формулой; `undefined` — формулы нет, пустая строка — её набирают. */
  const saveDcFormula = defineModel<string | undefined>('formula');

  const modeOptions = computed(() =>
    listSaveDcFieldModeOptions({ autoAllowed, formulaAllowed }),
  );

  const hasModeChoice = computed(() => modeOptions.value.length > 1);

  const mode = computed<SaveDcFieldMode>({
    get: () => {
      if (formulaAllowed && saveDcFormula.value !== undefined) {
        return SAVE_DC_FORMULA_MODE;
      }

      return autoAllowed && saveDc.value === APPLIER_SAVE_DC
        ? SAVE_DC_AUTO_MODE
        : SAVE_DC_MANUAL_MODE;
    },
    set: (nextMode) => {
      if (nextMode === SAVE_DC_FORMULA_MODE) {
        saveDcFormula.value = saveDcFormula.value ?? '';

        return;
      }

      saveDcFormula.value = undefined;

      if (nextMode === SAVE_DC_AUTO_MODE) {
        saveDc.value = APPLIER_SAVE_DC;

        return;
      }

      // Своё число начинается с того, что сейчас дал бы источник
      if (saveDc.value === APPLIER_SAVE_DC) {
        saveDc.value = autoValue ?? DEFAULT_EFFECT_SAVE_DC;
      }
    },
  });

  const isAuto = computed(() => mode.value === SAVE_DC_AUTO_MODE);
  const isFormula = computed(() => mode.value === SAVE_DC_FORMULA_MODE);

  const manualSaveDc = computed({
    get: () => saveDc.value,
    set: (enteredSaveDc: number | null | undefined) => {
      // Очищенное поле числа отдаёт `undefined`, а не `null`
      if (typeof enteredSaveDc === 'number') {
        saveDc.value = enteredSaveDc;
      }
    },
  });

  const formulaText = computed({
    get: () => saveDcFormula.value ?? '',
    set: (enteredFormula: string) => {
      saveDcFormula.value = enteredFormula;
    },
  });

  /** Что подставится в «Авто»: чья Сл и её число, если известно. */
  const autoText = computed(() =>
    autoValue === undefined
      ? autoLabel
      : `${autoLabel}${SAVE_DC_AUTO_SEPARATOR}${autoValue}`,
  );

  const formulaError = computed(() => {
    const trimmedFormula = saveDcFormula.value?.trim();

    return isFormula.value && trimmedFormula
      ? describeSaveDcFormulaError(trimmedFormula, { acceptsDamage })
      : undefined;
  });

  const formulaHelp = computed(() =>
    isFormula.value ? describeSaveDcFormulaHelp({ acceptsDamage }) : undefined,
  );
</script>

<template>
  <UFormField
    :label="label"
    :help="formulaHelp"
    :error="formulaError"
    class="min-w-56"
  >
    <div class="flex flex-wrap items-center gap-2">
      <USelect
        v-if="hasModeChoice"
        v-model="mode"
        :items="modeOptions"
        value-key="value"
        size="sm"
        class="w-32"
      />

      <span
        v-if="isAuto"
        class="text-sm text-muted"
      >
        {{ autoText }}
      </span>

      <UInput
        v-else-if="isFormula"
        v-model="formulaText"
        :placeholder="EFFECT_SAVE_DC_FORMULA_LABELS.placeholder"
        size="sm"
        class="w-64 max-w-full font-mono"
      />

      <UInputNumber
        v-else
        v-model="manualSaveDc"
        :min="FIXED_MIN_SAVE_DC"
        size="sm"
        class="w-28"
      />
    </div>
  </UFormField>
</template>
