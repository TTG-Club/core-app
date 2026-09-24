<script setup lang="ts">
  import type { PlayerBastion, PlayerBastionMember } from '../model';

  import { fillTemplate } from '~bastions/model';
  import { ParticipantName } from '~find-game/ui';

  import {
    BASTION_GAME_LABELS,
    confirmFacilityPrerequisite,
    FACILITY_SETUP_LABELS,
    getBastionErrorMessage,
  } from '../model';
  import { FacilityRow, FacilitySetupSlideover } from './ui';

  /**
   * Персонаж в бастионе и его сооружения: базовые и специализированные, с
   * подтверждением требований для мастера и кнопкой выбора для игрока.
   */
  const { bastion, member } = defineProps<{
    bastion: PlayerBastion;
    member: PlayerBastionMember;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const toast = useToast();
  const isSetupOpen = ref(false);

  const basicFacilities = computed(() =>
    member.facilities.filter(
      (facility) => facility.category?.value === 'BASIC',
    ),
  );

  const specialFacilities = computed(() =>
    member.facilities.filter(
      (facility) => facility.category?.value !== 'BASIC',
    ),
  );

  const specialCounter = computed(() =>
    fillTemplate(FACILITY_SETUP_LABELS.specialCounter, {
      count: specialFacilities.value.length,
      limit: member.specialFacilityLimit,
    }),
  );

  /**
   * Мастер подтверждает требование сооружения или снимает подтверждение.
   *
   * @param facilityId Сооружение персонажа.
   * @param confirmed Новое состояние.
   */
  async function toggleConfirmation(
    facilityId: string,
    confirmed: boolean,
  ): Promise<void> {
    try {
      emit(
        'updated',
        await confirmFacilityPrerequisite(bastion.id, facilityId, confirmed),
      );
    } catch (error) {
      toast.add({
        title: FACILITY_SETUP_LABELS.saveError,
        description: getBastionErrorMessage(
          error,
          FACILITY_SETUP_LABELS.saveError,
        ),
        color: 'error',
      });
    }
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex min-w-0 flex-col">
          <span class="font-semibold text-highlighted">
            {{ member.characterName }}
          </span>

          <span class="text-sm text-muted">
            <ParticipantName :user-id="member.userId" /> ·
            {{ member.characterLevel }} {{ BASTION_GAME_LABELS.level }} ·
            {{ specialCounter }}
          </span>
        </div>

        <UButton
          v-if="member.canEditFacilities"
          icon="tabler:building-castle"
          variant="subtle"
          @click.left.exact.prevent="isSetupOpen = true"
        >
          {{ FACILITY_SETUP_LABELS.choose }}
        </UButton>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <p
        v-if="!member.facilities.length"
        class="text-sm text-muted"
      >
        {{ FACILITY_SETUP_LABELS.empty }}
      </p>

      <template v-else>
        <p
          v-if="!member.basicComplete"
          class="text-sm text-warning"
        >
          {{ FACILITY_SETUP_LABELS.basicMissing }}
        </p>

        <section
          v-if="basicFacilities.length"
          class="flex flex-col gap-2"
        >
          <h3 class="text-sm font-medium text-muted">
            {{ FACILITY_SETUP_LABELS.basicTitle }}
          </h3>

          <FacilityRow
            v-for="facility in basicFacilities"
            :key="facility.id"
            :facility
          />
        </section>

        <section
          v-if="specialFacilities.length"
          class="flex flex-col gap-2"
        >
          <h3 class="text-sm font-medium text-muted">
            {{ FACILITY_SETUP_LABELS.specialTitle }}
          </h3>

          <FacilityRow
            v-for="facility in specialFacilities"
            :key="facility.id"
            :facility
            :can-confirm="bastion.canManage"
            @toggle-confirmation="toggleConfirmation(facility.id, $event)"
          />
        </section>
      </template>
    </div>

    <FacilitySetupSlideover
      v-if="member.canEditFacilities"
      v-model:open="isSetupOpen"
      :bastion
      :member
      @saved="emit('updated', $event)"
    />
  </UCard>
</template>
