<script setup lang="ts">
  import type { UserReward } from '../model';

  import {
    COSMETIC_PERKS,
    REWARD_PERK_FALLBACK_URLS,
    REWARD_PERK_ICONS,
    REWARD_PERK_LABELS,
    rewardActionIcon,
    rewardActionLabel,
  } from '../model';

  const props = defineProps<{
    reward: UserReward;
  }>();

  const title = computed(
    () => props.reward.title || REWARD_PERK_LABELS[props.reward.perk],
  );

  const icon = computed(() => REWARD_PERK_ICONS[props.reward.perk]);

  const isComingSoon = computed(
    () => props.reward.availability === 'COMING_SOON',
  );

  // URL награды: приоритет у бэкенда (reward_resource), иначе готовый S3-фолбэк.
  const url = computed(
    () =>
      props.reward.url ?? REWARD_PERK_FALLBACK_URLS[props.reward.perk] ?? null,
  );

  // Ссылка кликабельна, только если контент готов и есть URL (бэкенд или фолбэк).
  const hasLink = computed(() => !isComingSoon.value && !!url.value);

  // Косметический перк — ссылки нет по дизайну, он просто применён к профилю.
  const isCosmetic = computed(() => COSMETIC_PERKS.has(props.reward.perk));
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-lg border border-default bg-elevated/40 px-3 py-2.5"
  >
    <UIcon
      :name="icon"
      class="h-5 w-5 shrink-0 text-primary"
      aria-hidden="true"
    />

    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium text-highlighted">
        {{ title }}
      </p>

      <p
        v-if="reward.note"
        class="truncate text-xs text-muted"
      >
        {{ reward.note }}
      </p>
    </div>

    <UButton
      v-if="hasLink"
      :to="url!"
      target="_blank"
      rel="noopener noreferrer"
      :icon="rewardActionIcon(reward.perk)"
      size="xs"
      color="primary"
      variant="soft"
    >
      {{ rewardActionLabel(reward.perk) }}
    </UButton>

    <UBadge
      v-else-if="isComingSoon"
      color="neutral"
      variant="subtle"
      size="sm"
    >
      Скоро
    </UBadge>

    <UBadge
      v-else-if="isCosmetic"
      color="success"
      variant="subtle"
      size="sm"
    >
      Активно
    </UBadge>

    <span
      v-else
      class="shrink-0 text-xs text-muted"
    >
      Ссылка появится позже
    </span>
  </div>
</template>
