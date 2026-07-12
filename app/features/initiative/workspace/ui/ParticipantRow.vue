<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    TrackerParticipant,
    UpdateParticipantRequest,
  } from '~initiative/model';

  import {
    useCreatureDrawer,
    useCreatureImages,
  } from '~initiative/composables';
  import {
    formatInitiativeBonus,
    getCreatureRoute,
    MAX_INITIATIVE_BONUS,
    MAX_PARTICIPANT_NAME_LENGTH,
    MIN_INITIATIVE_BONUS,
  } from '~initiative/model';
  import { InitiativeDie } from '~initiative/ui-kit';

  import ParticipantAvatar from './ParticipantAvatar.vue';
  import ParticipantRollControl from './ParticipantRollControl.vue';

  const {
    participant,
    isActive = false,
    isCurrent = false,
    order = 0,
    disabled = false,
  } = defineProps<{
    participant: TrackerParticipant;
    /** Идёт бой: строка в режиме просмотра (имя/бонус — текст). Иначе — режим правки. */
    isActive?: boolean;
    isCurrent?: boolean;
    order?: number;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    'edit': [id: string, patch: UpdateParticipantRequest];
    'remove': [id: string];
    'roll': [id: string];
    'toggle-dead': [id: string, dead: boolean];
  }>();

  const { openCreature } = useCreatureDrawer();
  const { imageFor, dropImage } = useCreatureImages(() => [participant]);

  const name = ref(participant.name);
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

  const menuItems = computed<Array<DropdownMenuItem>>(() => {
    const items: Array<DropdownMenuItem> = [];

    const { creatureUrl } = participant;

    if (creatureUrl) {
      items.push({
        label: 'Открыть в панели',
        icon: 'tabler:layout-sidebar-right-expand',
        onSelect: () => openCreature(creatureUrl),
      });

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

  // Ресинхронизация локальных полей после ответа сервера (участник приходит
  // новым объектом). Присвоение bonus здесь не даёт лишнего PUT: watch(bonus)
  // ниже выходит по guard-у `value === participant.initiativeBonus`.
  watch(
    () => participant.name,
    (value) => {
      name.value = value;
    },
  );

  watch(
    () => participant.initiativeBonus,
    (value) => {
      bonus.value = value;
    },
  );

  // Цикл watch(bonus) → PUT → новый participant → watch(participant) → bonus
  // разрывается проверкой равенства: после ресинка значение уже совпадает.
  watch(bonus, (value) => {
    if (
      typeof value !== 'number'
      || Number.isNaN(value)
      || value === participant.initiativeBonus
    ) {
      return;
    }

    emit('edit', participant.id, { initiativeBonus: value });
  });

  // Откат локальных полей к серверным по завершении мутации: неуспешный PUT не
  // меняет participant, поэтому watch'и выше не сработают и в поле осталось бы
  // отклонённое значение.
  watch(
    () => disabled,
    (isNowDisabled, wasDisabled) => {
      if (wasDisabled && !isNowDisabled) {
        name.value = participant.name;
        bonus.value = participant.initiativeBonus;
      }
    },
  );

  function commitName(): void {
    // Во время мутации не коммитим: авто-blur при disable поля иначе шлёт второй
    // идентичный PUT (новое имя ещё не доехало в participant, guard проходит).
    if (disabled) {
      return;
    }

    const trimmed = name.value.trim();

    if (!trimmed) {
      name.value = participant.name;

      return;
    }

    if (trimmed !== participant.name) {
      emit('edit', participant.id, { name: trimmed });
    }
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
      !isActive && disabled && 'pointer-events-none opacity-60',
    ]"
  >
    <!-- Идентификация: номер + аватар + имя. На мобильном занимает всю ширину
         (basis-full) → контролы переносятся на вторую строку; на sm+ — единый
         ряд. Высоту строки держит аватар (size-10), а не поле имени, поэтому
         строка одинаковой высоты и в правке, и в бою. -->
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

      <!-- Имя: инпут в правке, текст в просмотре -->
      <div class="min-w-0 flex-1">
        <UInput
          v-if="!isActive"
          v-model="name"
          :maxlength="MAX_PARTICIPANT_NAME_LENGTH"
          :disabled
          class="w-full"
          aria-label="Имя участника"
          @blur="commitName"
          @keydown.enter.prevent="commitName"
        />

        <span
          v-else
          class="block truncate font-semibold"
          :class="isDead ? 'text-muted line-through' : 'text-highlighted'"
        >
          {{ participant.name }}
        </span>
      </div>
    </div>

    <!-- Контролы инициативы: бонус + кубик + бросок + меню. На мобильном — вторая
         строка, прижата вправо; высоту держит кубик (size-11), поэтому она тоже
         не зависит от режима. На sm+ — продолжение ряда. -->
    <div class="flex flex-1 items-center justify-end gap-2 sm:flex-none">
      <!-- Бонус: инпут в правке, значение в просмотре -->
      <div class="w-24 shrink-0">
        <UInputNumber
          v-if="!isActive"
          v-model="bonus"
          :min="MIN_INITIATIVE_BONUS"
          :max="MAX_INITIATIVE_BONUS"
          :disabled
          class="w-full"
          aria-label="Бонус инициативы"
        />

        <span
          v-else
          class="block text-center text-sm text-secondary tabular-nums"
          title="Бонус инициативы"
          :class="isDead && 'opacity-60'"
        >
          {{ formatInitiativeBonus(participant.initiativeBonus) }}
        </span>
      </div>

      <InitiativeDie
        :value="participant.initiativeTotal"
        :class="isDead && 'opacity-40 grayscale'"
      />

      <ParticipantRollControl
        :participant="participant"
        :disabled="disabled"
        @roll="onRoll"
        @set-roll="onSetRoll"
      />

      <UDropdownMenu
        :items="menuItems"
        :external-icon="false"
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
</template>
