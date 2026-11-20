<script setup lang="ts">
  import {
    getCustomThemeHexFieldText,
    parseCustomThemeHexColor,
  } from '~infrastructure/custom-theme/model';

  import {
    CUSTOM_THEME_HEX_ERROR_HINT,
    CUSTOM_THEME_HEX_FIELD_STATE,
    CUSTOM_THEME_HEX_INPUT,
    CUSTOM_THEME_PICKER_BUTTON,
    CUSTOM_THEME_PICKER_POPOVER_CONTENT,
    CUSTOM_THEME_SWATCH_CLASS,
  } from './constants';

  /**
   * Выбор цвета своей темы: кружки готовых цветов, кнопка с палитрой для
   * любого другого и поле для кода цвета. Если цвет не из готовых, подсвечена
   * кнопка палитры.
   */
  const { presets, pickerLabel, hexLabel } = defineProps<{
    /** Готовые цвета */
    presets: ReadonlyArray<{ label: string; value: string }>;
    /** Подпись кнопки своего цвета */
    pickerLabel: string;
    /** Подпись поля кода цвета */
    hexLabel: string;
  }>();

  /** Цвет в формате `#rrggbb` */
  const model = defineModel<string>({ required: true });

  const swatches = computed(() =>
    presets.map((preset) => {
      const isSelected = preset.value === model.value;

      return {
        ...preset,
        isSelected,
        outlineClass: isSelected
          ? CUSTOM_THEME_SWATCH_CLASS.selected
          : CUSTOM_THEME_SWATCH_CLASS.idle,
      };
    }),
  );

  const pickerButtonProps = computed(() =>
    swatches.value.some((swatch) => swatch.isSelected)
      ? CUSTOM_THEME_PICKER_BUTTON.idle
      : CUSTOM_THEME_PICKER_BUTTON.selected,
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
      class="size-7 rounded-full p-0"
      :class="swatch.outlineClass"
      :style="{ backgroundColor: swatch.value }"
      :title="swatch.label"
      :aria-label="swatch.label"
      :aria-pressed="swatch.isSelected"
      @click.left.exact.prevent="selectPreset(swatch.value)"
    />

    <UPopover :content="CUSTOM_THEME_PICKER_POPOVER_CONTENT">
      <UButton
        icon="tabler:color-picker"
        v-bind="pickerButtonProps"
        size="sm"
        square
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
      class="w-24"
      :ui="{ base: 'font-mono uppercase' }"
      @blur="resetHexDraft"
    />
  </div>
</template>
