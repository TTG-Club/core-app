<script setup lang="ts">
  import type { Nexus, NexusMember } from '../model';

  import {
    NEXUS_EVICT_LABEL,
    NEXUS_GAME_ROOM_HINT,
    NEXUS_LEAVE_LABEL,
    NEXUS_OWNER_LABEL,
  } from '../model';

  /**
   * Состав комнаты.
   *
   * У комнаты игры он идёт от заявок, и править его здесь нечем: принимают и
   * исключают на странице игры.
   */
  const { nexus, members, currentUserId } = defineProps<{
    nexus: Nexus;
    members: ReadonlyArray<NexusMember>;
    /** Кто смотрит: себе показываем «выйти», а не «вывести». */
    currentUserId: string | null;
    /** Отображаемое имя участника; сырой UUID показывать нельзя. */
    getMemberName: (userId: string) => string;
    loading?: boolean;
    busy?: boolean;
  }>();

  const emit = defineEmits<{
    remove: [memberId: string];
  }>();

  /**
   * Можно ли вывести участника: владелец выводит любого, остальные — только
   * себя. Владельца из его комнаты не выводят вовсе.
   * @param member Участник состава.
   */
  function canRemove(member: NexusMember): boolean {
    if (nexus.gameId || member.owner) {
      return false;
    }

    return nexus.owner || member.userId === currentUserId;
  }
</script>

<template>
  <section class="flex flex-col gap-3">
    <p
      v-if="nexus.gameId"
      class="text-sm text-muted"
    >
      {{ NEXUS_GAME_ROOM_HINT }}
    </p>

    <div
      v-if="loading"
      class="flex flex-col gap-2"
    >
      <USkeleton
        v-for="index in 3"
        :key="index"
        class="h-12 w-full rounded-md"
      />
    </div>

    <div
      v-else
      class="flex flex-col gap-2"
    >
      <div
        v-for="member in members"
        :key="member.userId"
        class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-default p-3"
      >
        <span class="flex items-center gap-2">
          <span class="font-medium text-highlighted">
            {{ getMemberName(member.userId) }}
          </span>

          <UBadge
            v-if="member.owner"
            color="primary"
            variant="subtle"
            size="sm"
            icon="tabler:crown"
            :label="NEXUS_OWNER_LABEL"
          />
        </span>

        <UButton
          v-if="canRemove(member)"
          size="sm"
          color="error"
          variant="subtle"
          icon="tabler:door-exit"
          :disabled="busy"
          :label="
            member.userId === currentUserId
              ? NEXUS_LEAVE_LABEL
              : NEXUS_EVICT_LABEL
          "
          @click.left.exact.prevent="emit('remove', member.userId)"
        />
      </div>
    </div>
  </section>
</template>
