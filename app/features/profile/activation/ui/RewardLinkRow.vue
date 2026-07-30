<script setup lang="ts">
  import type { UserReward } from '../model';

  import { useVttgDesktopRelease } from '~vttg/composables';
  import { formatReleaseSummary } from '~vttg/model';
  import { VttgDownloadPlatforms } from '~vttg/ui';

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

  const { release, load: loadRelease } = useVttgDesktopRelease();

  const title = computed(
    () => props.reward.title || REWARD_PERK_LABELS[props.reward.perk],
  );

  const icon = computed(() => REWARD_PERK_ICONS[props.reward.perk]);

  const isComingSoon = computed(
    () => props.reward.availability === 'COMING_SOON',
  );

  // Ранний доступ — это сам VTTG: вместо одной ссылки показываем кнопки платформ,
  // а версию берём из канала обновлений, а не из reward_resource, поэтому она
  // всегда актуальная.
  const needsRelease = computed(
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

  /** Подпись под названием: у раннего доступа — версия и вес сборки. */
  const note = computed(() =>
    needsRelease.value && release.value
      ? formatReleaseSummary(release.value)
      : props.reward.note,
  );

  // Версия нужна самой строке, поэтому просим манифест здесь же: `load` идемпотентен,
  // блок платформ ниже запрашивает тот же ключ и лишнего запроса не будет.
  onMounted(() => {
    if (needsRelease.value) {
      loadRelease();
    }
  });
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
          v-if="note"
          class="truncate text-xs text-muted"
        >
          {{ note }}
        </p>
      </div>

      <!-- Одиночное действие: у раннего доступа его заменяют кнопки платформ. -->
      <template v-if="!needsRelease">
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

    <VttgDownloadPlatforms
      v-if="needsRelease"
      class="mt-2.5 pl-8"
    />
  </div>
</template>
