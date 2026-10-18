<script setup lang="ts">
  import type { FacilityEnlargementForm, FacilitySpaceCode } from '../../model';

  import { BASTION_EDITOR_LABELS, createEnlargement } from '../../model';

  /**
   * Расширение сооружения. Выключенная галочка — `null`: сооружение не
   * расширяется, и мини-игра не предложит его расширить.
   */
  defineProps<{
    spaceItems: Array<{ label: string; value: FacilitySpaceCode }>;
  }>();

  const model = defineModel<FacilityEnlargementForm | null>({ required: true });

  const isEnabled = computed({
    get: () => model.value !== null,
    set: (enabled: boolean) => {
      model.value = enabled ? createEnlargement() : null;
    },
  });
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="truncate text-base text-highlighted">
        {{ BASTION_EDITOR_LABELS.enlargementTitle }}
      </h2>
    </template>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
      <UCheckbox
        v-model="isEnabled"
        class="md:col-span-24"
        :label="BASTION_EDITOR_LABELS.enlargementEnabled"
      />

      <template v-if="model">
        <UFormField
          class="md:col-span-9"
          :label="BASTION_EDITOR_LABELS.enlargementSpace"
        >
          <USelect
            v-model="model.space"
            :items="spaceItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          class="md:col-span-5"
          :label="BASTION_EDITOR_LABELS.enlargementCost"
        >
          <UInputNumber
            v-model="model.cost"
            :min="0"
            class="w-full"
          />
        </UFormField>

        <UFormField
          class="md:col-span-5"
          :label="BASTION_EDITOR_LABELS.enlargementDays"
        >
          <UInputNumber
            v-model="model.days"
            :min="0"
            class="w-full"
          />
        </UFormField>

        <UFormField
          class="md:col-span-5"
          :label="BASTION_EDITOR_LABELS.enlargementHirelings"
        >
          <UInputNumber
            v-model="model.additionalHirelings"
            :min="0"
            class="w-full"
          />
        </UFormField>

        <UFormField
          class="md:col-span-24"
          :label="BASTION_EDITOR_LABELS.enlargementDescription"
        >
          <UTextarea
            v-model="model.description"
            :rows="2"
            autoresize
            class="w-full"
          />
        </UFormField>
      </template>
    </div>
  </UCard>
</template>
