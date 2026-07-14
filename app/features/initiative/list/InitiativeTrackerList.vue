<script setup lang="ts">
  import { USER_TOKEN_COOKIE } from '#shared/consts';
  import {
    useInitiativeStorage,
    useTrackerList,
  } from '~initiative/composables';
  import {
    createTracker,
    getFetchStatus,
    getTrackerErrorMessage,
    INITIATIVE_TOOL_ROUTE,
    MAX_AUTHORIZED_TRACKERS,
  } from '~initiative/model';
  import { UiResult } from '~ui/result';
  import { AuthModal } from '~user/auth-modal';

  import { TrackerCreateCard, TrackerListItem } from './ui';

  const toast = useToast();
  const token = useCookie<string | null>(USER_TOKEN_COOKIE);
  const isAuthorized = computed(() => Boolean(token.value));

  const { slot, saveSlot } = useInitiativeStorage();

  const {
    activeTrackers,
    deletedTrackers,
    canCreate,
    isLoading,
    isMutating,
    loadError,
    load,
    create,
    rename,
    remove,
  } = useTrackerList();

  const isCreatingAnon = ref(false);
  // Авто-создание анонимного боя упало — показываем ручную форму-фолбэк.
  const autoCreateFailed = ref(false);
  const showHistory = ref(false);

  const isAuthOpen = ref(false);

  const isListAuthError = computed(
    () => getFetchStatus(loadError.value) === 401,
  );

  const listErrorResultStatus = computed<'info' | 'error'>(() =>
    isListAuthError.value ? 'info' : 'error',
  );

  const listErrorTitle = computed(() =>
    isListAuthError.value
      ? 'Требуется авторизация'
      : 'Не удалось загрузить трекеры',
  );

  const listErrorSubTitle = computed(() =>
    isListAuthError.value
      ? 'Войдите, чтобы увидеть свои трекеры'
      : getTrackerErrorMessage(loadError.value),
  );

  const refreshButtonVariant = computed<'soft' | 'solid'>(() =>
    isListAuthError.value ? 'soft' : 'solid',
  );

  // Счётчик боёв краснеет на достигнутом лимите. Логика вынесена из шаблона.
  const trackerCountColorClass = computed(() =>
    canCreate.value ? 'text-muted' : 'text-error',
  );

  const countTooltip = computed(
    () =>
      `Активных боёв — ${activeTrackers.value.length} из ${MAX_AUTHORIZED_TRACKERS} возможных`,
  );

  function openAuth(): void {
    isAuthOpen.value = true;
  }

  // После закрытия окна входа перезагружаем список: при успешном логине кука
  // обновилась, и серверный прокси подставит новый токен.
  watch(isAuthOpen, (open) => {
    if (!open) {
      load();
    }
  });

  // Анонимный поток: если слот уже занят — уводим на его единственный трекер;
  // если боя ещё нет — сразу создаём трекер и открываем сборку энкаунтера
  // (аноним никогда не видит список). Авторизованному — грузим список.
  onMounted(() => {
    if (isAuthorized.value) {
      load();

      return;
    }

    if (slot.value) {
      navigateTo(`${INITIATIVE_TOOL_ROUTE}/${slot.value.trackerId}`, {
        replace: true,
      });

      return;
    }

    openAnonTracker('', true);
  });

  function openTracker(id: string): void {
    navigateTo(`${INITIATIVE_TOOL_ROUTE}/${id}`);
  }

  async function handleAuthorizedCreate(name: string): Promise<void> {
    const created = await create(name || undefined);

    if (created) {
      navigateTo(`${INITIATIVE_TOOL_ROUTE}/${created.id}`);
    }
  }

  /**
   * Создаёт анонимный бой и открывает сборку. При старте страницы вызывается
   * автоматически (`replace: true`); при ручном фолбэке после ошибки — из формы.
   * @param name Имя боя (может быть пустым — бэк подставит дефолт).
   * @param replace Заменять ли текущую запись истории (авто-открытие на старте).
   */
  async function openAnonTracker(
    name: string,
    replace: boolean,
  ): Promise<void> {
    isCreatingAnon.value = true;
    autoCreateFailed.value = false;

    try {
      const created = await createTracker(name || undefined);

      if (!created.accessKey) {
        toast.add({
          title: 'Не удалось создать трекер',
          description: 'Сервер не вернул ключ доступа.',
          color: 'error',
          icon: 'tabler:alert-triangle',
        });

        autoCreateFailed.value = true;

        return;
      }

      saveSlot(created.id, created.accessKey);
      await navigateTo(`${INITIATIVE_TOOL_ROUTE}/${created.id}`, { replace });
    } catch (error) {
      toast.add({
        title: 'Не удалось создать трекер',
        description: getTrackerErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });

      autoCreateFailed.value = true;
    } finally {
      isCreatingAnon.value = false;
    }
  }

  function handleCreate(name: string): void {
    if (isAuthorized.value) {
      handleAuthorizedCreate(name);
    } else {
      openAnonTracker(name, false);
    }
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Анонимный пользователь: сразу открываем/создаём бой, без списка -->
    <template v-if="!isAuthorized">
      <!-- Идёт редирект в свой бой или авто-создание нового -->
      <div
        v-if="!autoCreateFailed"
        class="flex flex-col items-center gap-3 py-16"
      >
        <UIcon
          name="tabler:loader-2"
          class="size-8 animate-spin text-muted"
        />

        <p class="text-sm text-muted">
          {{ slot ? 'Открываем ваш трекер…' : 'Готовим новый бой…' }}
        </p>
      </div>

      <!-- Авто-создание упало — ручной фолбэк -->
      <TrackerCreateCard
        v-else
        heading="Не удалось начать бой"
        description="Попробуйте ещё раз — создадим трекер и откроем сборку энкаунтера."
        submit-label="Собрать бой"
        hide-name
        :loading="isCreatingAnon"
        @create="handleCreate"
      >
        <template #footer>
          <p class="text-xs text-muted">
            Без регистрации — доступен один активный бой.
          </p>
        </template>
      </TrackerCreateCard>
    </template>

    <!-- Авторизованный пользователь -->
    <template v-else>
      <!-- Герой: создание нового боя — не ждёт загрузки списка -->
      <TrackerCreateCard
        heading="Собрать бой"
        description="Соберите игроков и существ, прокиньте инициативу — и ведите бой по ходам."
        submit-label="Собрать бой"
        hide-name
        :loading="isMutating"
        :disabled="!canCreate"
        @create="handleCreate"
      >
        <template #footer>
          <p
            v-if="!canCreate"
            class="text-xs text-error"
          >
            Достигнут лимит {{ MAX_AUTHORIZED_TRACKERS }} трекеров — удалите
            один, чтобы собрать новый.
          </p>
        </template>
      </TrackerCreateCard>

      <!-- Второй план: список трекеров (тихий, приглушённый) -->
      <div
        v-if="isLoading"
        class="flex flex-col gap-2"
      >
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          Ваши бои
        </span>

        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-12 w-full rounded-lg"
        />
      </div>

      <UiResult
        v-else-if="loadError"
        :status="listErrorResultStatus"
        :title="listErrorTitle"
        :sub-title="listErrorSubTitle"
      >
        <template #extra>
          <UButton
            v-if="isListAuthError"
            icon="tabler:user"
            @click.left.exact.prevent="openAuth"
          >
            Войти
          </UButton>

          <UButton
            :variant="refreshButtonVariant"
            @click.left.exact.prevent="load"
          >
            Обновить
          </UButton>
        </template>
      </UiResult>

      <template v-else>
        <section
          v-if="activeTrackers.length"
          class="flex flex-col gap-2"
        >
          <div class="flex items-center gap-2">
            <span
              class="text-xs font-medium tracking-wide text-muted uppercase"
            >
              Ваши бои
            </span>

            <span class="flex items-center gap-1 text-xs tabular-nums">
              <span :class="trackerCountColorClass">
                {{ activeTrackers.length }} / {{ MAX_AUTHORIZED_TRACKERS }}
              </span>

              <UTooltip :text="countTooltip">
                <UIcon
                  name="tabler:help-circle-filled"
                  class="size-3.5 shrink-0 text-muted"
                />
              </UTooltip>
            </span>
          </div>

          <div class="flex flex-col gap-1.5">
            <TrackerListItem
              v-for="tracker in activeTrackers"
              :key="tracker.id"
              :tracker="tracker"
              :disabled="isMutating"
              @open="openTracker"
              @rename="rename"
              @remove="remove"
            />
          </div>
        </section>

        <p
          v-else
          class="text-sm text-muted"
        >
          Здесь появятся собранные бои.
        </p>

        <!-- История боёв — свёрнута, во втором плане -->
        <UCollapsible
          v-if="deletedTrackers.length"
          v-model:open="showHistory"
        >
          <UButton
            icon="tabler:history"
            :trailing-icon="
              showHistory ? 'tabler:chevron-up' : 'tabler:chevron-down'
            "
            color="neutral"
            variant="ghost"
            block
            class="justify-between text-muted"
          >
            <span class="flex items-center gap-1.5">
              История боёв ({{ deletedTrackers.length }})

              <UTooltip
                text="Удалённые бои — доступны только для просмотра, без редактирования"
              >
                <UIcon
                  name="tabler:help-circle-filled"
                  class="size-4 shrink-0"
                />
              </UTooltip>
            </span>
          </UButton>

          <template #content>
            <div class="flex flex-col gap-1.5 pt-2">
              <TrackerListItem
                v-for="tracker in deletedTrackers"
                :key="tracker.id"
                :tracker="tracker"
                readonly
              />
            </div>
          </template>
        </UCollapsible>
      </template>
    </template>

    <AuthModal v-model="isAuthOpen" />
  </div>
</template>
