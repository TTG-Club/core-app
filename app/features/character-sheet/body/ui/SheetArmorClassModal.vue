<script setup lang="ts">
  import type { AbilityKey } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    ARMOR_CLASS_ABILITY_OPTIONS,
    ARMOR_CLASS_BASE_MAX,
    ARMOR_CLASS_BASE_MIN,
    ARMOR_CLASS_NO_ABILITY,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setArmorClass } = useCharacterSheet();

  const draftBase = ref(character.value.armorClass.base);

  const draftAbility = ref<AbilityKey | typeof ARMOR_CLASS_NO_ABILITY>(
    character.value.armorClass.ability ?? ARMOR_CLASS_NO_ABILITY,
  );

  const draftNatural = ref(character.value.armorClass.natural);

  const totalArmorClass = computed(() => {
    if (draftAbility.value === ARMOR_CLASS_NO_ABILITY) {
      return draftBase.value;
    }

    return (
      draftBase.value
      + getModifier(character.value.abilities[draftAbility.value])
    );
  });

  function handleApply() {
    setArmorClass({
      base: draftBase.value,
      ability:
        draftAbility.value === ARMOR_CLASS_NO_ABILITY
          ? null
          : draftAbility.value,
      natural: draftNatural.value,
    });

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal title="Класс доспеха">
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">Значение</span>

          <UInputNumber
            v-model="draftBase"
            :min="ARMOR_CLASS_BASE_MIN"
            :max="ARMOR_CLASS_BASE_MAX"
            class="w-40"
          />
        </div>

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">Характеристика</span>

          <USelect
            v-model="draftAbility"
            :items="ARMOR_CLASS_ABILITY_OPTIONS"
            class="w-40"
          />
        </div>

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">Тип брони</span>

          <UCheckbox
            v-model="draftNatural"
            label="Природная броня"
          />
        </div>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">Итоговый КД</span>

          <span class="text-xl font-bold text-highlighted">
            {{ totalArmorClass }}
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
          label="Применить"
          color="primary"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
