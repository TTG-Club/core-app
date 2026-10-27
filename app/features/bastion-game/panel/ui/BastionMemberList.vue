<script setup lang="ts">
  import type { PlayerBastionMember } from '../../model';

  import { ParticipantName } from '~find-game/ui';

  import { BASTION_GAME_LABELS } from '../../model';

  /** Игроки с доступом к бастиону и их персонажи. */
  defineProps<{
    members: ReadonlyArray<PlayerBastionMember>;
  }>();
</script>

<template>
  <p
    v-if="!members.length"
    class="text-sm text-muted"
  >
    {{ BASTION_GAME_LABELS.noMembers }}
  </p>

  <ul
    v-else
    class="flex flex-col gap-1.5"
  >
    <li
      v-for="member in members"
      :key="member.userId"
      class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm"
    >
      <span class="min-w-0">
        <span class="font-medium text-highlighted">
          {{ member.characterName }}
        </span>

        <span class="text-muted">
          · <ParticipantName :user-id="member.userId" />
        </span>
      </span>

      <span class="text-muted tabular-nums">
        {{ member.characterLevel }} {{ BASTION_GAME_LABELS.level }} ·
        {{ member.specialFacilityLimit }}
        {{ BASTION_GAME_LABELS.specialFacilities }}
      </span>
    </li>
  </ul>
</template>
