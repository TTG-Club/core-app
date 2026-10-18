<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { PlayerBastion } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import {
    BASTION_GAME_LABELS,
    BASTION_SHARE_LABELS,
    getBastionRoute,
    getGameRoute,
    isBastionStatusShown,
    MY_BASTIONS_LABELS,
    PLAYER_BASTION_STATUS_COLORS,
    PLAYER_BASTION_STATUS_LABELS,
  } from '../../model';
  import BastionMemberList from './BastionMemberList.vue';

  const {
    bastion,
    currentUserId = undefined,
    showGame = false,
    canRemove = false,
  } = defineProps<{
    bastion: PlayerBastion;
    /** Текущий пользователь: по нему отмечается «Ваш» бастион. */
    currentUserId?: string;
    /** Показывать ссылку на игру, в которую добавлен бастион. */
    showGame?: boolean;
    /** Показывать удаление: только в «Моих бастионах». */
    canRemove?: boolean;
  }>();

  const emit = defineEmits<{
    edit: [];
    archive: [];
    leave: [];
    remove: [];
    share: [];
  }>();

  const detailRoute = computed(() => getBastionRoute(bastion.id));

  const gameRoute = computed(() =>
    showGame && bastion.gameId ? getGameRoute(bastion.gameId) : undefined,
  );

  const isOwn = computed(
    () =>
      !!currentUserId
      && (bastion.ownerId === currentUserId
        || bastion.members.some((member) => member.userId === currentUserId)),
  );

  const isStatusShown = computed(() => isBastionStatusShown(bastion.status));

  /** Сколько запросов на правку ждут владельца — для подсказки у кнопки. */
  const shareTooltip = computed(() =>
    bastion.editRequests
      ? fillTemplate(BASTION_SHARE_LABELS.requests, {
          count: bastion.editRequests,
        })
      : BASTION_SHARE_LABELS.share,
  );

  /** Действия под троеточием: только те, что доступны пользователю. */
  const menuItems = computed<Array<DropdownMenuItem>>(() => [
    ...(bastion.canManage
      ? [
          {
            label: BASTION_GAME_LABELS.edit,
            icon: 'tabler:pencil',
            onSelect: () => emit('edit'),
          },
          {
            label: BASTION_GAME_LABELS.archive,
            icon: 'tabler:archive',
            onSelect: () => emit('archive'),
          },
        ]
      : []),
    ...(bastion.canLeaveGame
      ? [
          {
            label: BASTION_GAME_LABELS.leaveGame,
            icon: 'tabler:door-exit',
            onSelect: () => emit('leave'),
          },
        ]
      : []),
    ...(canRemove && bastion.owned
      ? [
          {
            label: MY_BASTIONS_LABELS.remove,
            icon: 'tabler:trash',
            color: 'error' as const,
            onSelect: () => emit('remove'),
          },
        ]
      : []),
  ]);
</script>

<template>
  <UCard
    variant="subtle"
    class="relative transition-colors hover:bg-elevated hover:ring-primary/50"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <UIcon
            name="tabler:building-castle"
            class="size-5 shrink-0 text-muted"
          />

          <!--
            Ссылка растянута на всю карточку: клик по карточке открывает
            бастион. NuxtLink, а не ULink: фильтр ULink при нажатии сжимает
            растянутую область до текста, и клик теряется.
          -->
          <NuxtLink
            :to="detailRoute"
            :title="bastion.name"
            class="truncate rounded-md text-base font-semibold text-highlighted outline-primary/25 after:absolute after:inset-0 after:rounded-lg focus-visible:outline-3"
          >
            {{ bastion.name }}
          </NuxtLink>

          <UBadge
            v-if="isOwn"
            color="primary"
            variant="subtle"
            size="sm"
            class="shrink-0"
          >
            {{ BASTION_GAME_LABELS.yours }}
          </UBadge>
        </div>

        <div class="relative z-10 flex shrink-0 items-center gap-1">
          <UTooltip
            v-if="bastion.owned"
            :text="shareTooltip"
          >
            <UChip
              :show="!!bastion.editRequests"
              :text="bastion.editRequests ?? undefined"
              color="warning"
              size="xl"
            >
              <UButton
                icon="tabler:share"
                color="neutral"
                variant="ghost"
                size="xs"
                :aria-label="BASTION_SHARE_LABELS.share"
                @click.left.exact.prevent="$emit('share')"
              />
            </UChip>
          </UTooltip>

          <UDropdownMenu
            v-if="menuItems.length"
            :items="menuItems"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="tabler:dots"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="BASTION_GAME_LABELS.actions"
            />
          </UDropdownMenu>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-3">
      <div
        class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted"
      >
        <span class="tabular-nums">
          {{ BASTION_GAME_LABELS.turn }}: {{ bastion.turn }}
        </span>

        <span class="tabular-nums">
          {{ BASTION_GAME_LABELS.treasury }}: {{ bastion.treasuryGp }}
          {{ BASTION_GAME_LABELS.gold }}
        </span>

        <div
          v-if="gameRoute || isStatusShown"
          class="relative z-10 ml-auto flex items-center gap-2"
        >
          <UBadge
            v-if="isStatusShown"
            :color="PLAYER_BASTION_STATUS_COLORS[bastion.status]"
            variant="subtle"
          >
            {{ PLAYER_BASTION_STATUS_LABELS[bastion.status] }}
          </UBadge>

          <UButton
            v-if="gameRoute"
            :to="gameRoute"
            icon="tabler:users-group"
            color="neutral"
            variant="subtle"
            size="xs"
          >
            {{ BASTION_GAME_LABELS.inGame }}
          </UButton>
        </div>
      </div>

      <BastionMemberList :members="bastion.members" />
    </div>
  </UCard>
</template>
