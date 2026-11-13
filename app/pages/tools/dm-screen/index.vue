<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import { DmScreenBoard } from '~dm-screen/board';
  import { useDmScreenSession } from '~dm-screen/composables';
  import {
    DM_SCREEN_ICON,
    DM_SCREEN_ICONS,
    DM_SCREEN_SEO,
    DM_SCREEN_TEXT,
  } from '~dm-screen/model';
  import { AuthModal } from '~user/auth-modal';

  useSeoMeta({
    title: DM_SCREEN_SEO.title,
    description: DM_SCREEN_SEO.description,
  });

  // Гостю — ширма из браузера, вошедшему — из аккаунта. Модель живёт в
  // браузере, поэтому вся страница рисуется только на клиенте
  const { status, isAuthorized, load, switchToLocal } = useDmScreenSession();

  const isLoading = computed(() => status.value === 'loading');
  const isFailed = computed(() => status.value === 'failed');

  const failedActions = computed<Array<ButtonProps>>(() => [
    { label: DM_SCREEN_TEXT.retry, onClick: load },
    {
      label: DM_SCREEN_TEXT.useLocal,
      color: 'neutral',
      variant: 'outline',
      onClick: switchToLocal,
    },
  ]);

  // Гостю пустая ширма предлагает войти
  const isGuest = computed(() => !isAuthorized.value);

  const isAuthOpen = ref(false);

  /** Открывает окно входа. */
  function openAuth(): void {
    isAuthOpen.value = true;
  }
</script>

<template>
  <ClientOnly>
    <div
      v-if="isLoading"
      class="flex min-h-dvh items-center justify-center"
    >
      <UIcon
        :name="DM_SCREEN_ICONS.loading"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <UEmpty
      v-else-if="isFailed"
      :icon="DM_SCREEN_ICON"
      :title="DM_SCREEN_TEXT.loadFailed"
      :description="DM_SCREEN_TEXT.loadFailedDescription"
      :actions="failedActions"
      class="m-auto min-h-dvh"
    />

    <DmScreenBoard v-else>
      <template
        v-if="isGuest"
        #emptyNote
      >
        <p class="text-center text-sm text-muted">
          {{ DM_SCREEN_TEXT.guestHint }}
        </p>

        <UButton
          :icon="DM_SCREEN_ICONS.signIn"
          :label="DM_SCREEN_TEXT.signIn"
          color="neutral"
          variant="outline"
          @click.left.exact.prevent="openAuth"
        />
      </template>
    </DmScreenBoard>

    <AuthModal v-model="isAuthOpen" />

    <template #fallback>
      <div class="flex min-h-dvh items-center justify-center">
        <UIcon
          :name="DM_SCREEN_ICONS.loading"
          class="size-8 animate-spin text-muted"
        />
      </div>
    </template>
  </ClientOnly>
</template>
