<script setup lang="ts">
  import type { MagicItemBonuses } from '~magic-items/model';

  import {
    MAGIC_ITEM_BONUS_MAX,
    MAGIC_ITEM_BONUS_MIN,
  } from '~magic-items/model';

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
      label="Бонус к атаке"
      help="Например, 1 у оружия +1. Отрицательный — у проклятых предметов"
      name="attack"
    >
      <UInputNumber
        v-model="bonuses.attack"
        placeholder="Введи бонус к атаке"
        :min="MAGIC_ITEM_BONUS_MIN"
        :max="MAGIC_ITEM_BONUS_MAX"
      />
    </UFormField>

    <UFormField
      class="md:col-span-8"
      label="Бонус к урону"
      help="Прибавляется к броску урона немагического предмета"
      name="damage"
    >
      <UInputNumber
        v-model="bonuses.damage"
        placeholder="Введи бонус к урону"
        :min="MAGIC_ITEM_BONUS_MIN"
        :max="MAGIC_ITEM_BONUS_MAX"
      />
    </UFormField>

    <UFormField
      class="md:col-span-8"
      label="Бонус к КД"
      help="Прибавляется к классу доспеха — у доспехов, щитов и плащей защиты"
      name="armorClass"
    >
      <UInputNumber
        v-model="bonuses.armorClass"
        placeholder="Введи бонус к КД"
        :min="MAGIC_ITEM_BONUS_MIN"
        :max="MAGIC_ITEM_BONUS_MAX"
      />
    </UFormField>
  </UForm>
</template>
