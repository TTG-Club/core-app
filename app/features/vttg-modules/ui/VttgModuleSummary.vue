<script setup lang="ts">
  import type { ModuleSubmission } from '../model';

  import { useVttgGameSystems } from '../composables';
  import {
    CARD_DATE_FORMAT,
    CARD_DOWNLOAD_ICON,
    CARD_DOWNLOAD_LABEL,
    CARD_MANIFEST_ICON,
    CARD_MANIFEST_LABEL,
    CARD_MODERATOR_COMMENT_LABEL,
    CARD_REPOSITORY_ICON,
    CARD_REPOSITORY_LABEL,
    CARD_SUBMITTED_PREFIX,
    CARD_SYNCED_PREFIX,
    CARD_UNIVERSAL_LABEL,
    CARD_VERSION_PREFIX,
    getModuleIcon,
  } from '../model';
  import VttgModuleStatusBadge from './VttgModuleStatusBadge.vue';

  /**
   * Заявка на модуль целиком: что за модуль, где лежит, под какие системы и
   * что ответил модератор. Действия над заявкой у автора и у модератора
   * свои — они приходят слотом.
   */
  const { submission } = defineProps<{
    submission: ModuleSubmission;
  }>();

  const { format } = useDayjs();
  const { getSystemName } = useVttgGameSystems();

  const title = computed(() => submission.module.name);

  const version = computed(
    () => `${CARD_VERSION_PREFIX}${submission.module.version}`,
  );

  const icon = computed(() => getModuleIcon(submission.module.icon));

  const systemNames = computed(() =>
    submission.systemIds.length > 0
      ? submission.systemIds.map(getSystemName)
      : [CARD_UNIVERSAL_LABEL],
  );

  const links = computed(() => [
    {
      label: CARD_REPOSITORY_LABEL,
      to: submission.repositoryUrl,
      icon: CARD_REPOSITORY_ICON,
    },
    {
      label: CARD_MANIFEST_LABEL,
      to: submission.manifestUrl,
      icon: CARD_MANIFEST_ICON,
    },
    {
      label: CARD_DOWNLOAD_LABEL,
      to: submission.module.downloadUrl,
      icon: CARD_DOWNLOAD_ICON,
    },
  ]);

  const submittedAt = computed(
    () =>
      `${CARD_SUBMITTED_PREFIX} ${format(submission.createdAt, CARD_DATE_FORMAT)}`,
  );

  const syncedAt = computed(
    () =>
      `${CARD_SYNCED_PREFIX} ${format(submission.module.syncedAt, CARD_DATE_FORMAT)}`,
  );

  const moderatorComment = computed(
    () => submission.moderation?.comment ?? null,
  );
</script>

<template>
  <UCard variant="subtle">
    <div class="flex flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <UIcon
            :name="icon"
            class="size-8 shrink-0 text-primary"
          />

          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold text-highlighted">
              {{ title }}
            </h3>

            <div class="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span class="font-mono">{{ submission.module.id }}</span>

              <span>{{ version }}</span>
            </div>
          </div>
        </div>

        <VttgModuleStatusBadge :status="submission.status" />
      </div>

      <p class="text-sm whitespace-pre-line text-default">
        {{ submission.description }}
      </p>

      <div class="flex flex-wrap gap-1">
        <UBadge
          v-for="systemName in systemNames"
          :key="systemName"
          color="neutral"
          variant="outline"
          size="sm"
        >
          {{ systemName }}
        </UBadge>
      </div>

      <div class="flex flex-wrap gap-x-4 gap-y-1">
        <ULink
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-sm"
        >
          <UIcon :name="link.icon" />

          {{ link.label }}
        </ULink>
      </div>

      <UAlert
        v-if="moderatorComment"
        :title="CARD_MODERATOR_COMMENT_LABEL"
        :description="moderatorComment"
        color="neutral"
        variant="subtle"
      />

      <slot name="extra" />

      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-col text-xs text-dimmed">
          <span>{{ submittedAt }}</span>

          <span>{{ syncedAt }}</span>
        </div>

        <div class="flex flex-wrap gap-2">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </UCard>
</template>
