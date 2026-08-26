<script setup lang="ts">
  import type { MagicItemBonuses } from '../../model';

  import {
    MAGIC_ITEM_BONUS_MAX,
    MAGIC_ITEM_BONUS_MIN,
    MAGIC_ITEM_FORM_LABELS,
  } from '../../model';

  const bonuses = defineModel<MagicItemBonuses>({ required: true });
</script>

<template>
  <UForm
    class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
    attach
    :state="bonuses"
  >
    <UFormField
      class="md:col-span-8"
      :label="MAGIC_ITEM_FORM_LABELS.bonusAttack"
      :help="MAGIC_ITEM_FORM_LABELS.bonusAttackHint"
      name="attack"
    >
      <UInputNumber
        v-model="bonuses.attack"
        :placeholder="MAGIC_ITEM_FORM_LABELS.bonusPlaceholder"
        :min="MAGIC_ITEM_BONUS_MIN"
        :max="MAGIC_ITEM_BONUS_MAX"
      />
    </UFormField>

    <UFormField
      class="md:col-span-8"
      :label="MAGIC_ITEM_FORM_LABELS.bonusDamage"
      :help="MAGIC_ITEM_FORM_LABELS.bonusDamageHint"
      name="damage"
    >
      <UInputNumber
        v-model="bonuses.damage"
        :placeholder="MAGIC_ITEM_FORM_LABELS.bonusPlaceholder"
        :min="MAGIC_ITEM_BONUS_MIN"
        :max="MAGIC_ITEM_BONUS_MAX"
      />
    </UFormField>

    <UFormField
      class="md:col-span-8"
      :label="MAGIC_ITEM_FORM_LABELS.bonusArmorClass"
      :help="MAGIC_ITEM_FORM_LABELS.bonusArmorClassHint"
      name="armorClass"
    >
      <UInputNumber
        v-model="bonuses.armorClass"
        :placeholder="MAGIC_ITEM_FORM_LABELS.bonusPlaceholder"
        :min="MAGIC_ITEM_BONUS_MIN"
        :max="MAGIC_ITEM_BONUS_MAX"
      />
    </UFormField>
  </UForm>
</template>
