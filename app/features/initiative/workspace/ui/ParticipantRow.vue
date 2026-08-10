<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    ConditionExpiry,
    ConditionKey,
    ParticipantColor,
    TrackerParticipant,
    UpdateParticipantRequest,
  } from '~initiative/model';

  import { clamp } from 'es-toolkit';

  import {
    useCreatureDrawer,
    useParticipantAvatars,
  } from '~initiative/composables';
  import {
    DEFAULT_PARTICIPANT_COLOR,
    extractArmorClassValue,
    formatInitiativeBonus,
    getCreatureRoute,
    getSheetPlayerRoute,
    MAX_INITIATIVE_BONUS,
    MIN_INITIATIVE_BONUS,
    OPEN_SHEET_MENU_LABEL,
    PARTICIPANT_COLOR_CLASS,
    PARTICIPANT_COLOR_LABEL,
    PARTICIPANT_COLOR_TITLE,
    PARTICIPANT_COLORS,
    PARTICIPANT_TYPE_LABEL,
    SHEET_PLAYER_ROW_LABEL,
  } from '~initiative/model';

  import ParticipantArmorClassControl from './ParticipantArmorClassControl.vue';
  import ParticipantAvatar from './ParticipantAvatar.vue';
  import ParticipantConditions from './ParticipantConditions.vue';
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
    round = 0,
  } = defineProps<{
    participant: TrackerParticipant;
    /** Идёт бой: бонус — только чтение. Макет строки от режима не меняется. */
    isActive?: boolean;
    isCurrent?: boolean;
    order?: number;
    disabled?: boolean;
    /** Текущий раунд боя — из него считается остаток длительности состояний. */
    round?: number;
  }>();

  const sheetLink = computed(() => participant.sheetLink);

  const color = computed(() => participant.color ?? DEFAULT_PARTICIPANT_COLOR);

  const emit = defineEmits<{
    'edit': [id: string, patch: UpdateParticipantRequest];
    'remove': [id: string];
    'roll': [id: string];
    'toggle-dead': [id: string, dead: boolean];
    'set-hit-points': [id: string, value: number];
    'set-max-hit-points': [id: string, value: number];
    'set-armor-class': [id: string, value: number];
    'set-color': [id: string, value: ParticipantColor];
    'add-condition': [
      id: string,
      key: ConditionKey,
      rounds: number,
      expiry: ConditionExpiry,
    ];
    'remove-condition': [id: string, key: ConditionKey];
  }>();

  const { openCreature } = useCreatureDrawer();

  const { avatarFor, summaryFor, dropAvatar } = useParticipantAvatars(() => [
    participant,
  ]);

  const bonus = ref(participant.initiativeBonus);

  const isDead = computed(() => participant.dead);

  const sheetRoute = computed(() =>
    sheetLink.value ? getSheetPlayerRoute(sheetLink.value) : '',
  );

  const avatarImage = computed(() => avatarFor(participant));

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

  // Вторая строка идентификации: тип участника, существам — ещё и опасность,
  // игроку из листа — пометка о нём (иначе привязка видна только в меню).
  const subtitle = computed(() => {
    const challengeRating = summary.value?.challengeRating;

    if (challengeRating) {
      return `${typeLabel.value} · ПО ${challengeRating}`;
    }

    return sheetLink.value
      ? `${typeLabel.value} · ${SHEET_PLAYER_ROW_LABEL}`
      : typeLabel.value;
  });

  const armorClassText = computed(() => summary.value?.armorClass ?? '');

  const armorClassValue = computed(() =>
    extractArmorClassValue(armorClassText.value),
  );

  const armorClassDisplay = computed(() => armorClassValue.value || '—');

  // Заданный мастером максимум приоритетнее среднего из статблока.
  const maxHitPoints = computed(
    () => participant.maxHitPoints ?? summary.value?.maxHitPoints ?? 0,
  );

  const hitFormula = computed(() => summary.value?.hitFormula ?? '');

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

    // Лист привязанного персонажа — своей вкладкой: бой при этом не теряется.
    if (sheetRoute.value) {
      items.push({
        label: OPEN_SHEET_MENU_LABEL,
        icon: 'tabler:id-badge-2',
        to: sheetRoute.value,
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

  /** Гасит битую картинку аватара — он падает на иконку или инициалы. */
  function onAvatarError(): void {
    dropAvatar(participant);
  }

  const isColorOpen = ref(false);

  /**
   * Оформление образца палитры: тот же кружок, что и у иконки участника.
   * @param option Цвет палитры.
   */
  function swatchClass(option: ParticipantColor): string {
    return PARTICIPANT_COLOR_CLASS[option].surface;
  }

  /**
   * Оформление галочки на выбранном образце палитры.
   * @param option Цвет палитры.
   */
  function swatchCheckClass(option: ParticipantColor): string {
    return PARTICIPANT_COLOR_CLASS[option].content;
  }

  /**
   * Меняет цвет иконки участника и закрывает палитру.
   * @param option Выбранный цвет.
   */
  function selectColor(option: ParticipantColor): void {
    isColorOpen.value = false;

    emit('set-color', participant.id, option);
  }

  /**
   * Пробрасывает наложение состояния с id участника.
   * @param key Ключ состояния.
   * @param rounds Длительность в раундах (0 — до снятия вручную).
   */
  function onAddCondition(
    key: ConditionKey,
    rounds: number,
    expiry: ConditionExpiry,
  ): void {
    emit('add-condition', participant.id, key, rounds, expiry);
  }

  /**
   * Пробрасывает снятие состояния с id участника.
   * @param key Ключ состояния.
   */
  function onRemoveCondition(key: ConditionKey): void {
    emit('remove-condition', participant.id, key);
  }

  function onRename(id: string, name: string): void {
    emit('edit', id, { name });
  }

  function onChangeHitPoints(value: number): void {
    emit('set-hit-points', participant.id, value);
  }

  /**
   * Пробрасывает прокинутый максимум хитов с id участника.
   * @param value Новый максимум хитов.
   */
  function onSetMaxHitPoints(value: number): void {
    emit('set-max-hit-points', participant.id, value);
  }

  /**
   * Пробрасывает новый КД игрока с id участника.
   * @param value Новое значение КД.
   */
  function onChangeArmorClass(value: number): void {
    emit('set-armor-class', participant.id, value);
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

      <!-- Без картинки участника различает цвет иконки: кружок сам и открывает
           палитру. С картинкой выбирать нечего — она цвет и перекрывает. -->
      <UPopover
        v-if="!avatarImage"
        v-model:open="isColorOpen"
      >
        <button
          type="button"
          class="shrink-0 cursor-pointer rounded-full transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          :disabled
          :aria-label="PARTICIPANT_COLOR_TITLE"
        >
          <ParticipantAvatar
            :participant="participant"
            :color="color"
            :class="isDead && 'opacity-40 grayscale'"
          />
        </button>

        <template #content>
          <div class="flex flex-col gap-2">
            <span class="text-xs text-secondary">
              {{ PARTICIPANT_COLOR_TITLE }}
            </span>

            <div class="flex flex-wrap gap-1.5">
              <UTooltip
                v-for="option in PARTICIPANT_COLORS"
                :key="option"
                :text="PARTICIPANT_COLOR_LABEL[option]"
              >
                <button
                  type="button"
                  class="grid size-7 cursor-pointer place-items-center rounded-full border transition-transform hover:scale-110"
                  :class="swatchClass(option)"
                  :aria-label="PARTICIPANT_COLOR_LABEL[option]"
                  @click.left.exact.prevent="selectColor(option)"
                >
                  <UIcon
                    v-if="option === color"
                    name="tabler:check"
                    class="size-4"
                    :class="swatchCheckClass(option)"
                  />
                </button>
              </UTooltip>
            </div>
          </div>
        </template>
      </UPopover>

      <ParticipantAvatar
        v-else
        :participant="participant"
        :image="avatarImage"
        :class="isDead && 'opacity-40 grayscale'"
        @image-error="onAvatarError"
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

    <!-- Статы: одинаковые плитки Хиты/КД/Состояния/Бонус/Иниц. фиксированной
         ширины + меню. Колонки совпадают между строками, режимами и типами
         участников (у игроков в КД — прочерк). На мобильном — вторая строка. -->
    <div
      class="flex basis-full flex-wrap items-center justify-end gap-2 sm:flex-none sm:basis-auto sm:flex-nowrap"
    >
      <!-- Группа состояния бойца (Хиты, КД, Состояния) -->
      <div class="flex min-w-52 flex-1 items-center gap-2 sm:flex-none">
        <div class="w-16 flex-1 sm:flex-none">
          <ParticipantHitPointsControl
            :current="participant.currentHitPoints"
            :max="maxHitPoints"
            :formula="hitFormula"
            :disabled="disabled"
            :is-player="participant.type === 'PLAYER'"
            @change="onChangeHitPoints"
            @set-max="onSetMaxHitPoints"
          />
        </div>

        <div class="w-12 flex-1 sm:flex-none">
          <!-- Игроку КД задаёт мастер вручную, существам — из статблока. -->
          <ParticipantArmorClassControl
            v-if="participant.type === 'PLAYER'"
            :current="participant.armorClass"
            :disabled
            :class="dimmedClass"
            @change="onChangeArmorClass"
          />

          <UTooltip
            v-else
            :text="armorClassTooltip"
            :disabled="!hasArmorClassDetails"
            class="w-full"
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

        <!-- Состояния — такая же плитка, как хиты и КД: наложенное читается
             прямо из ряда, а не отдельной строкой под именем. -->
        <div
          class="w-20 flex-1 sm:flex-none"
          :class="dimmedClass"
        >
          <ParticipantConditions
            :conditions="participant.conditions"
            :participant-name="participant.name"
            :round="round"
            :disabled="disabled"
            @add="onAddCondition"
            @remove="onRemoveCondition"
          />
        </div>
      </div>

      <!-- Группа инициативы и действий (Бонус, Иниц, Меню) -->
      <div class="flex min-w-53 flex-1 items-center gap-2 sm:flex-none">
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
