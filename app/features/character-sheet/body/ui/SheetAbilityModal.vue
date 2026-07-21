<script setup lang="ts">
  import type { AbilityKey } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    ABILITY_SCORE_MAX,
    ABILITY_SCORE_MIN,
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

  const formattedDraftModifier = computed(() =>
    getFormattedModifier(draftScore.value),
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
          color="warning"
          @click.left.exact.prevent="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>
