<script setup lang="ts">
  import { Role } from '~/shared/types';
  import { CharacterSheetBody } from '~character-sheet/body';
  import {
    CHARACTER_SHEET_ROUTE,
    CHARACTER_SHEET_TITLE,
  } from '~character-sheet/model';

  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  useSeoMeta({
    title: CHARACTER_SHEET_TITLE,
    robots: 'noindex, nofollow',
  });

  /** Закрытие листа возвращает к списку листов персонажей. */
  function handleClose() {
    navigateTo(CHARACTER_SHEET_ROUTE);
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="CHARACTER_SHEET_TITLE"
  >
    <ClientOnly>
      <CharacterSheetBody @close="handleClose" />

      <template #fallback>
        <div class="flex justify-center py-16">
          <UIcon
            name="tabler:loader-2"
            class="size-8 animate-spin text-muted"
          />
        </div>
      </template>
    </ClientOnly>
  </NuxtLayout>
</template>
