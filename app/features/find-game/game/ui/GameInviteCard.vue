<script setup lang="ts">
  import {
    GAME_INVITE_COPY_LABEL,
    GAME_INVITE_DESCRIPTION,
    GAME_INVITE_TITLE,
    getGameInviteLink,
  } from '../../model';

  const { gameId, inviteCode } = defineProps<{
    gameId: string;
    inviteCode: string;
  }>();

  const { copy } = useCopyAndShare();

  const inviteLink = computed(() => getGameInviteLink(gameId, inviteCode));

  /** Копирует ссылку-приглашение в буфер обмена. */
  function copyInviteLink(): void {
    copy(inviteLink.value);
  }
</script>

<!--
  Приглашение живёт в столбце сводки рядом с условиями игры, а он узкий:
  поле со ссылкой и кнопка стоят друг под другом на любой ширине — в строку
  от ссылки осталось бы несколько символов.
-->
<template>
  <div
    class="flex flex-col gap-3 rounded-xl border border-default bg-elevated p-4"
  >
    <div class="flex flex-col gap-1">
      <h3 class="flex items-center gap-2 font-semibold text-highlighted">
        <UIcon
          name="tabler:link"
          class="size-4 text-muted"
        />
        {{ GAME_INVITE_TITLE }}
      </h3>

      <p class="text-sm text-muted">
        {{ GAME_INVITE_DESCRIPTION }}
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <UInput
        :model-value="inviteLink"
        readonly
        class="w-full min-w-0"
        :ui="{ base: 'font-mono text-xs' }"
      />

      <UButton
        block
        color="neutral"
        variant="subtle"
        icon="tabler:copy"
        :label="GAME_INVITE_COPY_LABEL"
        @click.left.exact.prevent="copyInviteLink"
      />
    </div>
  </div>
</template>
