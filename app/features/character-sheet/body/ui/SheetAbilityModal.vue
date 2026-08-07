<script setup lang="ts">
  import type { AbilityKey } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_ITEM_BONUS_LABELS,
    ABILITY_LABELS,
    ABILITY_SCORE_MAX,
    ABILITY_SCORE_MIN,
    getFormattedBonus,
    getInventoryBonusValue,
  } from '../../model';

  const props = defineProps<{
    abilityKey: AbilityKey;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setAbilityScore } = useCharacterSheet();

  const abilityLabel = computed(() => ABILITY_LABELS[props.abilityKey]);

  const draftScore = ref(character.value.abilities[props.abilityKey]);

  // Правится записанное значение, а лист считает его вместе с бонусами
  // снаряжения — модификатор в модалке показывается по итоговому, иначе он
  // разошёлся бы с плиткой.
  const itemBonus = computed(() =>
    getInventoryBonusValue(character.value, 'ability', props.abilityKey),
  );

  const formattedDraftModifier = computed(() =>
    getFormattedModifier(draftScore.value + itemBonus.value),
  );

  const itemBonusHint = computed(() =>
    itemBonus.value === 0
      ? ''
      : `${ABILITY_ITEM_BONUS_LABELS.modalHint} ${getFormattedBonus(
          itemBonus.value,
        )}: итог ${draftScore.value + itemBonus.value}`,
  );

  function handleSave() {
    setAbilityScore(props.abilityKey, draftScore.value);
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="abilityLabel"
    description="Укажите значение характеристики — модификатор рассчитается автоматически"
  >
    <template #body>
      <div class="flex items-center justify-between gap-6">
        <UFormField label="Значение">
          <UInputNumber
            v-model="draftScore"
            :min="ABILITY_SCORE_MIN"
            :max="ABILITY_SCORE_MAX"
            class="w-40"
          />
        </UFormField>

        <div class="flex flex-col items-center gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            Модификатор
          </span>

          <span class="text-3xl leading-none font-bold text-highlighted">
            {{ formattedDraftModifier }}
          </span>
        </div>
      </div>

      <span
        v-if="itemBonusHint"
        class="mt-2 block text-xs text-dimmed"
      >
        {{ itemBonusHint }}
      </span>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          label="Сохранить"
          color="primary"
          @click.left.exact.prevent="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>
