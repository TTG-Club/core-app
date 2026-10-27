<script setup lang="ts">
  import type {
    PlayerBastion,
    PlayerBastionFacility,
    StableAnimal,
  } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import { useBastionAction } from '../../composables';
  import {
    formatStableSpace,
    removeStableAnimal,
    STABLE_LABELS,
  } from '../../model';
  import StableAnimalList from './StableAnimalList.vue';

  /**
   * Стойло конюшни: какие животные в нём стоят и сколько места занято. Игрок
   * персонажа или ведущий забирает животное — например, персонаж взял его
   * с собой или оно погибло.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { bastion, facility, canManage } = defineProps<{
    bastion: PlayerBastion;
    facility: PlayerBastionFacility;
    /** Можно забирать животных, а не только смотреть. */
    canManage: boolean;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { run } = useBastionAction();

  const occupiedText = computed(() => {
    const stable = facility.stable;

    if (!stable) {
      return '';
    }

    return fillTemplate(STABLE_LABELS.occupied, {
      occupied: formatStableSpace(stable.occupied),
      capacity: formatStableSpace(stable.capacity),
    });
  });

  /**
   * Забирает животное из конюшни.
   *
   * @param animal Животное.
   */
  async function remove(animal: StableAnimal): Promise<void> {
    const updated = await run(
      () => removeStableAnimal(bastion.id, facility.id, animal.id),
      STABLE_LABELS.removed,
    );

    if (updated) {
      emit('updated', updated);
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="STABLE_LABELS.title"
    :description="occupiedText"
  >
    <template #body>
      <StableAnimalList
        v-if="facility.stable"
        :stable="facility.stable"
        :can-remove="canManage"
        @remove="remove"
      />
    </template>
  </UModal>
</template>
