<script setup lang="ts">
  import type { PlayerBastion, PlayerBastionMember } from '../../model';

  import { fillTemplate } from '~bastions/model';
  import { UiModalActions } from '~ui/modal-actions';

  import { useBastionAction, useFacilityCatalog } from '../../composables';
  import {
    ACTIVITY_LABELS,
    addSpecialFacility,
    getAvailableSpecialFacilities,
  } from '../../model';

  /**
   * Новое специализированное сооружение, полученное с уровнем: список —
   * доступные по уровню и ещё не взятые (кроме «можно несколько»).
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { bastion, member } = defineProps<{
    bastion: PlayerBastion;
    member: PlayerBastionMember;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { catalog } = useFacilityCatalog();
  const { isRunning, run } = useBastionAction();

  const facilityUrl = ref<string>();

  const facilityItems = computed(() => {
    const taken = new Set(
      member.facilities.map((facility) => facility.facilityUrl),
    );

    return getAvailableSpecialFacilities(catalog.value, member.characterLevel)
      .filter((facility) => !!facility.repeatable || !taken.has(facility.url))
      .map((facility) => ({
        label: fillTemplate(ACTIVITY_LABELS.specialOption, {
          name: facility.name.rus,
          level: facility.level ?? '—',
        }),
        value: facility.url,
      }));
  });

  watch(isOpen, (opened) => {
    if (opened) {
      facilityUrl.value = undefined;
    }
  });

  /** Добавляет сооружение. */
  async function submit(): Promise<void> {
    const url = facilityUrl.value;

    if (!url) {
      return;
    }

    const updated = await run(
      () => addSpecialFacility(bastion.id, member.id, url, []),
      ACTIVITY_LABELS.addSpecialDone,
    );

    if (updated) {
      emit('updated', updated);
      isOpen.value = false;
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="ACTIVITY_LABELS.addSpecialTitle"
    :description="ACTIVITY_LABELS.addSpecialHint"
  >
    <template #body>
      <USelect
        :id="`bastion-add-special-${member.id}`"
        v-model="facilityUrl"
        :items="facilityItems"
        value-key="value"
        class="w-full"
      />
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="ACTIVITY_LABELS.cancelAction"
        :submit-label="ACTIVITY_LABELS.addSpecial"
        submit-icon="tabler:plus"
        :loading="isRunning"
        :disabled="!facilityUrl"
        @cancel="isOpen = false"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
