<script setup lang="ts">
  import type { AbilityKey } from '../../model';

  import {
    ABILITY_LABELS,
    ABILITY_ORDER,
    SHEET_SPELL_ABILITY_LABELS,
    SPELLCASTING_ABILITY_AUTO,
  } from '../../model';

  /** Значение выбора: характеристика либо «считать от класса». */
  type SpellAbilityValue = AbilityKey | typeof SPELLCASTING_ABILITY_AUTO;

  /** Вариант выбора бейджем. */
  interface AbilityOption {
    value: SpellAbilityValue;
    label: string;
    selected: boolean;
    color: 'primary' | 'neutral';
    variant: 'solid' | 'subtle';
  }

  const props = defineProps<{
    /** Название заклинания: оно же заголовок окна. */
    spellName: string;

    /** Характеристика заклинания; null — считается от класса. */
    ability: AbilityKey | null;

    /** Характеристика, которую подставит класс: её называет вариант «Авто». */
    classAbility: AbilityKey | null;
  }>();

  const emit = defineEmits<{
    /**
     * Закрытие окна. Характеристика передаётся только при сохранении: null —
     * считать от класса, как у заклинаний книги.
     */
    close: [ability?: AbilityKey | null];
  }>();

  const draft = ref<SpellAbilityValue>(
    props.ability ?? SPELLCASTING_ABILITY_AUTO,
  );

  /** Подпись варианта «Авто»: называет характеристику, которую даст класс. */
  const autoLabel = computed(() =>
    props.classAbility
      ? `${SHEET_SPELL_ABILITY_LABELS.auto} (${ABILITY_LABELS[props.classAbility]})`
      : SHEET_SPELL_ABILITY_LABELS.autoUnknown,
  );

  /** Варианты выбора: «от класса» впереди, дальше шесть характеристик. */
  const values = computed<Array<{ value: SpellAbilityValue; label: string }>>(
    () => [
      { value: SPELLCASTING_ABILITY_AUTO, label: autoLabel.value },
      ...ABILITY_ORDER.map((key) => ({
        value: key,
        label: ABILITY_LABELS[key],
      })),
    ],
  );

  const options = computed<AbilityOption[]>(() =>
    values.value.map((option) => {
      const selected = draft.value === option.value;

      return {
        ...option,
        selected,
        color: selected ? 'primary' : 'neutral',
        variant: selected ? 'solid' : 'subtle',
      } satisfies AbilityOption;
    }),
  );

  /**
   * Записывает выбранный вариант.
   *
   * @param value значение варианта.
   */
  function selectAbility(value: SpellAbilityValue) {
    draft.value = value;
  }

  function handleSave() {
    emit(
      'close',
      draft.value === SPELLCASTING_ABILITY_AUTO ? null : draft.value,
    );
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="spellName"
    :description="SHEET_SPELL_ABILITY_LABELS.hint"
  >
    <template #body>
      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="option in options"
          :key="option.value"
          as="button"
          type="button"
          size="lg"
          class="cursor-pointer transition-colors"
          :color="option.color"
          :variant="option.variant"
          :aria-pressed="option.selected"
          @click.left.exact.prevent="selectAbility(option.value)"
        >
          {{ option.label }}
        </UBadge>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SHEET_SPELL_ABILITY_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="SHEET_SPELL_ABILITY_LABELS.save"
          color="primary"
          @click.left.exact.prevent="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>
