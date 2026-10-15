<script setup lang="ts">
  import type {
    BastionActivityOrder,
    PlayerBastionFacility,
  } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import {
    ACTIVITY_LABELS,
    FACILITY_SETUP_LABELS,
    getArtisanToolIcon,
    getOrderSubject,
  } from '../../model';

  /**
   * Сооружение персонажа: название со ссылкой на справочник, пространство,
   * наёмники, сделанные выборы и состояние требования. У сооружения
   * с приказами видно, простаивает ли оно, и есть кнопка приказа; если
   * приказ сейчас не отдать, подсказка объясняет почему.
   */
  const {
    facility,
    canConfirm = false,
    canAct = false,
    canRemove = false,
    activeOrder = undefined,
    orderLock = undefined,
  } = defineProps<{
    facility: PlayerBastionFacility;
    /** Мастер может подтвердить требование. */
    canConfirm?: boolean;
    /** Можно отдавать приказы и расширять: бастион запущен, это мастер или игрок персонажа. */
    canAct?: boolean;
    /** Можно убрать сооружение. */
    canRemove?: boolean;
    /** Приказ, который сооружение выполняет сейчас. */
    activeOrder?: BastionActivityOrder;
    /** Почему приказы пока не отдаются вовсе — например, бастион в закладке. */
    orderLock?: string;
  }>();

  const emit = defineEmits<{
    'toggle-confirmation': [confirmed: boolean];
    'order': [];
    'enlarge': [];
    'remove': [];
  }>();

  const hasOrders = computed(() => facility.orders.length > 0);

  /** Кнопка приказа видна тому, кто отдаёт приказы, или с объяснением, когда станет можно. */
  const isOrderVisible = computed(
    () => hasOrders.value && (canAct || !!orderLock),
  );

  /** Почему приказ сейчас не отдать; undefined — можно. */
  const orderBlocker = computed(() => {
    if (orderLock) {
      return orderLock;
    }

    if (facility.status !== 'READY') {
      return ACTIVITY_LABELS.orderBuilding;
    }

    if (!facility.prerequisiteConfirmed) {
      return ACTIVITY_LABELS.orderPrerequisite;
    }

    return activeOrder ? ACTIVITY_LABELS.orderBusy : undefined;
  });

  /** Чем сооружение занято: простаивает или выполняет приказ до хода. */
  const occupationText = computed(() => {
    if (!activeOrder) {
      return ACTIVITY_LABELS.idle;
    }

    const subject = getOrderSubject(activeOrder);

    const values = {
      order: activeOrder.order.name,
      option: subject,
      turn: activeOrder.completesOnTurn,
    };

    return subject
      ? fillTemplate(ACTIVITY_LABELS.busyOrderOption, values)
      : fillTemplate(ACTIVITY_LABELS.busyOrder, values);
  });

  const occupationClass = computed(() =>
    activeOrder ? 'text-info' : 'text-muted',
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

  const spaceText = computed(
    () =>
      `${facility.space.name} (${facility.space.squares} ${FACILITY_SETUP_LABELS.squares})`,
  );

  /** Наёмники сооружения: по закрашенному человечку на каждого. */
  const hirelingIcons = computed(() =>
    Array.from({ length: facility.hirelings ?? 0 }, (_, index) => index),
  );

  const hirelingsHint = computed(() =>
    fillTemplate(FACILITY_SETUP_LABELS.hirelings, {
      count: facility.hirelings ?? 0,
    }),
  );

  /**
   * Места в бараке: закрашенный щит — нанятый защитник, пунктирный —
   * свободное место. У других сооружений мест нет, и список пуст.
   */
  const defenderSlots = computed(() => {
    const capacity = facility.defenderCapacity ?? 0;
    const count = facility.defenders ?? 0;

    return Array.from({ length: capacity }, (_, index) =>
      index < count
        ? { index, icon: 'tabler:shield-filled', tone: 'text-info' }
        : { index, icon: 'ttg:shield-dashed', tone: 'text-muted' },
    );
  });

  const defendersHint = computed(() =>
    fillTemplate(FACILITY_SETUP_LABELS.defenders, {
      count: facility.defenders ?? 0,
      capacity: facility.defenderCapacity ?? 0,
    }),
  );

  /**
   * Выбор инструментов ремесленников: каждый выбранный вариант узнаётся как
   * инструмент.
   *
   * @param options Выбранные варианты.
   * @returns true, если все варианты — инструменты.
   */
  function isToolChoice(options: Array<string>): boolean {
    return (
      options.length > 0
      && options.every((option) => !!getArtisanToolIcon(option))
    );
  }

  /**
   * Выборы, где каждый вариант — инструмент ремесленника, показываются
   * значками в ряду с наёмниками: длинный список инструментов мастерской
   * занимал полстроки. Название — в подсказке.
   */
  const toolIcons = computed(() =>
    facility.choices
      .filter((choice) => isToolChoice(choice.options))
      .flatMap((choice) =>
        choice.options.map((option) => ({
          name: option,
          icon: getArtisanToolIcon(option) ?? '',
        })),
      ),
  );

  const choicesText = computed(() =>
    facility.choices
      .filter((choice) => !isToolChoice(choice.options))
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

      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span class="text-muted">{{ spaceText }}</span>

        <!-- Значки сами по себе ничего не говорят вслух, поэтому число
          людей идёт и подсказкой, и `aria-label` -->
        <div
          v-if="toolIcons.length"
          class="flex items-center gap-1"
        >
          <UTooltip
            v-for="tool in toolIcons"
            :key="tool.name"
            :text="tool.name"
          >
            <UIcon
              :name="tool.icon"
              class="size-4 text-toned"
              role="img"
              :aria-label="tool.name"
            />
          </UTooltip>
        </div>

        <UTooltip
          v-if="hirelingIcons.length"
          :text="hirelingsHint"
        >
          <div
            class="flex items-center gap-0.5"
            role="img"
            :aria-label="hirelingsHint"
          >
            <UIcon
              v-for="index in hirelingIcons"
              :key="index"
              name="tabler:user-filled"
              class="size-4 text-primary"
            />
          </div>
        </UTooltip>

        <UTooltip
          v-if="defenderSlots.length"
          :text="defendersHint"
        >
          <div
            class="flex flex-wrap items-center gap-0.5"
            role="img"
            :aria-label="defendersHint"
          >
            <UIcon
              v-for="seat in defenderSlots"
              :key="seat.index"
              :name="seat.icon"
              class="size-4"
              :class="seat.tone"
            />
          </div>
        </UTooltip>
      </div>
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
      v-if="isOrderVisible || (canAct && facility.enlargeable) || canRemove"
      class="flex flex-wrap items-center justify-end gap-1"
    >
      <span
        v-if="hasOrders"
        class="mr-auto text-xs"
        :class="occupationClass"
      >
        {{ occupationText }}
      </span>

      <UTooltip
        v-if="isOrderVisible"
        :text="orderBlocker"
        :disabled="!orderBlocker"
      >
        <UButton
          icon="tabler:send"
          size="xs"
          variant="subtle"
          :disabled="!!orderBlocker"
          @click.left.exact.prevent="emit('order')"
        >
          {{ ACTIVITY_LABELS.giveOrder }}
        </UButton>
      </UTooltip>

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
