<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    TrackerParticipant,
    UpdateParticipantRequest,
  } from '~initiative/model';

  import { clamp } from 'es-toolkit';

  import {
    useCreatureDrawer,
    useCreatureSummaries,
  } from '~initiative/composables';
  import {
    extractArmorClassValue,
    formatInitiativeBonus,
    getCreatureRoute,
    MAX_INITIATIVE_BONUS,
    MIN_INITIATIVE_BONUS,
    PARTICIPANT_TYPE_LABEL,
  } from '~initiative/model';

  import ParticipantAvatar from './ParticipantAvatar.vue';
  import ParticipantHitPointsControl from './ParticipantHitPointsControl.vue';
  import ParticipantRenameControl from './ParticipantRenameControl.vue';
  import ParticipantRollControl from './ParticipantRollControl.vue';
  import ParticipantStatTile from './ParticipantStatTile.vue';

  const {
    participant,
    isActive = false,
    isCurrent = false,
    order = 0,
    disabled = false,
    currentHitPoints = undefined,
  } = defineProps<{
    participant: TrackerParticipant;
    /** Идёт бой: бонус — только чтение. Макет строки от режима не меняется. */
    isActive?: boolean;
    isCurrent?: boolean;
    order?: number;
    disabled?: boolean;
    /** Текущие хиты из localStorage (нет записи — существо на полных). */
    currentHitPoints?: number;
  }>();

  const emit = defineEmits<{
    'edit': [id: string, patch: UpdateParticipantRequest];
    'remove': [id: string];
    'roll': [id: string];
    'toggle-dead': [id: string, dead: boolean];
    'set-hit-points': [id: string, value: number];
  }>();

  const { openCreature } = useCreatureDrawer();

  const { imageFor, summaryFor, dropImage } = useCreatureSummaries(() => [
    participant,
  ]);

  const bonus = ref(participant.initiativeBonus);

  const isDead = computed(() => participant.dead);

  const stateClass = computed(() => {
    if (isActive) {
      if (isDead.value) {
        return 'border-default bg-muted';
      }

      if (isCurrent) {
        return 'border-primary bg-primary/10 ring-1 ring-primary';
      }
    }

    return 'border-default bg-default';
  });

  // Строка существа кликабельна (открывает статблок в дровере) — даём курсор и
  // hover-рамку. У текущего бойца рамка primary, её hover-ом не перебиваем.
  const interactiveClass = computed(() => {
    if (!participant.creatureUrl) {
      return '';
    }

    return isCurrent
      ? 'cursor-pointer'
      : 'cursor-pointer hover:border-accented';
  });

  const nameClass = computed(() =>
    isDead.value ? 'text-muted line-through' : 'text-highlighted',
  );

  const dimmedClass = computed(() => (isDead.value ? 'opacity-50' : ''));

  const summary = computed(() => summaryFor(participant));

  const typeLabel = computed(
    // Схема допускает пустой `typeName` (catch('')) — тогда своя подпись.
    () => participant.typeName || PARTICIPANT_TYPE_LABEL[participant.type],
  );

  // Вторая строка идентификации: тип участника, существам — ещё и опасность.
  const subtitle = computed(() => {
    const challengeRating = summary.value?.challengeRating;

    return challengeRating
      ? `${typeLabel.value} · ПО ${challengeRating}`
      : typeLabel.value;
  });

  const armorClassText = computed(() => summary.value?.armorClass ?? '');

  const armorClassValue = computed(() =>
    extractArmorClassValue(armorClassText.value),
  );

  const armorClassDisplay = computed(() => armorClassValue.value || '—');

  const maxHitPoints = computed(() => summary.value?.maxHitPoints ?? 0);

  // Полная строка статблока («15 (кожаный доспех)») — в тултипе и только
  // когда она содержит что-то сверх числа из плитки.
  const hasArmorClassDetails = computed(
    () => armorClassText.value.trim() !== armorClassDisplay.value,
  );

  const armorClassTooltip = computed(() => `КД: ${armorClassText.value}`);

  // В подготовке показываем локальный черновик (реагирует на шаги ±), в бою —
  // серверное значение.
  const formattedBonus = computed(() =>
    formatInitiativeBonus(isActive ? participant.initiativeBonus : bonus.value),
  );

  const canDecreaseBonus = computed(
    () => !disabled && bonus.value > MIN_INITIATIVE_BONUS,
  );

  const canIncreaseBonus = computed(
    () => !disabled && bonus.value < MAX_INITIATIVE_BONUS,
  );

  const menuItems = computed<Array<DropdownMenuItem>>(() => {
    const items: Array<DropdownMenuItem> = [];

    const { creatureUrl } = participant;

    // Дровер открывается кликом по самой строке, поэтому в меню — только
    // альтернатива для новой вкладки.
    if (creatureUrl) {
      items.push({
        label: 'Статблок в новой вкладке',
        icon: 'tabler:external-link',
        to: getCreatureRoute(creatureUrl),
        target: '_blank',
      });
    }

    // Повержение — только в бою, спрятано в меню, чтобы трейлинг строки был
    // одинаков в правке и просмотре.
    if (isActive) {
      items.push(
        isDead.value
          ? {
              label: 'Вернуть в бой',
              icon: 'tabler:heart',
              color: 'success',
              onSelect: () => emit('toggle-dead', participant.id, false),
            }
          : {
              label: 'Пометить повержённым',
              icon: 'tabler:skull',
              color: 'error',
              onSelect: () => emit('toggle-dead', participant.id, true),
            },
      );
    }

    items.push({
      label: isActive ? 'Удалить из боя' : 'Убрать из энкаунтера',
      icon: 'tabler:trash',
      color: 'error',
      onSelect: () => emit('remove', participant.id),
    });

    return items;
  });

  // Ресинхронизация локального бонуса после ответа сервера (участник приходит
  // новым объектом). Присвоение здесь не даёт лишнего PUT: watch(bonus) ниже
  // выходит по guard-у `value === participant.initiativeBonus`.
  watch(
    () => participant.initiativeBonus,
    (value) => {
      bonus.value = value;
    },
  );

  // Цикл watch(bonus) → PUT → новый participant → watch(participant) → bonus
  // разрывается проверкой равенства: после ресинка значение уже совпадает.
  watch(bonus, (value) => {
    if (value === participant.initiativeBonus) {
      return;
    }

    emit('edit', participant.id, { initiativeBonus: value });
  });

  // Откат локального бонуса к серверному по завершении мутации: неуспешный PUT
  // не меняет participant, поэтому watch выше не сработает и в поле осталось бы
  // отклонённое значение.
  watch(
    () => disabled,
    (isNowDisabled, wasDisabled) => {
      if (wasDisabled && !isNowDisabled) {
        bonus.value = participant.initiativeBonus;
      }
    },
  );

  /**
   * Клик по «пустому» месту строки существа открывает его статблок в дровере.
   * Клики, дошедшие от интерактивных элементов (кнопки, поля, ссылки), — не
   * навигация: у них своя логика, поэтому пропускаем их.
   * @param event Событие клика по строке.
   */
  function onRowClick(event: MouseEvent): void {
    const { creatureUrl } = participant;

    if (!creatureUrl) {
      return;
    }

    if (
      event.target instanceof Element
      && event.target.closest('button, input, a')
    ) {
      return;
    }

    openCreature(creatureUrl);
  }

  /**
   * Сдвигает бонус инициативы на шаг в пределах допустимого диапазона.
   * @param delta Направление шага: `1` или `-1`.
   */
  function adjustBonus(delta: number): void {
    bonus.value = clamp(
      bonus.value + delta,
      MIN_INITIATIVE_BONUS,
      MAX_INITIATIVE_BONUS,
    );
  }

  function onRename(id: string, name: string): void {
    emit('edit', id, { name });
  }

  function onChangeHitPoints(value: number): void {
    emit('set-hit-points', participant.id, value);
  }

  function onRoll(id: string): void {
    emit('roll', id);
  }

  function onSetRoll(id: string, roll: number): void {
    emit('edit', id, { initiativeRoll: roll });
  }
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-3 transition-colors"
    :class="[
      stateClass,
      interactiveClass,
      !isActive && disabled && 'pointer-events-none opacity-60',
    ]"
    @click.left.exact="onRowClick"
  >
    <!-- Идентификация: номер + аватар + имя с подписью типа/опасности. На
         мобильном занимает всю ширину (basis-full) → плитки переносятся на
         вторую строку; на sm+ — единый ряд. Высоту строки держат аватар и
         плитки (size-11 / h-11) — она одинакова в подготовке и в бою. -->
    <div
      class="flex min-w-0 basis-full items-center gap-3 sm:flex-1 sm:basis-auto"
    >
      <span
        class="w-5 shrink-0 text-center text-sm font-semibold text-muted tabular-nums"
      >
        {{ order }}
      </span>

      <ParticipantAvatar
        :participant="participant"
        :image="imageFor(participant)"
        :class="isDead && 'opacity-40 grayscale'"
        @image-error="dropImage(participant.creatureUrl)"
      />

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1">
          <span
            class="min-w-0 truncate font-semibold"
            :class="nameClass"
          >
            {{ participant.name }}
          </span>

          <ParticipantRenameControl
            class="shrink-0"
            :participant="participant"
            :disabled
            @rename="onRename"
          />
        </div>

        <div class="truncate text-xs text-muted">
          {{ subtitle }}
        </div>
      </div>
    </div>

    <!-- Статы: одинаковые плитки КД/Бонус/Иниц. фиксированной ширины + меню.
         Колонки совпадают между строками, режимами и типами участников
         (у игроков в КД — прочерк). На мобильном — вторая строка справа. -->
    <div
      class="flex basis-full flex-wrap items-center justify-end gap-2 sm:flex-none sm:basis-auto sm:flex-nowrap"
    >
      <!-- Группа выживаемости (Хиты, КД) -->
      <div class="flex min-w-[120px] flex-1 items-center gap-2 sm:flex-none">
        <div class="w-16 flex-1 sm:flex-none">
          <ParticipantHitPointsControl
            :current="currentHitPoints"
            :max="maxHitPoints"
            :disabled="disabled"
            @change="onChangeHitPoints"
          />
        </div>

        <UTooltip
          :text="armorClassTooltip"
          :disabled="!hasArmorClassDetails"
          class="w-12 flex-1 sm:flex-none"
        >
          <ParticipantStatTile
            label="КД"
            class="w-full transition-colors"
            :class="dimmedClass"
          >
            {{ armorClassDisplay }}
          </ParticipantStatTile>
        </UTooltip>
      </div>

      <!-- Группа инициативы и действий (Бонус, Иниц, Меню) -->
      <div class="flex min-w-[212px] flex-1 items-center gap-2 sm:flex-none">
        <ParticipantStatTile
          label="Бонус"
          class="w-24 flex-1 sm:flex-none"
          :class="dimmedClass"
        >
          <template v-if="!isActive">
            <UButton
              icon="tabler:minus"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="!canDecreaseBonus"
              aria-label="Уменьшить бонус инициативы"
              @click.left.exact.prevent="adjustBonus(-1)"
            />

            <span class="min-w-7 text-center">{{ formattedBonus }}</span>

            <UButton
              icon="tabler:plus"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="!canIncreaseBonus"
              aria-label="Увеличить бонус инициативы"
              @click.left.exact.prevent="adjustBonus(1)"
            />
          </template>

          <span v-else>{{ formattedBonus }}</span>
        </ParticipantStatTile>

        <div
          class="w-16 flex-1 sm:flex-none"
          :class="isDead && 'opacity-40 grayscale'"
        >
          <ParticipantRollControl
            :participant="participant"
            :disabled="disabled"
            @roll="onRoll"
            @set-roll="onSetRoll"
          />
        </div>

        <UDropdownMenu
          :items="menuItems"
          :external-icon="false"
          class="shrink-0"
        >
          <UButton
            icon="tabler:dots-vertical"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled
            aria-label="Ещё действия"
          />
        </UDropdownMenu>
      </div>
    </div>
  </div>
</template>
