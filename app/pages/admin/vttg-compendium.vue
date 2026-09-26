<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import { FetchStatus } from '~/shared/consts';
  import { useVttgCompendiumVersion } from '~admin/vttg-compendium/composables';
  import {
    getVttgCompendiumConfirmDescription,
    getVttgCompendiumDatedText,
    getVttgCompendiumUpdatedText,
    VTTG_COMPENDIUM_CONFIRM_TITLE,
    VTTG_COMPENDIUM_CURRENT_TITLE,
    VTTG_COMPENDIUM_DATE_FORMAT,
    VTTG_COMPENDIUM_LOAD_ERROR_ICON,
    VTTG_COMPENDIUM_LOAD_ERROR_TEXT,
    VTTG_COMPENDIUM_NEXT_DESCRIPTION,
    VTTG_COMPENDIUM_NEXT_TITLE,
    VTTG_COMPENDIUM_PAGE_TITLE,
    VTTG_COMPENDIUM_REBUILD_FINISHED_LABEL,
    VTTG_COMPENDIUM_REBUILD_RUNNING_ICON,
    VTTG_COMPENDIUM_REBUILD_STARTED_LABEL,
    VTTG_COMPENDIUM_REBUILD_STATUS_COLORS,
    VTTG_COMPENDIUM_REBUILD_STATUS_LABELS,
    VTTG_COMPENDIUM_REBUILD_TITLE,
    VTTG_COMPENDIUM_RETRY_LABEL,
    VTTG_COMPENDIUM_SEO_TITLE,
    VTTG_COMPENDIUM_SUBMIT_ICON,
    VTTG_COMPENDIUM_SUBMIT_LABEL,
    VTTG_COMPENDIUM_VERSION_STEP,
  } from '~admin/vttg-compendium/model';
  import { ConfirmDialog } from '~initiative/ui-kit';

  useSeoMeta({
    title: VTTG_COMPENDIUM_SEO_TITLE,
  });

  const { format } = useDayjs();

  const {
    compendiumVersion,
    error,
    status,
    refresh,
    minimumVersion,
    nextVersion,
    isSaving,
    isRebuilding,
    canSubmit,
    save,
  } = useVttgCompendiumVersion();

  const isConfirmOpen = ref(false);

  const isLoading = computed(
    () => !compendiumVersion.value && status.value !== FetchStatus.Error,
  );

  const isRetrying = computed(() => status.value === FetchStatus.Pending);

  const hasError = computed(() => !!error.value && !compendiumVersion.value);

  const updatedText = computed(() =>
    compendiumVersion.value?.updatedAt
      ? getVttgCompendiumUpdatedText(
          format(
            compendiumVersion.value.updatedAt,
            VTTG_COMPENDIUM_DATE_FORMAT,
          ),
          compendiumVersion.value.updatedBy,
        )
      : '',
  );

  const rebuild = computed(() => compendiumVersion.value?.rebuild ?? null);

  const rebuildLabel = computed(() =>
    rebuild.value
      ? VTTG_COMPENDIUM_REBUILD_STATUS_LABELS[rebuild.value.status]
      : '',
  );

  const rebuildColor = computed(() =>
    rebuild.value
      ? VTTG_COMPENDIUM_REBUILD_STATUS_COLORS[rebuild.value.status]
      : undefined,
  );

  const rebuildStartedText = computed(() =>
    rebuild.value?.startedAt
      ? getVttgCompendiumDatedText(
          VTTG_COMPENDIUM_REBUILD_STARTED_LABEL,
          format(rebuild.value.startedAt, VTTG_COMPENDIUM_DATE_FORMAT),
        )
      : '',
  );

  const rebuildFinishedText = computed(() =>
    rebuild.value?.finishedAt
      ? getVttgCompendiumDatedText(
          VTTG_COMPENDIUM_REBUILD_FINISHED_LABEL,
          format(rebuild.value.finishedAt, VTTG_COMPENDIUM_DATE_FORMAT),
        )
      : '',
  );

  const hasRebuildTimes = computed(
    () => !!rebuildStartedText.value || !!rebuildFinishedText.value,
  );

  const rebuildIcon = computed(() =>
    isRebuilding.value ? VTTG_COMPENDIUM_REBUILD_RUNNING_ICON : undefined,
  );

  const retryActions = computed<ButtonProps[]>(() => [
    {
      label: VTTG_COMPENDIUM_RETRY_LABEL,
      color: 'error',
      variant: 'outline',
      loading: isRetrying.value,
      onClick: handleRetry,
    },
  ]);

  const confirmDescription = computed(() =>
    nextVersion.value === null
      ? ''
      : getVttgCompendiumConfirmDescription(nextVersion.value),
  );

  /** Спрашивает подтверждение: подъём версии не откатить. */
  function openConfirm(): void {
    if (canSubmit.value) {
      isConfirmOpen.value = true;
    }
  }

  /** Поднимает версию; при ошибке диалог закрывается, причина — в тосте. */
  async function handleConfirm(): Promise<void> {
    await save();

    isConfirmOpen.value = false;
  }

  /** Повторяет загрузку после ошибки. */
  async function handleRetry(): Promise<void> {
    await refresh();
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="VTTG_COMPENDIUM_PAGE_TITLE"
  >
    <div class="space-y-6">
      <UAlert
        v-if="hasError"
        color="error"
        variant="subtle"
        :icon="VTTG_COMPENDIUM_LOAD_ERROR_ICON"
        :title="VTTG_COMPENDIUM_LOAD_ERROR_TEXT"
        :actions="retryActions"
      />

      <template v-else>
        <UCard variant="subtle">
          <template #header>
            <h2 class="text-base text-highlighted">
              {{ VTTG_COMPENDIUM_CURRENT_TITLE }}
            </h2>
          </template>

          <div
            v-if="isLoading"
            class="flex flex-col gap-3"
          >
            <USkeleton class="h-10 w-24" />

            <USkeleton class="h-4 w-64" />
          </div>

          <div
            v-else-if="compendiumVersion"
            class="flex flex-col gap-4"
          >
            <div>
              <div class="text-4xl font-semibold text-highlighted tabular-nums">
                {{ compendiumVersion.version }}
              </div>

              <p
                v-if="updatedText"
                class="text-sm text-muted"
              >
                {{ updatedText }}
              </p>
            </div>

            <div
              v-if="rebuild"
              class="flex flex-col gap-1"
            >
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm text-default">
                  {{ VTTG_COMPENDIUM_REBUILD_TITLE }}
                </span>

                <UBadge
                  :color="rebuildColor"
                  variant="subtle"
                  :icon="rebuildIcon"
                  :ui="{ leadingIcon: 'animate-spin' }"
                >
                  {{ rebuildLabel }}
                </UBadge>
              </div>

              <p
                v-if="hasRebuildTimes"
                class="flex flex-wrap gap-x-3 text-sm text-muted"
              >
                <span v-if="rebuildStartedText">{{ rebuildStartedText }}</span>

                <span v-if="rebuildFinishedText">{{
                  rebuildFinishedText
                }}</span>
              </p>

              <p
                v-if="rebuild.error"
                class="text-sm text-error"
              >
                {{ rebuild.error }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard variant="subtle">
          <template #header>
            <div>
              <h2 class="text-base text-highlighted">
                {{ VTTG_COMPENDIUM_NEXT_TITLE }}
              </h2>

              <p class="text-sm text-muted">
                {{ VTTG_COMPENDIUM_NEXT_DESCRIPTION }}
              </p>
            </div>
          </template>

          <div class="flex flex-wrap items-center gap-3">
            <UInputNumber
              v-model="nextVersion"
              :min="minimumVersion"
              :step="VTTG_COMPENDIUM_VERSION_STEP"
              :disabled="isLoading || isSaving"
              class="w-40"
            />

            <UButton
              :icon="VTTG_COMPENDIUM_SUBMIT_ICON"
              :loading="isSaving"
              :disabled="!canSubmit"
              @click.left.exact.prevent="openConfirm"
            >
              {{ VTTG_COMPENDIUM_SUBMIT_LABEL }}
            </UButton>
          </div>
        </UCard>
      </template>
    </div>

    <ConfirmDialog
      v-model:open="isConfirmOpen"
      :title="VTTG_COMPENDIUM_CONFIRM_TITLE"
      :description="confirmDescription"
      :confirm-label="VTTG_COMPENDIUM_SUBMIT_LABEL"
      confirm-color="warning"
      :confirm-icon="VTTG_COMPENDIUM_SUBMIT_ICON"
      :loading="isSaving"
      @confirm="handleConfirm"
    />
  </NuxtLayout>
</template>
