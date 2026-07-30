<script setup lang="ts">
  import type { AbilityKey } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    ARMOR_CLASS_ABILITY_OPTIONS,
    ARMOR_CLASS_BASE_MAX,
    ARMOR_CLASS_BASE_MIN,
    ARMOR_CLASS_NO_ABILITY,
    getArmorClassBreakdown,
    SHEET_UNARMORED_LABEL,
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

  const draftCustom = ref(character.value.armorClass.custom);

  const totalArmorClass = computed(() => {
    if (draftAbility.value === ARMOR_CLASS_NO_ABILITY) {
      return draftBase.value;
    }

    return (
      draftBase.value
      + getModifier(character.value.abilities[draftAbility.value])
    );
  });

  // Автоподсчёт по надетой броне для предпросмотра: считаем всегда в режиме
  // custom=false, независимо от сохранённого флага листа.
  const autoBreakdown = computed(() =>
    getArmorClassBreakdown({
      ...character.value,
      armorClass: { ...character.value.armorClass, custom: false },
    }),
  );

  function handleApply() {
    setArmorClass({
      base: draftBase.value,
      ability:
        draftAbility.value === ARMOR_CLASS_NO_ABILITY
          ? null
          : draftAbility.value,
      natural: draftNatural.value,
      custom: draftCustom.value,
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
        <UCheckbox
          v-model="draftCustom"
          label="Использовать своё значение"
          description="Иначе КД считается автоматически по надетому доспеху"
        />

        <USeparator class="my-1" />

        <template v-if="draftCustom">
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
            <span class="text-sm text-toned">Тип доспеха</span>

            <UCheckbox
              v-model="draftNatural"
              label="Природный доспех"
            />
          </div>

          <USeparator class="my-1" />

          <div class="flex items-center justify-between text-sm">
            <span class="text-muted">Итоговый КД</span>

            <span class="text-xl font-bold text-highlighted">
              {{ totalArmorClass }}
            </span>
          </div>
        </template>

        <template v-else>
          <div class="flex items-center justify-between gap-4 text-sm">
            <span class="text-toned">Доспех</span>

            <span class="text-toned">
              {{ autoBreakdown.bodyArmorName ?? SHEET_UNARMORED_LABEL }}
              <span class="text-muted">
                · {{ autoBreakdown.bodyArmorValue }}
              </span>
            </span>
          </div>

          <div
            v-if="autoBreakdown.dexCapped"
            class="text-xs text-dimmed"
          >
            Модификатор Ловкости ограничен доспехом (+{{
              autoBreakdown.dexBonus
            }})
          </div>

          <div
            v-if="autoBreakdown.shieldBonus > 0"
            class="flex items-center justify-between gap-4 text-sm"
          >
            <span class="text-toned">Щит</span>

            <span class="text-toned">+{{ autoBreakdown.shieldBonus }}</span>
          </div>

          <USeparator class="my-1" />

          <div class="flex items-center justify-between text-sm">
            <span class="text-muted">Итоговый КД</span>

            <span class="text-xl font-bold text-highlighted">
              {{ autoBreakdown.value }}
            </span>
          </div>

          <p class="text-xs text-dimmed">
            Надевайте доспехи и щит на вкладке «Снаряжение» — в зачёт идёт
            доспех с наибольшим КД, щит складывается сверху.
          </p>
        </template>
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
