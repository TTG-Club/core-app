<script setup lang="ts">
  import type { PlayerBastionFacility } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import { ACTIVITY_LABELS, FACILITY_SETUP_LABELS } from '../../model';

  /**
   * Сооружение персонажа: название со ссылкой на справочник, пространство,
   * приказы, наёмники, сделанные выборы и состояние требования.
   */
  const {
    facility,
    canConfirm = false,
    canAct = false,
    canRemove = false,
  } = defineProps<{
    facility: PlayerBastionFacility;
    /** Мастер может подтвердить требование. */
    canConfirm?: boolean;
    /** Можно отдавать приказы и расширять: бастион запущен, это мастер или игрок персонажа. */
    canAct?: boolean;
    /** Мастер может убрать сооружение. */
    canRemove?: boolean;
  }>();

  const emit = defineEmits<{
    'toggle-confirmation': [confirmed: boolean];
    'order': [];
    'enlarge': [];
    'remove': [];
  }>();

  /** Приказ можно отдать: сооружение готово, требование подтверждено, приказы есть. */
  const canOrder = computed(
    () =>
      canAct
      && facility.status === 'READY'
      && facility.prerequisiteConfirmed
      && facility.orders.length > 0,
  );

  /** Стройка или расширение: подпись с ходом, на котором закончится. */
  const constructionText = computed(() => {
    if (facility.status === 'BUILDING') {
      return fillTemplate(ACTIVITY_LABELS.building, {
        turn: facility.readyOnTurn ?? '—',
      });
    }

    return facility.pendingSpace
      ? fillTemplate(ACTIVITY_LABELS.enlarging, {
          space: facility.pendingSpace.name,
          turn: facility.pendingReadyOnTurn ?? '—',
        })
      : '';
  });

  /** Просит родителя переключить подтверждение требования. */
  function requestToggle(): void {
    emit('toggle-confirmation', !facility.prerequisiteConfirmed);
  }

  const details = computed(() =>
    [
      `${facility.space.name} (${facility.space.squares} ${FACILITY_SETUP_LABELS.squares})`,
      facility.orders.map((order) => order.name).join(', '),
      facility.hirelings
        ? `${facility.hirelings} ${FACILITY_SETUP_LABELS.hirelings}`
        : '',
    ]
      .filter(Boolean)
      .join(' · '),
  );

  const choicesText = computed(() =>
    facility.choices
      .map((choice) => `${choice.name}: ${choice.options.join(', ')}`)
      .join('; '),
  );

  const prerequisiteColor = computed(() =>
    facility.prerequisiteConfirmed ? 'success' : 'warning',
  );

  const prerequisiteStatus = computed(() =>
    facility.prerequisiteConfirmed
      ? FACILITY_SETUP_LABELS.prerequisiteConfirmed
      : FACILITY_SETUP_LABELS.prerequisitePending,
  );

  const confirmLabel = computed(() =>
    facility.prerequisiteConfirmed
      ? FACILITY_SETUP_LABELS.unconfirm
      : FACILITY_SETUP_LABELS.confirm,
  );
</script>

<template>
  <div class="flex flex-col gap-1 rounded-lg bg-elevated/40 px-3 py-2">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <ULink
        :to="`/bastions/${facility.facilityUrl}`"
        target="_blank"
        class="font-medium text-highlighted"
      >
        {{ facility.name }}
      </ULink>

      <span class="text-xs text-muted">{{ details }}</span>
    </div>

    <p
      v-if="constructionText"
      class="text-xs text-info"
    >
      {{ constructionText }}
    </p>

    <p
      v-if="choicesText"
      class="text-sm text-toned"
    >
      {{ choicesText }}
    </p>

    <div
      v-if="facility.prerequisite"
      class="flex flex-wrap items-center gap-2"
    >
      <UBadge
        :color="prerequisiteColor"
        variant="subtle"
        size="sm"
      >
        {{ prerequisiteStatus }}
      </UBadge>

      <span class="text-xs text-muted">{{ facility.prerequisite.name }}</span>

      <UButton
        v-if="canConfirm"
        size="xs"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="requestToggle"
      >
        {{ confirmLabel }}
      </UButton>
    </div>

    <div
      v-if="canOrder || (canAct && facility.enlargeable) || canRemove"
      class="flex flex-wrap justify-end gap-1"
    >
      <UButton
        v-if="canOrder"
        icon="tabler:send"
        size="xs"
        variant="subtle"
        @click.left.exact.prevent="emit('order')"
      >
        {{ ACTIVITY_LABELS.giveOrder }}
      </UButton>

      <UButton
        v-if="canAct && facility.enlargeable"
        icon="tabler:arrows-maximize"
        size="xs"
        color="neutral"
        variant="subtle"
        @click.left.exact.prevent="emit('enlarge')"
      >
        {{ ACTIVITY_LABELS.enlarge }}
      </UButton>

      <UButton
        v-if="canRemove"
        icon="tabler:trash"
        size="xs"
        color="error"
        variant="ghost"
        @click.left.exact.prevent="emit('remove')"
      >
        {{ ACTIVITY_LABELS.remove }}
      </UButton>
    </div>
  </div>
</template>
