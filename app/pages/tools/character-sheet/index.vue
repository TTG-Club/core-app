<script setup lang="ts">
  import { Role } from '~/shared/types';
  import { CharacterSheetBody } from '~character-sheet/body';
  import { CHARACTER_SHEET_TITLE } from '~character-sheet/model';

  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  useSeoMeta({
    title: CHARACTER_SHEET_TITLE,
  });
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="CHARACTER_SHEET_TITLE"
  >
    <ClientOnly>
      <CharacterSheetBody />

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
