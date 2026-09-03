<script setup lang="ts">
  import type { GameRegistration } from '../../model';

  import { CharacterSheetDrawer } from '~character-sheet/drawer';

  import {
    CHAT_PRIVATE_OPEN_LABEL,
    REGISTRATION_APPROVE_LABEL,
    REGISTRATION_CHARACTER_SHEET_LABEL,
    REGISTRATION_EXCLUDE_HINT,
    REGISTRATION_EXCLUDE_LABEL,
    REGISTRATION_REJECT_LABEL,
    REGISTRATIONS_FULL_HINT,
    SESSION_REGISTRATION_STATUS_COLORS,
    SESSION_REGISTRATION_STATUS_LABELS,
  } from '../../model';
  import { getSharedCharacterSheetToken } from '../../ui';

  const {
    registration,
    playerName,
    isFull,
    busy = false,
  } = defineProps<{
    registration: GameRegistration;
    /** Отображаемое имя игрока; сырой UUID показывать нельзя. */
    playerName: string;
    /** Мест больше нет — принять ещё одного игрока сервис не даст. */
    isFull: boolean;
    busy?: boolean;
  }>();

  const emit = defineEmits<{
    approve: [registrationId: string];
    reject: [registrationId: string];
    message: [playerId: string];
  }>();

  const overlay = useOverlay();

  const isPending = computed(() => registration.status === 'PENDING');

  // Принятого игрока не отклоняют, а исключают: он уже в составе и уйдёт из
  // всех незакрытых сессий, поэтому решение подтверждают отдельно.
  const isApproved = computed(() => registration.status === 'APPROVED');

  const statusColor = computed(
    () => SESSION_REGISTRATION_STATUS_COLORS[registration.status],
  );

  // Лист персонажа сайта открывается на месте; чужая ссылка остаётся обычной
  // и уводит в новую вкладку.
  const sheetToken = computed(() =>
    getSharedCharacterSheetToken(registration.characterSheetUrl),
  );

  // Окно создаётся один раз при первом открытии: заявка в строке не меняется,
  // а создавать его заранее для каждой строки списка незачем.
  let sheetDrawer: ReturnType<typeof overlay.create> | undefined;

  /** Открывает лист персонажа игрока рядом со списком заявок. */
  function openCharacterSheet(): void {
    const token = sheetToken.value;

    if (!token) {
      return;
    }

    sheetDrawer ??= overlay.create(CharacterSheetDrawer, {
      props: {
        shareToken: token,
        onClose: () => sheetDrawer?.close(),
      },
    });

    sheetDrawer.open();
  }

  // Принять сверх максимума сервис не даст, поэтому кнопка гаснет заранее и
  // объясняет почему.
  const isApproveBlocked = computed(() => isPending.value && isFull);
</script>

<template>
  <div class="flex flex-col gap-2 rounded-md border border-default p-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="flex min-w-0 flex-col">
        <span class="font-medium text-highlighted">{{ playerName }}</span>

        <span
          v-if="registration.characterName"
          class="text-sm text-muted"
        >
          {{ registration.characterName }}
        </span>
      </span>

      <div class="flex flex-wrap items-center gap-1.5">
        <UBadge
          :color="statusColor"
          variant="subtle"
          size="sm"
          :label="SESSION_REGISTRATION_STATUS_LABELS[registration.status]"
        />
      </div>
    </div>

    <UButton
      v-if="sheetToken"
      size="sm"
      variant="link"
      color="primary"
      icon="tabler:file-text"
      class="self-start p-0"
      :label="REGISTRATION_CHARACTER_SHEET_LABEL"
      @click.left.exact.prevent="openCharacterSheet"
    />

    <ULink
      v-else-if="registration.characterSheetUrl"
      :to="registration.characterSheetUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-1.5 text-sm text-primary"
    >
      <UIcon
        name="tabler:file-text"
        class="size-4"
      />
      {{ REGISTRATION_CHARACTER_SHEET_LABEL }}
    </ULink>

    <p
      v-if="isApproveBlocked"
      class="text-sm text-warning"
    >
      {{ REGISTRATIONS_FULL_HINT }}
    </p>

    <div class="flex flex-wrap gap-2">
      <UButton
        v-if="isPending"
        size="sm"
        color="success"
        icon="tabler:check"
        :disabled="busy || isApproveBlocked"
        :label="REGISTRATION_APPROVE_LABEL"
        @click.left.exact.prevent="emit('approve', registration.id)"
      />

      <UButton
        v-if="isPending"
        size="sm"
        color="error"
        variant="subtle"
        icon="tabler:x"
        :disabled="busy"
        :label="REGISTRATION_REJECT_LABEL"
        @click.left.exact.prevent="emit('reject', registration.id)"
      />

      <UButton
        v-else-if="isApproved"
        size="sm"
        color="error"
        variant="subtle"
        icon="tabler:user-minus"
        :disabled="busy"
        :label="REGISTRATION_EXCLUDE_LABEL"
        :title="REGISTRATION_EXCLUDE_HINT"
        @click.left.exact.prevent="emit('reject', registration.id)"
      />

      <UButton
        size="sm"
        color="neutral"
        variant="subtle"
        icon="tabler:message-circle"
        :disabled="busy"
        :label="CHAT_PRIVATE_OPEN_LABEL"
        @click.left.exact.prevent="emit('message', registration.playerId)"
      />
    </div>
  </div>
</template>
