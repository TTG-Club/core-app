<script setup lang="ts">
  import type { FeatAbilityBonus } from '../../model';

  import { SelectAbilities } from '~ui/select';

  import { createAbilityBonus } from '../../model';

  const model = defineModel<Array<FeatAbilityBonus>>({ default: () => [] });

  function addBonus() {
    model.value = [...model.value, createAbilityBonus()];
  }

  function removeBonus(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-4">
      <span class="text-sm text-dimmed">
        Несколько вариантов — это выбор «или»: «Улучшение характеристик» даёт +2
        к одной либо +1 к двум.
      </span>

      <UButton
        icon="tabler:plus"
        size="xs"
        variant="ghost"
        @click.left.exact.prevent="addBonus"
      >
        Добавить вариант
      </UButton>
    </div>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      Черта не повышает характеристики.
    </p>

    <div
      v-for="(bonus, index) in model"
      :key="index"
      class="grid grid-cols-24 items-end gap-2 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <UFormField
        class="col-span-full md:col-span-10"
        label="Характеристики на выбор"
      >
        <SelectAbilities
          v-model="bonus.abilities"
          :limit="6"
          multiple
        />
      </UFormField>

      <UFormField
        class="col-span-8 md:col-span-3"
        label="Прибавка"
      >
        <UInputNumber
          v-model="bonus.bonus"
          :min="1"
        />
      </UFormField>

      <UFormField
        class="col-span-8 md:col-span-3"
        label="Сколько выбрать"
      >
        <UInputNumber
          v-model="bonus.count"
          :min="1"
        />
      </UFormField>

      <UFormField
        class="col-span-8 md:col-span-3"
        label="Предел"
      >
        <UInputNumber
          v-model="bonus.upto"
          :max="30"
          :min="1"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-4"
        label="Ключ выбора"
      >
        <UInput
          v-model="bonus.fromChoiceKey"
          placeholder="saving-throw"
        />
      </UFormField>

      <div class="col-span-full flex justify-end md:col-span-1">
        <UButton
          color="error"
          icon="tabler:trash"
          size="xs"
          variant="ghost"
          @click.left.exact.prevent="removeBonus(index)"
        />
      </div>
    </div>
  </div>
</template>
