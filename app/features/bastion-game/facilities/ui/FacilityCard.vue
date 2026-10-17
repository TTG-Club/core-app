<script setup lang="ts">
  import type {
    BastionActivityOrder,
    PlayerBastionFacility,
  } from '../../model';

  import { BastionFacilityDrawer } from '~bastions/drawer';
  import { fillTemplate } from '~bastions/model';

  import {
    ACTIVITY_LABELS,
    FACILITY_SETUP_LABELS,
    formatMenagerieSpace,
    getArtisanToolIcon,
    getOrderSubject,
  } from '../../model';

  /**
   * Карточка сооружения персонажа: название открывает описание из справочника, пространство,
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
    bastionTurn = undefined,
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
    /** Текущий ход бастиона: в этот ход неработающее сооружение приказов не принимает. */
    bastionTurn?: number;
  }>();

  const emit = defineEmits<{
    'toggle-confirmation': [confirmed: boolean];
    'order': [];
    'enlarge': [];
    'menagerie': [];
    'remove': [];
  }>();

  const overlay = useOverlay();

  // Описание открывается дровером поверх страницы бастиона; ссылка остаётся,
  // чтобы справочник можно было открыть и в новой вкладке.
  const drawer = overlay.create(BastionFacilityDrawer, {
    props: {
      url: facility.facilityUrl,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const hasOrders = computed(() => facility.orders.length > 0);

  /** Кнопка приказа видна тому, кто отдаёт приказы, или с объяснением, когда станет можно. */
  const isOrderVisible = computed(
    () => hasOrders.value && (canAct || !!orderLock),
  );

  /** Сооружение не работает после события бастиона: почему и в какой ход. */
  const unavailableText = computed(() =>
    facility.unavailableOnTurn == null
      ? ''
      : fillTemplate(ACTIVITY_LABELS.unavailable, {
          turn: facility.unavailableOnTurn,
          reason: facility.unavailableReason?.toLowerCase() ?? '',
        }),
  );

  /** Сооружение не работает в текущий ход: вместо кнопки приказа — отметка. */
  const isUnavailableNow = computed(
    () => !!unavailableText.value && facility.unavailableOnTurn === bastionTurn,
  );

  /** Есть хотя бы одно действие для подвала карточки. */
  const hasActions = computed(
    () =>
      isOrderVisible.value
      || (canAct && facility.enlargeable)
      || canRemove
      || !!facility.menagerie
      || isUnavailableNow.value,
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

    if (isUnavailableNow.value) {
      return unavailableText.value;
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

  /** Наёмники видны и тогда, когда событие забрало всех: число станет 0. */
  const hasHirelings = computed(
    () => !!facility.hirelings || !!facility.hirelingsMissing,
  );

  /** Число наёмников подсвечено предупреждением, пока событие забрало часть из них. */
  const hirelingsClass = computed(() =>
    facility.hirelingsMissing ? 'text-warning' : 'text-toned',
  );

  const hirelingsHint = computed(() =>
    fillTemplate(
      facility.hirelingsMissing
        ? FACILITY_SETUP_LABELS.hirelingsMissing
        : FACILITY_SETUP_LABELS.hirelings,
      {
        count: facility.hirelings ?? 0,
        missing: facility.hirelingsMissing ?? 0,
      },
    ),
  );

  /** Барак: сколько защитников из скольких мест, вида «4/12»; пусто — не барак. */
  const defendersCount = computed(() =>
    facility.defenderCapacity
      ? `${facility.defenders ?? 0}/${facility.defenderCapacity}`
      : '',
  );

  /**
   * Зверинец: сколько больших мест занято из скольких, вида «1½/4»;
   * пусто — не зверинец.
   */
  const menagerieCount = computed(() => {
    const menagerie = facility.menagerie;

    return menagerie
      ? `${formatMenagerieSpace(menagerie.occupied)}/${formatMenagerieSpace(menagerie.capacity)}`
      : '';
  });

  /** Подсказка к значкам: кто в вольерах и сколько места свободно. */
  const menagerieHint = computed(() => {
    const menagerie = facility.menagerie;

    if (!menagerie) {
      return '';
    }

    const values = {
      names: menagerie.creatures
        .map((creature) =>
          creature.defender
            ? creature.name
            : fillTemplate(FACILITY_SETUP_LABELS.creatureNotDefender, {
                name: creature.name,
              }),
        )
        .join(', '),
      free: formatMenagerieSpace(
        Math.max(0, menagerie.capacity - menagerie.occupied),
      ),
      capacity: formatMenagerieSpace(menagerie.capacity),
    };

    return menagerie.creatures.length
      ? fillTemplate(FACILITY_SETUP_LABELS.creatures, values)
      : fillTemplate(FACILITY_SETUP_LABELS.creaturesEmpty, values);
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
  <article
    class="flex flex-col gap-2 rounded-lg border border-default bg-elevated/40 p-3"
  >
    <header class="flex flex-col gap-0.5">
      <ULink
        :to="`/bastions/${facility.facilityUrl}`"
        class="font-medium text-highlighted"
        @click.left.exact.prevent="drawer.open()"
      >
        {{ facility.name }}
      </ULink>

      <span class="text-xs text-muted">{{ spaceText }}</span>
    </header>

    <!-- Значки сами по себе ничего не говорят вслух, поэтому число
      людей и мест идёт и подсказкой, и `aria-label` -->
    <div
      v-if="
        toolIcons.length || hasHirelings || defendersCount || menagerieCount
      "
      class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
    >
      <UTooltip
        v-if="hasHirelings"
        :text="hirelingsHint"
      >
        <div
          class="flex items-center gap-1"
          role="img"
          :aria-label="hirelingsHint"
        >
          <UIcon
            name="tabler:user-filled"
            class="size-4 text-primary"
          />

          <span
            class="tabular-nums"
            :class="hirelingsClass"
          >
            {{ facility.hirelings ?? 0 }}
          </span>
        </div>
      </UTooltip>

      <UTooltip
        v-if="defendersCount"
        :text="defendersHint"
      >
        <div
          class="flex items-center gap-1"
          role="img"
          :aria-label="defendersHint"
        >
          <UIcon
            name="tabler:shield-filled"
            class="size-4 text-info"
          />

          <span class="text-toned tabular-nums">{{ defendersCount }}</span>
        </div>
      </UTooltip>

      <UTooltip
        v-if="menagerieCount"
        :text="menagerieHint"
      >
        <div
          class="flex items-center gap-1"
          role="img"
          :aria-label="menagerieHint"
        >
          <UIcon
            name="tabler:paw-filled"
            class="size-4 text-info"
          />

          <span class="text-toned tabular-nums">{{ menagerieCount }}</span>
        </div>
      </UTooltip>

      <div
        v-if="toolIcons.length"
        class="flex flex-wrap items-center gap-1"
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
      v-if="hasOrders"
      class="flex flex-wrap items-center gap-2"
    >
      <span
        v-if="hasOrders"
        class="text-xs"
        :class="occupationClass"
      >
        {{ occupationText }}
      </span>
    </div>

    <footer
      v-if="hasActions"
      class="mt-auto flex flex-wrap items-center gap-1 border-t border-default pt-2"
    >
      <UTooltip
        v-if="isUnavailableNow"
        :text="unavailableText"
      >
        <UBadge
          icon="tabler:tools-off"
          color="warning"
          variant="subtle"
          size="sm"
        >
          {{ ACTIVITY_LABELS.unavailableBadge }}
        </UBadge>
      </UTooltip>

      <UTooltip
        v-else-if="isOrderVisible"
        :text="orderBlocker"
        :disabled="!orderBlocker"
      >
        <UButton
          size="xs"
          variant="subtle"
          :disabled="!!orderBlocker"
          @click.left.exact.prevent="emit('order')"
        >
          {{ ACTIVITY_LABELS.giveOrder }}
        </UButton>
      </UTooltip>

      <UButton
        v-if="facility.menagerie"
        icon="tabler:paw"
        size="xs"
        color="neutral"
        variant="subtle"
        @click.left.exact.prevent="emit('menagerie')"
      >
        {{ ACTIVITY_LABELS.menagerie }}
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
        icon="tabler:bulldozer"
        size="xs"
        color="error"
        variant="ghost"
        class="ml-auto"
        @click.left.exact.prevent="emit('remove')"
      >
        {{ ACTIVITY_LABELS.remove }}
      </UButton>
    </footer>
  </article>
</template>
