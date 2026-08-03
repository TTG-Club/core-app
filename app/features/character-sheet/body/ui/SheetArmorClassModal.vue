<script setup lang="ts">
  import type { AbilityKey } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    ABILITY_OPTIONS,
    ARMOR_CLASS_BASE_MAX,
    ARMOR_CLASS_BASE_MIN,
    ARMOR_CLASS_LABELS,
    getArmorClassBreakdown,
    getFormattedBonus,
    getUnarmoredArmorClassLabel,
    toSelectedAbilityKeys,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setArmorClass } = useCharacterSheet();

  const draftBase = ref(character.value.armorClass.base);

  const draftAbilities = ref<AbilityKey[]>([
    ...character.value.armorClass.abilities,
  ]);

  const draftNatural = ref(character.value.armorClass.natural);

  const draftCustom = ref(character.value.armorClass.custom);

  // Персонаж черновика: и ручной, и автоматический предпросмотр считаются той же
  // утилитой, что и лист, — расхождению правил взяться негде.
  const draftCharacter = computed(() => ({
    ...character.value,
    armorClass: {
      base: draftBase.value,
      abilities: draftAbilities.value,
      natural: draftNatural.value,
      custom: draftCustom.value,
    },
  }));

  const breakdown = computed(() =>
    getArmorClassBreakdown(draftCharacter.value),
  );

  const abilitiesHint = computed(() => {
    if (draftCustom.value) {
      return draftAbilities.value.length
        ? ARMOR_CLASS_LABELS.abilitiesCustomHint
        : ARMOR_CLASS_LABELS.abilitiesCustomEmptyHint;
    }

    return draftAbilities.value.length
      ? ARMOR_CLASS_LABELS.abilitiesArmorHint
      : ARMOR_CLASS_LABELS.abilitiesArmorEmptyHint;
  });

  const bodyArmorLabel = computed(
    () =>
      breakdown.value.bodyArmorName
      ?? getUnarmoredArmorClassLabel(draftAbilities.value),
  );

  const dexCappedHint = computed(
    () =>
      `${ARMOR_CLASS_LABELS.dexCappedHint} (${getFormattedBonus(breakdown.value.dexBonus)})`,
  );

  // В ручном режиме без выбранных характеристик между настройками и итогом
  // показывать нечего: разделитель там только сдвоил бы линию.
  const hasBreakdownRows = computed(
    () => !draftCustom.value || breakdown.value.extraAbilities.length > 0,
  );

  function handleAbilities(value: unknown): void {
    draftAbilities.value = toSelectedAbilityKeys(value);
  }

  function handleApply() {
    setArmorClass({
      base: draftBase.value,
      abilities: draftAbilities.value,
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
  <UModal :title="ARMOR_CLASS_LABELS.title">
    <template #body>
      <div class="flex flex-col gap-3">
        <UCheckbox
          v-model="draftCustom"
          :label="ARMOR_CLASS_LABELS.customToggle"
          :description="ARMOR_CLASS_LABELS.customToggleHint"
        />

        <USeparator class="my-1" />

        <div
          v-if="draftCustom"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">
            {{ ARMOR_CLASS_LABELS.valueTitle }}
          </span>

          <UInputNumber
            v-model="draftBase"
            :min="ARMOR_CLASS_BASE_MIN"
            :max="ARMOR_CLASS_BASE_MAX"
            class="w-40"
          />
        </div>

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">
            {{ ARMOR_CLASS_LABELS.abilitiesTitle }}
          </span>

          <USelectMenu
            :model-value="draftAbilities"
            :items="ABILITY_OPTIONS"
            :placeholder="ARMOR_CLASS_LABELS.abilitiesPlaceholder"
            label-key="label"
            value-key="value"
            multiple
            class="w-56"
            @update:model-value="handleAbilities"
          />
        </div>

        <p class="text-xs text-dimmed">{{ abilitiesHint }}</p>

        <div
          v-if="draftCustom"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-sm text-toned">
            {{ ARMOR_CLASS_LABELS.armorTypeTitle }}
          </span>

          <UCheckbox
            v-model="draftNatural"
            :label="ARMOR_CLASS_LABELS.naturalArmor"
          />
        </div>

        <USeparator
          v-if="hasBreakdownRows"
          class="my-1"
        />

        <template v-if="!draftCustom">
          <div class="flex items-center justify-between gap-4 text-sm">
            <span class="text-toned">{{ ARMOR_CLASS_LABELS.armorTitle }}</span>

            <span class="text-toned">
              {{ bodyArmorLabel }}

              <span class="text-muted">· {{ breakdown.bodyArmorValue }}</span>
            </span>
          </div>

          <div
            v-if="breakdown.dexCapped"
            class="text-xs text-dimmed"
          >
            {{ dexCappedHint }}
          </div>

          <div
            v-if="breakdown.shieldBonus > 0"
            class="flex items-center justify-between gap-4 text-sm"
          >
            <span class="text-toned">{{ ARMOR_CLASS_LABELS.shieldTitle }}</span>

            <span class="text-toned">
              {{ getFormattedBonus(breakdown.shieldBonus) }}
            </span>
          </div>

          <div
            v-if="breakdown.itemBonus !== 0"
            class="flex items-center justify-between gap-4 text-sm"
          >
            <span class="text-toned">{{ ARMOR_CLASS_LABELS.itemTitle }}</span>

            <span class="text-toned">
              {{ getFormattedBonus(breakdown.itemBonus) }}
            </span>
          </div>
        </template>

        <div
          v-for="bonus in breakdown.extraAbilities"
          :key="bonus.ability"
          class="flex items-center justify-between gap-4 text-sm"
        >
          <span class="text-toned">{{ ABILITY_LABELS[bonus.ability] }}</span>

          <span class="text-toned">{{
            getFormattedBonus(bonus.modifier)
          }}</span>
        </div>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">{{ ARMOR_CLASS_LABELS.totalTitle }}</span>

          <span class="text-xl font-bold text-highlighted">
            {{ breakdown.value }}
          </span>
        </div>

        <p
          v-if="!draftCustom"
          class="text-xs text-dimmed"
        >
          {{ ARMOR_CLASS_LABELS.equipmentHint }}
        </p>
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
