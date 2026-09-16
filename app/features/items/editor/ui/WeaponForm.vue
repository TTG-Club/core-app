<script setup lang="ts">
  import type { SelectOption } from '~/shared/types';
  import type { WeaponCreate } from '~items/model';

  import { DictionaryService } from '~/shared/api';
  import {
    ITEM_ABILITY_OPTIONS,
    ITEM_EDITOR_SECTIONS,
    WEAPON_BASE_TYPE_OPTIONS,
    WEAPON_DAMAGE_ABILITY_OPTIONS,
    WEAPON_FORM_LABELS,
    WEAPON_PROFICIENCY_MODE_OPTIONS,
    WEAPON_PROPERTY_KEYS,
    WEAPON_SAVE_EFFECT_OPTIONS,
  } from '~items/model';
  import { DamageParts } from '~ui/damage-formula';
  import {
    SelectAmmunition,
    SelectOptional,
    SelectWeaponCategory,
    SelectWeaponMastery,
    SelectWeaponProperty,
  } from '~ui/select';

  const model = defineModel<WeaponCreate>({ required: true });

  /**
   * Типы урона нужны вкладке «Тип урона» редактора формулы. Грузим здесь, один
   * раз на всю подформу: частей урона у оружия может быть несколько.
   */
  const { data: damageTypes, status: damageTypesStatus } = await useAsyncData(
    'dictionaries-damage-types',
    () => DictionaryService.damageTypes(),
    { dedupe: 'defer' },
  );

  const damageTypeOptions = computed<Array<SelectOption>>(
    () => damageTypes.value ?? [],
  );

  const isDamageTypesPending = computed(
    () => damageTypesStatus.value === 'pending',
  );

  const hasAmmunition = computed(() =>
    model.value.properties.includes(WEAPON_PROPERTY_KEYS.ammunition),
  );

  const hasMagazine = computed(() =>
    model.value.properties.includes(WEAPON_PROPERTY_KEYS.magazine),
  );

  const hasVersatile = computed(() =>
    model.value.properties.includes(WEAPON_PROPERTY_KEYS.versatile),
  );

  const hasSavingThrow = computed(() => model.value.saveType !== undefined);
</script>

