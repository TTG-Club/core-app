<script setup lang="ts">
  import {
    getCustomThemeHexFieldText,
    parseCustomThemeHexColor,
  } from '~infrastructure/custom-theme/model';

  import {
    CUSTOM_THEME_HEX_ERROR_HINT,
    CUSTOM_THEME_HEX_FIELD_STATE,
    CUSTOM_THEME_HEX_INPUT,
    CUSTOM_THEME_PICKER_POPOVER_CONTENT,
    CUSTOM_THEME_SWATCH_CLASS,
    CUSTOM_THEME_SWATCH_SHAPE_CLASS,
  } from './constants';

  /**
   * Выбор цвета своей темы в один ряд: кружки готовых цветов, поле для кода
   * цвета и кружок текущего цвета, который открывает палитру для любого
   * другого. Если цвет не из готовых, обведён кружок текущего цвета.
   */
  const { presets, pickerLabel, hexLabel } = defineProps<{
    /** Готовые цвета */
    presets: ReadonlyArray<{ label: string; value: string }>;
    /** Подпись кружка текущего цвета, открывающего палитру */
    pickerLabel: string;
    /** Подпись поля кода цвета */
    hexLabel: string;
  }>();

  /** Цвет в формате `#rrggbb` */
  const model = defineModel<string>({ required: true });

  /**
   * Обводка кружка цвета.
   *
   * @param isSelected Выбран ли цвет кружка.
   * @returns Классы обводки.
   */
  function getSwatchOutlineClass(isSelected: boolean): string {
    return isSelected
      ? CUSTOM_THEME_SWATCH_CLASS.selected
      : CUSTOM_THEME_SWATCH_CLASS.idle;
  }

  const swatches = computed(() =>
    presets.map((preset) => {
      const isSelected = preset.value === model.value;

      return {
        ...preset,
        isSelected,
        outlineClass: getSwatchOutlineClass(isSelected),
      };
    }),
  );

  const isCustomColor = computed(
    () => !swatches.value.some((swatch) => swatch.isSelected),
  );

  const currentSwatchOutlineClass = computed(() =>
    getSwatchOutlineClass(isCustomColor.value),
  );

  // UColorPicker сразу пишет в модель; пустое значение пропускаем
  const pickerColor = computed({
    get: () => model.value,
    set: (value: string | undefined) => {
      if (value) {
        model.value = value.toLowerCase();
      }
    },
  });

  // Набранный в поле текст; пока его нет, поле показывает текущий цвет
  const hexDraft = ref<string>();

  const isHexInvalid = computed(
    () =>
      hexDraft.value !== undefined
      && parseCustomThemeHexColor(hexDraft.value) === undefined,
  );

  const hexFieldState = computed(() =>
    isHexInvalid.value
      ? CUSTOM_THEME_HEX_FIELD_STATE.invalid
      : CUSTOM_THEME_HEX_FIELD_STATE.valid,
  );

  const hexFieldTitle = computed(() =>
    isHexInvalid.value ? CUSTOM_THEME_HEX_ERROR_HINT : hexLabel,
  );

  // Верный код сразу меняет цвет темы, неверный остаётся в поле с подсветкой
  const hexField = computed({
    get: () => getCustomThemeHexFieldText(hexDraft.value, model.value),
    set: (value: string) => {
      hexDraft.value = value;

      const color = parseCustomThemeHexColor(value);

      if (color) {
        model.value = color;
      }
    },
  });

  /** Уход из поля возвращает в него текущий цвет — недописанный код забыт. */
  function resetHexDraft() {
    hexDraft.value = undefined;
  }

  /**
   * Ставит цвет из готовых.
   *
   * @param value Цвет в формате `#rrggbb`.
   */
  function selectPreset(value: string) {
    model.value = value;
  }
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <UButton
      v-for="swatch in swatches"
      :key="swatch.value"
      variant="ghost"
      color="neutral"
      :class="[CUSTOM_THEME_SWATCH_SHAPE_CLASS, swatch.outlineClass]"
      :style="{ backgroundColor: swatch.value }"
      :title="swatch.label"
      :aria-label="swatch.label"
      :aria-pressed="swatch.isSelected"
      @click.left.exact.prevent="selectPreset(swatch.value)"
    />

    <UInput
      v-model="hexField"
      v-bind="hexFieldState"
      :placeholder="CUSTOM_THEME_HEX_INPUT.placeholder"
      :maxlength="CUSTOM_THEME_HEX_INPUT.maxLength"
      :aria-label="hexLabel"
      :aria-invalid="isHexInvalid"
      :title="hexFieldTitle"
      size="sm"
      spellcheck="false"
      class="w-22"
      :ui="{ base: 'font-mono uppercase' }"
      @blur="resetHexDraft"
    />

    <UPopover :content="CUSTOM_THEME_PICKER_POPOVER_CONTENT">
      <UButton
        variant="ghost"
        color="neutral"
        :class="[CUSTOM_THEME_SWATCH_SHAPE_CLASS, currentSwatchOutlineClass]"
        :style="{ backgroundColor: model }"
        :aria-label="pickerLabel"
        :title="pickerLabel"
      />

      <template #content>
        <div class="p-3">
          <UColorPicker
            v-model="pickerColor"
            size="sm"
          />
        </div>
      </template>
    </UPopover>
  </div>
</template>
