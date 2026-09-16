<script setup lang="ts">
  import type { WeaponCreate } from '~items/model';

  import {
    ITEM_EDITOR_SECTIONS,
    LEGACY_DAMAGE_LABELS,
    toLegacyWeaponDamage,
  } from '~items/model';
  import { SelectDamageType } from '~ui/select';

  import RollInput from './RollInput.vue';

  const { weapon } = defineProps<{
    weapon: WeaponCreate;
  }>();

  /**
   * Прежнее представление урона считается из первой части — ровно то, что
   * уедет в запрос. Поля показываем выключенными: правится урон частями, а это
   * их след для листа персонажа и записей, сохранённых раньше.
   */
  const legacy = computed(() => toLegacyWeaponDamage(weapon));

  /**
   * Формулу первой части в кости не разложить — прежние значения остались
   * такими, какими их сохранили.
   */
  const keepsStoredValues = computed(
    () => legacy.value.damage === weapon.damage,
  );
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex min-w-0 flex-col">
        <h2 class="truncate text-base text-highlighted">
          {{ ITEM_EDITOR_SECTIONS.legacyDamage }}
        </h2>

        <span class="text-xs text-muted">{{ LEGACY_DAMAGE_LABELS.hint }}</span>
      </div>
    </template>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
      <UAlert
        v-if="keepsStoredValues"
        class="md:col-span-24"
        color="neutral"
        variant="subtle"
        icon="tabler:info-circle"
        :description="LEGACY_DAMAGE_LABELS.complexFormula"
      />

      <UFormField
        class="md:col-span-12"
        :label="LEGACY_DAMAGE_LABELS.damage"
        name="weapon.damage.roll"
      >
        <RollInput
          :model-value="legacy.damage.roll"
          disabled
        />
      </UFormField>

      <UFormField
        class="md:col-span-12"
        :label="LEGACY_DAMAGE_LABELS.damageType"
        name="weapon.damage.type"
      >
        <SelectDamageType
          :model-value="legacy.damage.type"
          disabled
        />
      </UFormField>

      <UFormField
        class="md:col-span-12"
        :label="LEGACY_DAMAGE_LABELS.versatile"
        name="weapon.versatile"
      >
        <RollInput
          :model-value="legacy.versatile"
          disabled
        />
      </UFormField>
    </div>
  </UCard>
</template>
