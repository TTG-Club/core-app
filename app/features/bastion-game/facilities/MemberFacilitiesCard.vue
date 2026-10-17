<script setup lang="ts">
  import type {
    BastionActivity,
    BastionActivityOrder,
    PlayerBastion,
    PlayerBastionFacility,
    PlayerBastionMember,
  } from '../model';

  import { fillTemplate } from '~bastions/model';
  import { ParticipantName } from '~find-game/ui';
  import { ConfirmDialog } from '~initiative/ui-kit';

  import {
    AddSpecialModal,
    BuildBasicModal,
    MenagerieModal,
    OrderModal,
  } from '../activity';
  import { useBastionAction } from '../composables';
  import {
    ACTIVITY_LABELS,
    BASTION_GAME_LABELS,
    confirmFacilityPrerequisite,
    enlargeFacility,
    FACILITY_SETUP_LABELS,
    getBastionErrorMessage,
    removeBastionFacility,
  } from '../model';
  import { FacilityCard, FacilitySetupSlideover } from './ui';

  /**
   * Персонаж в бастионе и его сооружения: специализированные и базовые, с
   * подтверждением требований для мастера и кнопкой выбора для игрока. У
   * сооружения видно, простаивает оно или выполняет приказ. Строить, добавлять
   * и разрушать сооружения можно только в режиме редактирования.
   */
  const {
    bastion,
    member,
    activity = undefined,
    editing = false,
  } = defineProps<{
    bastion: PlayerBastion;
    member: PlayerBastionMember;
    /** Журнал бастиона: из него — приказы, которые сооружения выполняют. */
    activity?: BastionActivity;
    /** Включён режим редактирования бастиона. */
    editing?: boolean;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const toast = useToast();
  const { isRunning, run } = useBastionAction();

  const isSetupOpen = ref(false);
  const isBuildOpen = ref(false);
  const isAddSpecialOpen = ref(false);
  const isOrderOpen = ref(false);
  const isRemoveOpen = ref(false);
  const isMenagerieOpen = ref(false);

  /** Сооружение, которому отдают приказ или которое убирают. */
  const selected = ref<PlayerBastionFacility>();

  /** Зверинец, чьи вольеры открыты: берётся из свежего персонажа после правок. */
  const menagerieId = ref<string>();

  const menagerieFacility = computed(() =>
    member.facilities.find((facility) => facility.id === menagerieId.value),
  );

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

  /** Строить новые базовые можно в режиме редактирования. */
  const canBuild = computed(() => editing && member.canGiveOrders);

  /** Лимит специализированных по уровню ещё не выбран. */
  const canAddSpecial = computed(
    () =>
      editing
      && member.canGiveOrders
      && specialFacilities.value.length < member.specialFacilityLimit,
  );

  const isSetup = computed(() => bastion.status === 'SETUP');

  /**
   * Разрушить сооружение можно в режиме редактирования: в закладке — игроку
   * персонажа или тому, кто ведёт бастион, в запущенном — только тому, кто ведёт.
   */
  const canRemove = computed(
    () =>
      editing
      && (isSetup.value
        ? member.canEditFacilities
        : member.canGiveOrders && bastion.canManage),
  );

  /** Пока бастион в закладке, кнопка приказа видна, но объясняет, почему ждёт. */
  const orderLock = computed(() =>
    isSetup.value && member.canEditFacilities
      ? ACTIVITY_LABELS.orderAfterStart
      : undefined,
  );

  /** Приказы, которые сооружения выполняют сейчас, по сооружению. */
  const activeOrders = computed(
    () =>
      new Map(
        (activity?.orders ?? [])
          .filter((order) => order.status === 'ACTIVE' && order.facilityId)
          .map((order) => [order.facilityId, order]),
      ),
  );

  /**
   * Приказ, который сооружение выполняет сейчас.
   *
   * @param facilityId Сооружение.
   * @returns Приказ или undefined, если простаивает.
   */
  function getActiveOrder(
    facilityId: string,
  ): BastionActivityOrder | undefined {
    return activeOrders.value.get(facilityId);
  }

  /**
   * Открывает приказ сооружению.
   *
   * @param facility Сооружение.
   */
  function openOrder(facility: PlayerBastionFacility): void {
    selected.value = facility;
    isOrderOpen.value = true;
  }

  /**
   * Открывает вольеры зверинца.
   *
   * @param facility Зверинец.
   */
  function openMenagerie(facility: PlayerBastionFacility): void {
    menagerieId.value = facility.id;
    isMenagerieOpen.value = true;
  }

  /**
   * Спрашивает, убрать ли сооружение.
   *
   * @param facility Сооружение.
   */
  function askRemove(facility: PlayerBastionFacility): void {
    selected.value = facility;
    isRemoveOpen.value = true;
  }

  /**
   * Начинает расширение сооружения до следующего пространства.
   *
   * @param facilityId Сооружение.
   */
  async function enlarge(facilityId: string): Promise<void> {
    const updated = await run(
      () => enlargeFacility(bastion.id, facilityId),
      ACTIVITY_LABELS.enlargeDone,
    );

    if (updated) {
      emit('updated', updated);
    }
  }

  /** Убирает выбранное сооружение. */
  async function remove(): Promise<void> {
    const facilityId = selected.value?.id;

    if (!facilityId) {
      return;
    }

    const updated = await run(
      () => removeBastionFacility(bastion.id, facilityId),
      ACTIVITY_LABELS.removeDone,
    );

    isRemoveOpen.value = false;

    if (updated) {
      emit('updated', updated);
    }
  }

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

        <div class="flex flex-wrap gap-2">
          <UButton
            v-if="member.canEditFacilities"
            icon="tabler:building-castle"
            variant="subtle"
            @click.left.exact.prevent="isSetupOpen = true"
          >
            {{ FACILITY_SETUP_LABELS.choose }}
          </UButton>

          <UButton
            v-if="canBuild"
            icon="tabler:hammer"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="isBuildOpen = true"
          >
            {{ ACTIVITY_LABELS.build }}
          </UButton>

          <UButton
            v-if="canAddSpecial"
            icon="tabler:plus"
            variant="subtle"
            @click.left.exact.prevent="isAddSpecialOpen = true"
          >
            {{ ACTIVITY_LABELS.addSpecial }}
          </UButton>
        </div>
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
        <section
          v-if="specialFacilities.length"
          class="flex flex-col gap-2"
        >
          <h3 class="text-sm font-medium text-muted">
            {{ FACILITY_SETUP_LABELS.specialTitle }}
          </h3>

          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <FacilityCard
              v-for="facility in specialFacilities"
              :key="facility.id"
              :facility
              :can-confirm="bastion.canManage"
              :show-prerequisite="editing"
              :can-act="member.canGiveOrders"
              :can-remove
              :active-order="getActiveOrder(facility.id)"
              :order-lock="orderLock"
              :bastion-turn="bastion.turn"
              @toggle-confirmation="toggleConfirmation(facility.id, $event)"
              @order="openOrder(facility)"
              @menagerie="openMenagerie(facility)"
              @enlarge="enlarge(facility.id)"
              @remove="askRemove(facility)"
            />
          </div>
        </section>

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

          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <FacilityCard
              v-for="facility in basicFacilities"
              :key="facility.id"
              :facility
              :can-act="member.canGiveOrders"
              :can-remove
              :active-order="getActiveOrder(facility.id)"
              :order-lock="orderLock"
              :bastion-turn="bastion.turn"
              @order="openOrder(facility)"
              @menagerie="openMenagerie(facility)"
              @enlarge="enlarge(facility.id)"
              @remove="askRemove(facility)"
            />
          </div>
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

    <template v-if="member.canGiveOrders">
      <BuildBasicModal
        v-model:open="isBuildOpen"
        :bastion
        :member
        @updated="emit('updated', $event)"
      />

      <AddSpecialModal
        v-model:open="isAddSpecialOpen"
        :bastion
        :member
        @updated="emit('updated', $event)"
      />

      <OrderModal
        v-if="selected"
        v-model:open="isOrderOpen"
        :bastion
        :facility="selected"
        :character-level="member.characterLevel"
        @updated="emit('updated', $event)"
      />
    </template>

    <MenagerieModal
      v-if="menagerieFacility"
      v-model:open="isMenagerieOpen"
      :bastion
      :facility="menagerieFacility"
      :can-manage="member.canGiveOrders"
      @updated="emit('updated', $event)"
    />

    <ConfirmDialog
      v-if="canRemove"
      v-model:open="isRemoveOpen"
      :title="ACTIVITY_LABELS.removeTitle"
      :description="ACTIVITY_LABELS.removeDescription"
      :confirm-label="ACTIVITY_LABELS.remove"
      confirm-color="error"
      confirm-icon="tabler:trash"
      :loading="isRunning"
      @confirm="remove"
    />
  </UCard>
</template>
