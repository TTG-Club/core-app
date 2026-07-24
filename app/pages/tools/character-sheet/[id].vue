<script setup lang="ts">
  import { Role } from '~/shared/types';
  import { CharacterSheetBody } from '~character-sheet/body';
  import {
    useCharacterSheetAutosave,
    useCharacterSheetLoader,
  } from '~character-sheet/composables';
  import {
    CHARACTER_SHEET_ROUTE,
    CHARACTER_SHEET_TITLE,
  } from '~character-sheet/model';
  import { UiResult } from '~ui/result';

  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  useSeoMeta({
    title: CHARACTER_SHEET_TITLE,
    robots: 'noindex, nofollow',
  });

  const route = useRoute();

  // Защитная проверка параметра маршрута: массив или пустая строка → ''.
  const sheetId = computed(() => {
    const { id } = route.params;

    return typeof id === 'string' && id ? id : '';
  });

  const { status, load } = useCharacterSheetLoader(sheetId);

  useCharacterSheetAutosave();

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
      <div
        v-if="status === 'pending' || status === 'idle'"
        class="flex justify-center py-16"
      >
        <UIcon
          name="tabler:loader-2"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <UiResult
        v-else-if="status === 'notFound'"
        status="404"
        title="Лист не найден"
        sub-title="Возможно, он был удалён или принадлежит другому пользователю"
      >
        <template #extra>
          <UButton :to="CHARACTER_SHEET_ROUTE"> К списку листов </UButton>
        </template>
      </UiResult>

      <UiResult
        v-else-if="status === 'error'"
        status="error"
        title="Не удалось загрузить лист"
      >
        <template #extra>
          <UButton @click.left.exact.prevent="load"> Повторить </UButton>
        </template>
      </UiResult>

      <CharacterSheetBody
        v-else
        @close="handleClose"
      />

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
