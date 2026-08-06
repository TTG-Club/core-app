<script setup lang="ts">
  import type { UserReward } from '../model';

  import { VttgDownloadBuilds } from '~vttg/ui';

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

  // Ранний доступ — это сам VTTG: вместо одной ссылки показываем список сборок,
  // а версии берём из канала обновлений, а не из reward_resource, поэтому они
  // всегда актуальные и у каждой платформы своя.
  const isEarlyAccess = computed(
    () => props.reward.perk === 'EARLY_ACCESS_DOWNLOAD' && !isComingSoon.value,
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
  <div class="rounded-lg border border-default bg-elevated/40 px-3 py-2.5">
    <div class="flex items-center gap-3">
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

      <!-- Одиночное действие: у раннего доступа его заменяет список сборок. -->
      <template v-if="!isEarlyAccess">
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
      </template>
    </div>

    <VttgDownloadBuilds
      v-if="isEarlyAccess"
      class="mt-3"
    />
  </div>
</template>
