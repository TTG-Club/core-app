<script setup lang="ts">
  import type { FeatAbilityRequirement } from '../../model';

  import { SelectAbilities } from '~ui/select';

  const model = defineModel<Array<FeatAbilityRequirement>>({
    default: () => [],
  });

  function removeRequirement(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      Требований к характеристикам нет.
    </p>

    <div
      v-for="(requirement, index) in model"
      :key="index"
      class="grid grid-cols-24 items-end gap-2 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <UFormField
        class="col-span-full md:col-span-18"
        label="Достаточно любой из"
      >
        <SelectAbilities
          v-model="requirement.anyOf"
          :limit="6"
          multiple
        />
      </UFormField>

      <UFormField
        class="col-span-20 md:col-span-5"
        label="Не меньше"
      >
        <UInputNumber
          v-model="requirement.minValue"
          :min="1"
        />
      </UFormField>

      <div class="col-span-4 flex justify-end md:col-span-1">
        <UButton
          color="error"
          icon="tabler:trash"
          size="xs"
          variant="ghost"
          @click.left.exact.prevent="removeRequirement(index)"
        />
      </div>
    </div>
  </div>
</template>
