<script setup lang="ts">
  import type { PlayerBastionFacility } from '../../model';

  import { FACILITY_SETUP_LABELS } from '../../model';

  /**
   * Сооружение персонажа: название со ссылкой на справочник, пространство,
   * приказы, наёмники, сделанные выборы и состояние требования.
   */
  const { facility, canConfirm = false } = defineProps<{
    facility: PlayerBastionFacility;
    /** Мастер может подтвердить требование. */
    canConfirm?: boolean;
  }>();

  const emit = defineEmits<{
    'toggle-confirmation': [confirmed: boolean];
  }>();

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
  </div>
</template>
