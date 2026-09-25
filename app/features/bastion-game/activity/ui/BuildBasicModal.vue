<script setup lang="ts">
  import type {
    FacilitySpaceCode,
    PlayerBastion,
    PlayerBastionMember,
  } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import { useBastionAction, useFacilityCatalog } from '../../composables';
  import {
    ACTIVITY_LABELS,
    buildBasicFacility,
    FACILITY_SPACES,
    getBasicFacilities,
    getBuildTermsText,
    SPACE_LABELS,
  } from '../../model';

  /**
   * Постройка базового сооружения: цена списывается из казны, готово через
   * несколько ходов (тесное — 500 зм и 20 дней, то есть 3 хода).
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
  const space = ref<FacilitySpaceCode>('CRAMPED');

  const facilityItems = computed(() =>
    getBasicFacilities(catalog.value).map((facility) => ({
      label: facility.name.rus,
      value: facility.url,
    })),
  );

  const spaceItems = FACILITY_SPACES.map((value) => ({
    label: `${SPACE_LABELS[value]} — ${getBuildTermsText(value)}`,
    value,
  }));

  watch(isOpen, (opened) => {
    if (opened) {
      facilityUrl.value = undefined;
      space.value = 'CRAMPED';
    }
  });

  /** Начинает стройку. */
  async function submit(): Promise<void> {
    const url = facilityUrl.value;

    if (!url) {
      return;
    }

    const updated = await run(
      () => buildBasicFacility(bastion.id, member.id, url, space.value),
      ACTIVITY_LABELS.buildDone,
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
    :title="ACTIVITY_LABELS.buildTitle"
    :description="ACTIVITY_LABELS.buildHint"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField :label="ACTIVITY_LABELS.buildFacility">
          <USelect
            :id="`bastion-build-facility-${member.id}`"
            v-model="facilityUrl"
            :items="facilityItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="ACTIVITY_LABELS.buildSpace">
          <USelect
            :id="`bastion-build-space-${member.id}`"
            v-model="space"
            :items="spaceItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="ACTIVITY_LABELS.cancelAction"
        :submit-label="ACTIVITY_LABELS.build"
        submit-icon="tabler:hammer"
        :loading="isRunning"
        :disabled="!facilityUrl"
        @cancel="isOpen = false"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