<template>
  <div class="grid gap-8">
    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ ITEM_EDITOR_SECTIONS.weaponMain }}
        </h2>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="md:col-span-12"
          :label="WEAPON_FORM_LABELS.baseType"
          :tooltip="WEAPON_FORM_LABELS.baseTypeHint"
          name="weapon.baseType"
        >
          <SelectOptional
            v-model="model.baseType"
            :items="WEAPON_BASE_TYPE_OPTIONS"
            :unset-label="WEAPON_FORM_LABELS.baseTypeUnset"
          />
        </UFormField>

        <UFormField
          class="md:col-span-12"
          :label="WEAPON_FORM_LABELS.category"
          name="weapon.category"
        >
          <SelectWeaponCategory v-model="model.category" />
        </UFormField>

        <UFormField
          class="md:col-span-12"
          :label="WEAPON_FORM_LABELS.mastery"
          name="weapon.mastery"
        >
          <SelectWeaponMastery v-model="model.mastery" />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ ITEM_EDITOR_SECTIONS.weaponProperties }}
        </h2>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="md:col-span-24"
          :label="WEAPON_FORM_LABELS.properties"
          name="weapon.properties"
        >
          <SelectWeaponProperty
            v-model="model.properties"
            multiple
          />
        </UFormField>

        <UFormField
          v-if="hasAmmunition"
          class="md:col-span-12"
          :label="WEAPON_FORM_LABELS.ammo"
          name="weapon.ammo"
        >
          <SelectAmmunition v-model="model.ammo" />
        </UFormField>

        <UFormField
          v-if="hasMagazine"
          class="md:col-span-12"
          :label="WEAPON_FORM_LABELS.magazine"
          :tooltip="WEAPON_FORM_LABELS.magazineHint"
          name="weapon.magazine"
        >
          <UInputNumber
            v-model="model.magazine"
            :placeholder="WEAPON_FORM_LABELS.magazinePlaceholder"
            :min="1"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ ITEM_EDITOR_SECTIONS.weaponRange }}
        </h2>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="md:col-span-8"
          :label="WEAPON_FORM_LABELS.reach"
          :tooltip="WEAPON_FORM_LABELS.reachHint"
          name="weapon.reach"
        >
          <UInputNumber
            v-model="model.reach"
            :min="0"
            :step="5"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8"
          :label="WEAPON_FORM_LABELS.rangeNormal"
          name="weapon.range.normal"
        >
          <UInputNumber
            v-model="model.range.normal"
            :placeholder="WEAPON_FORM_LABELS.rangePlaceholder"
            :min="0"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8"
          :label="WEAPON_FORM_LABELS.rangeMax"
          name="weapon.range.max"
        >
          <UInputNumber
            v-model="model.range.max"
            :placeholder="WEAPON_FORM_LABELS.rangePlaceholder"
            :min="0"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <div class="flex min-w-0 flex-col">
          <h2 class="truncate text-base text-highlighted">
            {{ ITEM_EDITOR_SECTIONS.weaponAttack }}
          </h2>

          <span class="text-xs text-muted">
            {{ WEAPON_FORM_LABELS.attackAbilityHint }}
          </span>
        </div>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="md:col-span-8"
          :label="WEAPON_FORM_LABELS.attackAbility"
          name="weapon.attackAbility"
        >
          <SelectOptional
            v-model="model.attackAbility"
            :items="ITEM_ABILITY_OPTIONS"
            :unset-label="WEAPON_FORM_LABELS.attackAbilityUnset"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8"
          :label="WEAPON_FORM_LABELS.attackBonus"
          name="weapon.attackBonus"
        >
          <UInputNumber
            v-model="model.attackBonus"
            :placeholder="WEAPON_FORM_LABELS.bonusPlaceholder"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8"
          :label="WEAPON_FORM_LABELS.proficiencyMode"
          :tooltip="WEAPON_FORM_LABELS.proficiencyModeHint"
          name="weapon.proficiencyMode"
        >
          <SelectOptional
            v-model="model.proficiencyMode"
            :items="WEAPON_PROFICIENCY_MODE_OPTIONS"
            :unset-label="WEAPON_FORM_LABELS.proficiencyModeUnset"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ ITEM_EDITOR_SECTIONS.weaponDamage }}
        </h2>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <DamageParts
          v-model="model.damageParts"
          :damage-type-options="damageTypeOptions"
          :damage-types-pending="isDamageTypesPending"
          :empty-label="WEAPON_FORM_LABELS.damageEmpty"
          :show-versatile="hasVersatile"
          field-name-prefix="weapon.damageParts"
          hide-modifiers
        />

        <UFormField
          class="md:col-span-12"
          :label="WEAPON_FORM_LABELS.damageAbility"
          name="weapon.damageAbility"
        >
          <SelectOptional
            v-model="model.damageAbility"
            :items="WEAPON_DAMAGE_ABILITY_OPTIONS"
            :unset-label="WEAPON_FORM_LABELS.damageAbilityUnset"
          />
        </UFormField>

        <UFormField
          class="md:col-span-12"
          :label="WEAPON_FORM_LABELS.damageBonus"
          name="weapon.damageBonus"
        >
          <UInputNumber
            v-model="model.damageBonus"
            :placeholder="WEAPON_FORM_LABELS.bonusPlaceholder"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          {{ ITEM_EDITOR_SECTIONS.weaponSave }}
        </h2>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="md:col-span-12"
          :label="WEAPON_FORM_LABELS.saveType"
          name="weapon.saveType"
        >
          <SelectOptional
            v-model="model.saveType"
            :items="ITEM_ABILITY_OPTIONS"
            :unset-label="WEAPON_FORM_LABELS.saveTypeUnset"
          />
        </UFormField>

        <UFormField
          v-if="hasSavingThrow"
          class="md:col-span-12"
          :label="WEAPON_FORM_LABELS.saveEffect"
          name="weapon.saveEffect"
        >
          <USelect
            v-model="model.saveEffect"
            :items="WEAPON_SAVE_EFFECT_OPTIONS"
            :placeholder="WEAPON_FORM_LABELS.saveEffectPlaceholder"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <div class="flex min-w-0 flex-col">
          <h2 class="truncate text-base text-highlighted">
            {{ ITEM_EDITOR_SECTIONS.weaponSpecial }}
          </h2>

          <span class="text-xs text-muted">
            {{ WEAPON_FORM_LABELS.additionalHint }}
          </span>
        </div>
      </template>

      <UFormField
        :label="WEAPON_FORM_LABELS.additional"
        name="weapon.additional"
      >
        <UTextarea
          v-model="model.additional"
          autoresize
          :rows="2"
          :placeholder="WEAPON_FORM_LABELS.additionalPlaceholder"
        />
      </UFormField>
    </UCard>
  </div>
</template>
