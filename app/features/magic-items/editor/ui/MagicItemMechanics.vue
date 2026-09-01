<script setup lang="ts">
  import type { MagicItemMechanics } from '../../model';

  import {
    MAGIC_ITEM_ACTIVATION_OPTIONS,
    MAGIC_ITEM_CHARGES_MAX,
    MAGIC_ITEM_FORM_LABELS,
    MAGIC_ITEM_RECHARGE_EVENT_OPTIONS,
  } from '../../model';

  const mechanics = defineModel<MagicItemMechanics>({ required: true });

  // Заряды описывает максимум: без него ни формула восстановления, ни событие
  // ничего не значат, поэтому остальные поля ждут его заполнения.
  const hasCharges = computed(
    () => (mechanics.value.resource.maxCharges ?? 0) > 0,
  );
</script>

<template>
  <UForm
    class="grid grid-cols-1 gap-4 md:grid-cols-24"
    attach
    :state="mechanics"
  >
    <UFormField
      class="md:col-span-12 lg:col-span-8"
      :label="MAGIC_ITEM_FORM_LABELS.activation"
      :help="MAGIC_ITEM_FORM_LABELS.activationHint"
      name="activation"
    >
      <USelectMenu
        v-model="mechanics.activation"
        :items="MAGIC_ITEM_ACTIVATION_OPTIONS"
        value-key="value"
        label-key="label"
        :placeholder="MAGIC_ITEM_FORM_LABELS.activationPlaceholder"
      />
    </UFormField>

    <UFormField
      class="md:col-span-12 lg:col-span-16"
      :label="MAGIC_ITEM_FORM_LABELS.passive"
      :help="MAGIC_ITEM_FORM_LABELS.passiveHint"
      name="passive"
    >
      <UInput
        v-model="mechanics.passive"
        :placeholder="MAGIC_ITEM_FORM_LABELS.passivePlaceholder"
      />
    </UFormField>

    <UFormField
      class="md:col-span-8 lg:col-span-6"
      :label="MAGIC_ITEM_FORM_LABELS.maxCharges"
      :help="MAGIC_ITEM_FORM_LABELS.maxChargesHint"
      name="resource.maxCharges"
    >
      <UInputNumber
        v-model="mechanics.resource.maxCharges"
        :placeholder="MAGIC_ITEM_FORM_LABELS.maxChargesPlaceholder"
        :min="0"
        :max="MAGIC_ITEM_CHARGES_MAX"
      />
    </UFormField>

    <UFormField
      class="md:col-span-8 lg:col-span-6"
      :label="MAGIC_ITEM_FORM_LABELS.recharge"
      :help="MAGIC_ITEM_FORM_LABELS.rechargeHint"
      name="resource.recharge"
    >
      <UInput
        v-model="mechanics.resource.recharge"
        :placeholder="MAGIC_ITEM_FORM_LABELS.rechargePlaceholder"
        :disabled="!hasCharges"
      />
    </UFormField>

    <UFormField
      class="md:col-span-8 lg:col-span-8"
      :label="MAGIC_ITEM_FORM_LABELS.rechargeEvent"
      name="resource.rechargeEvent"
    >
      <USelectMenu
        v-model="mechanics.resource.rechargeEvent"
        :items="MAGIC_ITEM_RECHARGE_EVENT_OPTIONS"
        value-key="value"
        label-key="label"
        :placeholder="MAGIC_ITEM_FORM_LABELS.rechargeEventPlaceholder"
        :disabled="!hasCharges"
      />
    </UFormField>

    <UFormField
      class="md:col-span-8 lg:col-span-4"
      :label="MAGIC_ITEM_FORM_LABELS.chargeCost"
      :help="MAGIC_ITEM_FORM_LABELS.chargeCostHint"
      name="resource.cost"
    >
      <UInputNumber
        v-model="mechanics.resource.cost"
        :placeholder="MAGIC_ITEM_FORM_LABELS.chargeCostPlaceholder"
        :min="0"
        :max="MAGIC_ITEM_CHARGES_MAX"
        :disabled="!hasCharges"
      />
    </UFormField>
  </UForm>
</template>
