<script setup lang="ts">
  import type { PlayerBastion } from '../../model';

  import {
    BASTION_GAME_LABELS,
    PLAYER_BASTION_STATUS_COLORS,
    PLAYER_BASTION_STATUS_LABELS,
  } from '../../model';
  import BastionMemberList from './BastionMemberList.vue';

  const { bastion, currentUserId = undefined } = defineProps<{
    bastion: PlayerBastion;
    /** Текущий пользователь: по нему отмечается «Ваш» бастион. */
    currentUserId?: string;
  }>();

  defineEmits<{
    edit: [];
    archive: [];
  }>();

  const detailRoute = computed(
    () => `/games/${bastion.gameId}/bastions/${bastion.id}`,
  );

  const isOwn = computed(
    () =>
      !!currentUserId
      && bastion.members.some((member) => member.userId === currentUserId),
  );
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <UIcon
            name="tabler:building-castle"
            class="size-5 shrink-0 text-muted"
          />

          <ULink
            :to="detailRoute"
            class="truncate text-base font-semibold text-highlighted"
          >
            {{ bastion.name }}
          </ULink>

          <UBadge
            v-if="isOwn"
            color="primary"
            variant="subtle"
            size="sm"
          >
            {{ BASTION_GAME_LABELS.yours }}
          </UBadge>
        </div>

        <UBadge
          :color="PLAYER_BASTION_STATUS_COLORS[bastion.status]"
          variant="subtle"
        >
          {{ PLAYER_BASTION_STATUS_LABELS[bastion.status] }}
        </UBadge>
      </div>
    </template>

    <div class="flex flex-col gap-3">
      <div class="flex gap-4 text-sm text-muted tabular-nums">
        <span>{{ BASTION_GAME_LABELS.turn }}: {{ bastion.turn }}</span>

        <span>
          {{ BASTION_GAME_LABELS.treasury }}: {{ bastion.treasuryGp }}
          {{ BASTION_GAME_LABELS.gold }}
        </span>
      </div>

      <BastionMemberList :members="bastion.members" />
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <UButton
          v-if="bastion.canManage"
          icon="tabler:archive"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="$emit('archive')"
        >
          {{ BASTION_GAME_LABELS.archive }}
        </UButton>

        <UButton
          v-if="bastion.canManage"
          icon="tabler:pencil"
          color="neutral"
          variant="subtle"
          @click.left.exact.prevent="$emit('edit')"
        >
          {{ BASTION_GAME_LABELS.edit }}
        </UButton>

        <UButton
          :to="detailRoute"
          icon="tabler:arrow-right"
          trailing
        >
          {{ BASTION_GAME_LABELS.open }}
        </UButton>
      </div>
    </template>
  </UCard>
</template>
