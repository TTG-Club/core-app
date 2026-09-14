<script setup lang="ts">
  import { useHomeHeroEditor } from '~admin/home-hero/composables';
  import {
    getHomeHeroPreviewSrc,
    HOME_HERO_ADMIN_PAGE_TITLE,
    HOME_HERO_ADMIN_SEO_TITLE,
    HOME_HERO_CURRENT_TITLE,
    HOME_HERO_DEFAULT_LABEL,
    HOME_HERO_DISCARD_LABEL,
    HOME_HERO_MEDIA_KIND_LABELS,
    HOME_HERO_OPEN_FILE_LABEL,
    HOME_HERO_PREVIEW_CURRENT_HINT,
    HOME_HERO_PREVIEW_DRAFT_HINT,
    HOME_HERO_PREVIEW_PRIMARY_DEVICE,
    HOME_HERO_PREVIEW_SECONDARY_DEVICES,
    HOME_HERO_PREVIEW_TITLE,
    HOME_HERO_PUBLISH_LABEL,
    HOME_HERO_RESET_DIALOG_DESCRIPTION,
    HOME_HERO_RESET_DIALOG_TITLE,
    HOME_HERO_RESET_LABEL,
    HOME_HERO_UPLOAD_ACCEPT,
    HOME_HERO_UPLOAD_DESCRIPTION,
    HOME_HERO_UPLOAD_LABEL,
  } from '~admin/home-hero/model';
  import { HomeHeroDevicePreview } from '~admin/home-hero/ui';
  import { ConfirmDialog } from '~initiative/ui-kit';

  useSeoMeta({
    title: HOME_HERO_ADMIN_SEO_TITLE,
  });

  const {
    savedMedia,
    savedRevision,
    draftFile,
    draftMedia,
    isPublishing,
    isResetting,
    selectDraft,
    discardDraft,
    publish,
    reset,
  } = useHomeHeroEditor();

  const isResetDialogOpen = ref(false);

  const currentLabel = computed(() =>
    savedMedia.value
      ? HOME_HERO_MEDIA_KIND_LABELS[savedMedia.value.kind]
      : HOME_HERO_DEFAULT_LABEL,
  );

  const previewSrc = computed(() => getHomeHeroPreviewSrc(draftMedia.value));

  const previewHint = computed(() =>
    draftMedia.value
      ? HOME_HERO_PREVIEW_DRAFT_HINT
      : HOME_HERO_PREVIEW_CURRENT_HINT,
  );

  /** Спрашивает подтверждение перед возвратом карты. */
  function openResetDialog(): void {
    isResetDialogOpen.value = true;
  }

  /** Возвращает карту; при ошибке диалог остаётся открытым для повтора. */
  async function handleResetConfirm(): Promise<void> {
    if (await reset()) {
      isResetDialogOpen.value = false;
    }
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="HOME_HERO_ADMIN_PAGE_TITLE"
  >
    <div class="space-y-6">
      <UCard variant="subtle">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="min-w-0">
              <h2 class="truncate text-base text-highlighted">
                {{ HOME_HERO_CURRENT_TITLE }}
              </h2>

              <p class="text-sm text-muted">
                {{ currentLabel }}
              </p>
            </div>

            <div
              v-if="savedMedia"
              class="flex shrink-0 items-center gap-2"
            >
              <UButton
                size="sm"
                color="neutral"
                variant="subtle"
                icon="tabler:external-link"
                :href="savedMedia.url"
                target="_blank"
              >
                {{ HOME_HERO_OPEN_FILE_LABEL }}
              </UButton>

              <UButton
                size="sm"
                color="error"
                variant="subtle"
                icon="tabler:arrow-back-up"
                :loading="isResetting"
                @click.left.exact.prevent="openResetDialog"
              >
                {{ HOME_HERO_RESET_LABEL }}
              </UButton>
            </div>
          </div>
        </template>

        <div class="flex flex-col gap-4">
          <UFileUpload
            :model-value="draftFile"
            :accept="HOME_HERO_UPLOAD_ACCEPT"
            :label="HOME_HERO_UPLOAD_LABEL"
            :description="HOME_HERO_UPLOAD_DESCRIPTION"
            :preview="false"
            :disabled="isPublishing"
            icon="tabler:upload"
            class="min-h-36 w-full"
            @update:model-value="selectDraft"
          />

          <div
            v-if="draftFile"
            class="flex flex-wrap items-center justify-between gap-2"
          >
            <span class="min-w-0 truncate text-sm text-default">
              {{ draftFile.name }}
            </span>

            <div class="flex shrink-0 items-center gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="isPublishing"
                @click.left.exact.prevent="discardDraft"
              >
                {{ HOME_HERO_DISCARD_LABEL }}
              </UButton>

              <UButton
                icon="tabler:check"
                :loading="isPublishing"
                @click.left.exact.prevent="publish"
              >
                {{ HOME_HERO_PUBLISH_LABEL }}
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <section class="flex flex-col gap-4">
        <div>
          <h2 class="text-base text-highlighted">
            {{ HOME_HERO_PREVIEW_TITLE }}
          </h2>

          <p class="text-sm text-muted">
            {{ previewHint }}
          </p>
        </div>

        <!-- Каждый фрейм поднимает приложение сайта — только в браузере, где
          есть и размеры колонки, и локальная ссылка на черновик -->
        <ClientOnly>
          <HomeHeroDevicePreview
            :device="HOME_HERO_PREVIEW_PRIMARY_DEVICE"
            :src="previewSrc"
            :revision="savedRevision"
          />

          <div
            class="grid grid-cols-1 items-start gap-4 md:grid-cols-[2fr_2fr_1fr]"
          >
            <HomeHeroDevicePreview
              v-for="device in HOME_HERO_PREVIEW_SECONDARY_DEVICES"
              :key="device.id"
              :device
              :src="previewSrc"
              :revision="savedRevision"
            />
          </div>
        </ClientOnly>
      </section>
    </div>

    <ConfirmDialog
      v-model:open="isResetDialogOpen"
      :title="HOME_HERO_RESET_DIALOG_TITLE"
      :description="HOME_HERO_RESET_DIALOG_DESCRIPTION"
      :confirm-label="HOME_HERO_RESET_LABEL"
      confirm-color="error"
      confirm-icon="tabler:arrow-back-up"
      :loading="isResetting"
      @confirm="handleResetConfirm"
    />
  </NuxtLayout>
</template>
