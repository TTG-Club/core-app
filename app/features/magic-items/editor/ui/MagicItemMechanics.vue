<script setup lang="ts">
  import type { MagicItemMechanics } from '~magic-items/model';

  import { ActiveEffects } from '~active-effects/editor';
  import {
    MAGIC_ITEM_ACTIVATION_OPTIONS,
    MAGIC_ITEM_CHARGES_MAX,
    MAGIC_ITEM_RECHARGE_EVENT_OPTIONS,
  } from '~magic-items/model';

  const mechanics = defineModel<MagicItemMechanics>({ required: true });

  // Заряды описывает максимум: без него ни формула восстановления, ни событие
  // ничего не значат, поэтому остальные поля ждут его заполнения.
  const hasCharges = computed(
    () => (mechanics.value.resource.maxCharges ?? 0) > 0,
  );
</script>

<template>
  <div class="grid grid-cols-1 gap-8">
    <UCard variant="subtle">
      <template #header>
        <div class="flex min-w-0 flex-col">
          <h2 class="truncate text-base text-highlighted">
            Влияние на лист персонажа
          </h2>

          <span class="text-xs text-muted">
            Когда работает магия предмета, сколько у него зарядов и что лист
            показывает справкой
          </span>
        </div>
      </template>

      <UForm
        class="grid grid-cols-1 gap-4 md:grid-cols-24"
        attach
        :state="mechanics"
      >
        <UFormField
          class="md:col-span-12 lg:col-span-8"
          label="Условие применения"
          help="Когда эффекты включены. Требование настройки задаётся отдельно и проверяется вдобавок"
          name="activation"
        >
          <USelectMenu
            v-model="mechanics.activation"
            :items="MAGIC_ITEM_ACTIVATION_OPTIONS"
            value-key="value"
            label-key="label"
            placeholder="Выбери условие"
          />
        </UFormField>

        <UFormField
          class="md:col-span-12 lg:col-span-16"
          label="Пассивные свойства"
          help="То, что лист показывает справкой, но не считает: дыхание под водой, иммунитет к чтению мыслей"
          name="passive"
        >
          <UInput
            v-model="mechanics.passive"
            placeholder="Например: вы можете дышать под водой"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8 lg:col-span-6"
          label="Максимум зарядов"
          help="Пусто — зарядов у предмета нет"
          name="resource.maxCharges"
        >
          <UInputNumber
            v-model="mechanics.resource.maxCharges"
            placeholder="Введи максимум"
            :min="0"
            :max="MAGIC_ITEM_CHARGES_MAX"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8 lg:col-span-6"
          label="Формула восстановления"
          help="Сколько зарядов возвращается, например «1к6+4»"
          name="resource.recharge"
        >
          <UInput
            v-model="mechanics.resource.recharge"
            placeholder="Введи формулу"
            :disabled="!hasCharges"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8 lg:col-span-8"
          label="Когда восстанавливаются"
          name="resource.rechargeEvent"
        >
          <USelectMenu
            v-model="mechanics.resource.rechargeEvent"
            :items="MAGIC_ITEM_RECHARGE_EVENT_OPTIONS"
            value-key="value"
            label-key="label"
            placeholder="Выбери событие"
            :disabled="!hasCharges"
          />
        </UFormField>

        <UFormField
          class="md:col-span-8 lg:col-span-4"
          label="Стоимость применения"
          help="Сколько зарядов тратит одно использование"
          name="resource.cost"
        >
          <UInputNumber
            v-model="mechanics.resource.cost"
            placeholder="Заряды"
            :min="0"
            :max="MAGIC_ITEM_CHARGES_MAX"
            :disabled="!hasCharges"
          />
        </UFormField>
      </UForm>
    </UCard>

    <ActiveEffects
      v-model="mechanics.activeEffects"
      origin="item"
    />
  </div>
</template>
