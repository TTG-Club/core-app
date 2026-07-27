<script setup lang="ts">
  import { USER_TOKEN_COOKIE } from '#shared/consts';
  import {
    CharacterSheetBody,
    CharacterSheetSkeleton,
  } from '~character-sheet/body';
  import {
    useCharacterSheetAutosave,
    useCharacterSheetDetail,
    useCharacterSheetLoader,
  } from '~character-sheet/composables';
  import { CharacterSheetControls } from '~character-sheet/controls';
  import { CharacterSheetList } from '~character-sheet/list';
  import {
    CHARACTER_SHEET_LIST_TITLE,
    SHEET_LOGIN_PROMPT,
    SHEET_NOT_FOUND_SUBTITLES,
  } from '~character-sheet/model';
  import { UiResult } from '~ui/result';
  import { AuthModal } from '~user/auth-modal';

  // Без definePageMeta с `auth`: пункт «Лист персонажа» в меню и на главной
  // виден всем, поэтому и страница открывается анониму. Приватное содержимое
  // (список, импорт, панель деталей) остаётся за сессией — анониму вместо него
  // показывается приглашение войти.
  useSeoMeta({
    title: CHARACTER_SHEET_LIST_TITLE,
  });

  // Сессию решает кука токена, а не профиль: профиль догружается лениво уже
  // после монтирования, и залогиненный успевал бы увидеть приглашение войти.
  // Кука известна и на SSR, поэтому разметка сервера и клиента совпадает.
  const token = useCookie<string | null>(USER_TOKEN_COOKIE);

  const { isLoggedIn } = useUser();

  const hasSession = computed(() => isLoggedIn.value || Boolean(token.value));

  const isAuthOpen = ref(false);

  // Вход и выход меняют куку: и через общую модалку в шлеме сайта (там
  // меняется isLoggedIn), и через локальное окно (о конце входа говорит его
  // закрытие). Без сброса кэш `useCookie` помнит состояние на момент гидрации,
  // и приглашение не сменилось бы списком листов. Цикла нет: вотчер меняет
  // только кэш куки, на свои источники он не влияет.
  watch([isLoggedIn, isAuthOpen], () => {
    refreshCookie(USER_TOKEN_COOKIE);
  });

  /** Открывает окно входа из приглашения. */
  function openAuth(): void {
    isAuthOpen.value = true;
  }

  // Панель показывает и свои листы (`?detail=<id>`), и чужие, сохранённые по
  // ссылке (`?detail=shared:<token>`): загрузчику хватает цели и режима.
  const {
    detailTarget,
    isSharedDetail,
    isDetailOpen,
    detailPagePath,
    closeDetail,
  } = useCharacterSheetDetail();

  const { status: detailStatus, load: reloadDetail } = useCharacterSheetLoader(
    detailTarget,
    { shared: isSharedDetail },
  );

  // Правок в чужом листе не бывает: автосейв сам молчит в режиме просмотра.
  useCharacterSheetAutosave();

  const detailNotFoundSubtitle = computed(() =>
    isSharedDetail.value
      ? SHEET_NOT_FOUND_SUBTITLES.shared
      : SHEET_NOT_FOUND_SUBTITLES.own,
  );

  /** Открывает выбранный лист на отдельной странице. */
  function handleExpand() {
    navigateTo(detailPagePath.value);
  }
</script>

<template>
  <NuxtLayout
    name="section"
    :title="CHARACTER_SHEET_LIST_TITLE"
  >
    <!-- Импорт живёт там же, где в остальных разделах фильтры: под названием
      раздела. Действия над конкретным листом остаются в меню его карточки.
      Анониму слот не отдаётся: импорт — та же приватная ручка создания. -->
    <template
      v-if="hasSession"
      #controls
    >
      <ClientOnly>
        <CharacterSheetControls />

        <template #fallback>
          <div class="flex flex-col gap-2">
            <USkeleton class="h-8 w-full rounded-md" />

            <USkeleton class="h-3 w-3/4 rounded-sm" />
          </div>
        </template>
      </ClientOnly>
    </template>

    <template #default>
      <!-- Приглашение рендерится и на сервере: страница публичная, сессия
        известна по куке уже на SSR — анониму не мигает спиннер. -->
      <UiResult
        v-if="!hasSession"
        status="info"
        :title="SHEET_LOGIN_PROMPT.title"
        :sub-title="SHEET_LOGIN_PROMPT.subtitle"
      >
        <template #extra>
          <UButton
            icon="tabler:user"
            @click.left.exact.prevent="openAuth"
          >
            {{ SHEET_LOGIN_PROMPT.action }}
          </UButton>
        </template>
      </UiResult>

      <ClientOnly v-else>
        <CharacterSheetList />

        <template #fallback>
          <div class="flex justify-center py-16">
            <UIcon
              name="tabler:loader-2"
              class="size-8 animate-spin text-muted"
            />
          </div>
        </template>
      </ClientOnly>

      <AuthModal v-model="isAuthOpen" />
    </template>

    <!-- Правой панели у анонима нет вовсе: без слота layout не включает
      трёхколоночный режим, и приглашение занимает всю ширину. -->
    <template
      v-if="hasSession"
      #detail
    >
      <ClientOnly>
        <div
          v-if="isDetailOpen"
          class="flex h-full flex-col overflow-y-auto p-4"
        >
          <CharacterSheetSkeleton v-if="detailStatus === 'pending'" />

          <UiResult
            v-else-if="detailStatus === 'notFound'"
            status="404"
            title="Лист не найден"
            :sub-title="detailNotFoundSubtitle"
          >
            <template #extra>
              <UButton @click.left.exact.prevent="closeDetail">
                К списку листов
              </UButton>
            </template>
          </UiResult>

          <UiResult
            v-else-if="detailStatus === 'error'"
            status="error"
            title="Не удалось загрузить лист"
          >
            <template #extra>
              <UButton @click.left.exact.prevent="reloadDetail">
                Повторить
              </UButton>
            </template>
          </UiResult>

          <CharacterSheetBody
            v-else-if="detailStatus === 'ready'"
            can-expand
            @close="closeDetail"
            @expand="handleExpand"
          />
        </div>

        <div
          v-else
          class="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
        >
          <div class="flex max-w-xs flex-col items-center gap-3">
            <UIcon
              name="tabler:click"
              class="size-10 text-muted"
            />

            <h3 class="text-lg font-semibold text-highlighted">
              Лист не выбран
            </h3>

            <p class="text-sm text-secondary">
              Выберите лист персонажа из списка слева, чтобы открыть его здесь
            </p>
          </div>
        </div>
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
