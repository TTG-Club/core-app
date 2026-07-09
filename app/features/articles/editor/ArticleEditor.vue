<script setup lang="ts">
  import type { FormErrorEvent } from '#ui/types';

  import type {
    ArticlePublishChannel,
    ArticlePublishMode,
    ArticlePubState,
    ArticleRequest,
  } from '../model';

  import { MarkupEditor } from '~ui/markup-editor';
  import { UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';

  import {
    ARTICLE_FALLBACK_IMAGE,
    ARTICLE_IMAGE_MAX_SIZE,
    ARTICLE_IMAGE_SECTION,
    ARTICLE_POST_CHAR_TARGET_DISCORD,
    ARTICLE_POST_CHAR_TARGET_NO_IMAGE,
    ARTICLE_POST_CHAR_TARGET_WITH_IMAGE,
    ARTICLE_PUB_STATE_OPTIONS,
    ARTICLE_PUBLISH_CHANNELS,
    ARTICLE_PUBLISH_MODES,
    ARTICLE_TYPE_DEFAULT,
    ARTICLE_TYPE_OPTIONS,
    ARTICLES_ADMIN_ROUTE,
    ARTICLES_API_PATH,
    getArticlePreviewText,
    getArticleRoute,
  } from '../model';
  import { ArticlePreview } from '../preview';
  import { ArticlePublishDateField, ArticleSlugField } from './ui';

  const formRef = useTemplateRef('formRef');

  // Режим активной публикации: сразу / по расписанию. Актуален только когда
  // запись активна. Инициализируется по загруженной записи (watch ниже).
  const mode = ref<ArticlePublishMode>('now');

  const previewOpened = ref(false);

  // Идёт сохранение — для индикации загрузки на кнопке.
  const isSubmitting = ref(false);

  function getInitialState(): ArticleRequest {
    return {
      url: '',
      type: ARTICLE_TYPE_DEFAULT,
      draft: false,
      active: true,
      accessibleByLink: false,
      publishToTelegram: false,
      publishToDiscord: false,
      publishToVk: false,
      title: '',
      previewImageUrl: null,
      publishDateTime: null,
      preview: '',
      content: '',
    };
  }

  const { state, submitState, previousState, onSubmit, onError } =
    useWorkshopForm<ArticleRequest>({
      actionUrl: ARTICLES_API_PATH,
      getInitialState,
      // Бэк отдаёт пустой анонс из `/raw` как `null` (toMerged не гасит null,
      // а `defineModel({ default: '' })` подставляет дефолт только на undefined),
      // из-за чего `state.preview` остаётся null и PUT падает на `@NotNull`.
      // Нормализуем при загрузке к пустой строке. `publishToTelegram`,
      // `publishToDiscord` и `publishToVk` также страхуем на случай null у
      // записей до миграции бэка.
      normalizeLoaded: (raw) => ({
        ...raw,
        preview: raw.preview ?? '',
        publishToTelegram: raw.publishToTelegram ?? false,
        publishToDiscord: raw.publishToDiscord ?? false,
        publishToVk: raw.publishToVk ?? false,
      }),
      transformBeforeSubmit: (formState) => {
        const isActivePublish = !formState.draft && formState.active;
        const isInactive = !formState.draft && !formState.active;

        return {
          ...formState,
          // Дату шлём только для отложенной активной публикации; иначе — null
          // (для «сейчас» её ставит сервер, для черновика/неактивной не нужна).
          publishDateTime:
            isActivePublish && mode.value === 'schedule'
              ? formState.publishDateTime
              : null,
          // «Доступна по ссылке» актуальна только для неактивной опубликованной
          // записи — в остальных состояниях не тащим устаревший флаг в тело.
          accessibleByLink: isInactive ? formState.accessibleByLink : false,
        };
      },
    });

  // Анонс по умолчанию свёрнут (не мешает при заполнении) — разворачивается по
  // клику в шапке блока.
  const isPreviewOpen = ref(false);

  // Счётчик длины поста для соцсетей: суммарный plain-text (без разметки {@...})
  // анонса и содержания — примерно столько символов уйдёт в пост. Разбор разметки
  // тяжеловат на каждое нажатие, поэтому дебаунсим.
  const previewCharCount = ref(0);
  const contentCharCount = ref(0);

  watchDebounced(
    () => [state.value.preview, state.value.content] as const,
    ([preview, content]) => {
      previewCharCount.value = getArticlePreviewText(preview).length;
      contentCharCount.value = getArticlePreviewText(content).length;
    },
    { debounce: 200, immediate: true },
  );

  const postCharCount = computed(
    () => previewCharCount.value + contentCharCount.value,
  );

  // Блок счётчика для соцсетей показываем, только когда выбран хотя бы один канал
  // отправки — без выбора он не о чём.
  const showSocialStats = computed(
    () => state.value.publishToTelegram || state.value.publishToDiscord,
  );

  // Желательный максимум для Telegram зависит от обложки: пост с картинкой =
  // подпись к медиа (короче), без картинки = текстовый пост (длиннее). У Discord
  // порог единый при любом раскладе. Лимиты не жёсткие — только подсветка.
  const hasCover = computed(() => !!state.value.previewImageUrl);

  const telegramTarget = computed(() =>
    hasCover.value
      ? ARTICLE_POST_CHAR_TARGET_WITH_IMAGE
      : ARTICLE_POST_CHAR_TARGET_NO_IMAGE,
  );

  const discordTarget = ARTICLE_POST_CHAR_TARGET_DISCORD;

  // Подсказка к порогу Telegram: текущий сценарий (по обложке) + напоминание про
  // альтернативный лимит. Лимит зависит от обложки: подпись к медиа короче.
  const telegramHint = computed(() =>
    hasCover.value
      ? `с картинкой; без картинки — до ${ARTICLE_POST_CHAR_TARGET_NO_IMAGE}`
      : `без картинки; с картинкой — до ${ARTICLE_POST_CHAR_TARGET_WITH_IMAGE}`,
  );

  const isOverTelegramTarget = computed(
    () => postCharCount.value > telegramTarget.value,
  );

  const isOverDiscordTarget = computed(
    () => postCharCount.value > discordTarget,
  );

  const hasPreviewText = computed(() => previewCharCount.value > 0);

  const $toast = useToast();
  const route = useRoute();

  // Собственный url записи при редактировании — чтобы проверка доступности slug
  // не считала его занятым.
  const currentUrl = computed(() =>
    typeof route.params.url === 'string' && route.params.url
      ? route.params.url
      : undefined,
  );

  // Мост null ↔ undefined: DTO хранит previewImageUrl как string | null,
  // а UploadImage работает со string | undefined.
  const coverModel = computed<string | undefined>({
    get: () => state.value.previewImageUrl ?? undefined,
    set: (value) => {
      state.value.previewImageUrl = value ?? null;
    },
  });

  // Единое состояние публикации ↔ два независимых флага (draft/active).
  const pubState = computed<ArticlePubState>({
    get: () => {
      if (state.value.draft) {
        return 'draft';
      }

      return state.value.active ? 'active' : 'inactive';
    },
    set: (value) => {
      state.value.draft = value === 'draft';
      state.value.active = value === 'active';
    },
  });

  // Биндинг режима «сейчас/запланировать» для UTabs: типизированный сеттер (без
  // каста string→union). При выборе «сейчас» очищаем дату и в state (а не только в
  // отправляемом теле): иначе смена ТОЛЬКО режима у уже запланированной записи не
  // мутирует state, isFormEdited=false, и сохранение молча отклоняется.
  const publishMode = computed<ArticlePublishMode>({
    get: () => mode.value,
    set: (value) => {
      mode.value = value;

      if (value === 'now') {
        state.value.publishDateTime = null;
      }
    },
  });

  // Режим «сейчас/запланировать» инициализируем по загруженной записи: активная
  // запись с будущей датой = запланирована. previousState меняется только при
  // загрузке из /raw и на старте создания.
  watch(
    () =>
      [
        previousState.value.draft,
        previousState.value.active,
        previousState.value.publishDateTime,
      ] as const,
    ([draft, active, date]) => {
      const isFuture = !!date && new Date(date).getTime() > Date.now();

      mode.value = !draft && active && isFuture ? 'schedule' : 'now';
    },
    { immediate: true },
  );

  const mainActionLabel = computed(() => {
    if (pubState.value === 'draft') {
      return 'Сохранить черновик';
    }

    if (pubState.value === 'inactive') {
      return 'Сохранить';
    }

    return mode.value === 'now' ? 'Опубликовать' : 'Запланировать';
  });

  const { copy } = useCopyAndShare();

  // Кнопку ссылки-предпросмотра показываем, когда СУЩЕСТВУЮЩАЯ запись переведена
  // в «Неактивна» + «Доступна по ссылке» (живой выбор). Реально ссылка откроется
  // (200), когда эти флаги СОХРАНЕНЫ — до сохранения бэк может вернуть 404.
  const canCopyPreviewLink = computed(
    () =>
      !!currentUrl.value
      && pubState.value === 'inactive'
      && state.value.accessibleByLink,
  );

  function copyPreviewLink(): void {
    if (!currentUrl.value) {
      return;
    }

    copy(`${getOrigin()}${getArticleRoute(currentUrl.value)}`);
  }

  // Тумблер одного канала кросс-постинга (по ключу флага в state).
  function toggleChannel(channel: ArticlePublishChannel): void {
    state.value[channel] = !state.value[channel];
  }

  // «Везде» — выбраны все каналы сразу. Клик включает все, повторный (когда уже
  // все выбраны) — снимает все.
  const allChannelsSelected = computed(() =>
    ARTICLE_PUBLISH_CHANNELS.every((channel) => state.value[channel.key]),
  );

  function toggleAllChannels(): void {
    const next = !allChannelsSelected.value;

    for (const channel of ARTICLE_PUBLISH_CHANNELS) {
      state.value[channel.key] = next;
    }
  }

  // Вид кнопки-тумблера: solid/primary во включённом состоянии, soft/neutral в
  // выключенном. Подсветку держим в computed, чтобы в шаблоне не было тернарников
  // (правило проекта). Явные литеральные типы — иначе значения расширятся до string.
  type ToggleAppearance = {
    variant: 'solid' | 'soft';
    color: 'primary' | 'neutral';
  };

  // Описатели кнопок каналов: конфиг канала + текущее состояние + подсветка.
  const channelButtons = computed<
    Array<
      ToggleAppearance & {
        key: ArticlePublishChannel;
        label: string;
        icon: string;
        active: boolean;
      }
    >
  >(() =>
    ARTICLE_PUBLISH_CHANNELS.map((channel) => {
      const active = state.value[channel.key];

      return {
        ...channel,
        active,
        variant: active ? 'solid' : 'soft',
        color: active ? 'primary' : 'neutral',
      };
    }),
  );

  // Та же подсветка для кнопки «Везде» — по признаку «выбраны все каналы».
  const allChannelsButton = computed<ToggleAppearance>(() => ({
    variant: allChannelsSelected.value ? 'solid' : 'soft',
    color: allChannelsSelected.value ? 'primary' : 'neutral',
  }));

  const schema = z.object({
    title: z.string().trim().nonempty(),
    url: z.string().trim().nonempty(),
    type: z.enum(['NEWS', 'ARTICLE']),
    draft: z.boolean(),
    active: z.boolean(),
    accessibleByLink: z.boolean(),
    publishToTelegram: z.boolean(),
    publishToDiscord: z.boolean(),
    publishToVk: z.boolean(),
    // Анонс необязателен: пустую строку допускаем (бэк принимает пустой preview).
    preview: z.string().trim(),
    content: z.string().trim().nonempty(),
    publishDateTime: z.string().nullable(),
  });

  function submitMain(): void {
    isSubmitting.value = true;
    formRef.value?.submit();
  }

  async function handleSubmit(): Promise<void> {
    // Для отложенной публикации дата обязательна и должна быть в будущем.
    // Проверяем в submit-хуке (единая точка отправки), а не в обработчике кнопки:
    // гарантия при любом пути сабмита. В схему не выносим — режим «запланировать»
    // это состояние UI, которого в теле запроса нет.
    if (pubState.value === 'active' && mode.value === 'schedule') {
      const date = state.value.publishDateTime;

      if (!date || new Date(date).getTime() <= Date.now()) {
        $toast.add({
          title: 'Проверь дату публикации',
          description:
            'Для отложенной публикации укажи дату и время в будущем.',
          color: 'warning',
        });

        isSubmitting.value = false;

        return;
      }
    }

    await onSubmit();
    isSubmitting.value = false;
  }

  function handleError(event: FormErrorEvent): void {
    onError(event);
    isSubmitting.value = false;
  }
</script>

<template>
  <UForm
    ref="formRef"
    :schema
    class="grid gap-8 pb-24"
    :state
    @submit="handleSubmit"
    @error="handleError"
  >
    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Основная информация</h2>
      </template>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-5">
        <!-- Колонка 1: тип, заголовок, url -->
        <div class="flex flex-col gap-5 sm:col-span-3">
          <UFormField
            label="Тип"
            name="type"
            required
          >
            <UTabs
              v-model="state.type"
              :items="ARTICLE_TYPE_OPTIONS"
              :content="false"
              class="w-fit"
            />
          </UFormField>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <UFormField
              label="Заголовок"
              name="title"
              required
            >
              <UInput
                v-model="state.title"
                placeholder="Введи заголовок"
              />
            </UFormField>

            <UFormField
              label="URL"
              name="url"
              required
            >
              <ArticleSlugField
                v-model="state.url"
                :title="state.title"
                :current-url="currentUrl"
              />
            </UFormField>
          </div>
        </div>

        <!-- Колонка 2: публикация -->
        <div
          class="flex flex-col gap-4 border-t border-default pt-4 sm:col-span-2 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6"
        >
          <UTabs
            v-model="pubState"
            :items="ARTICLE_PUB_STATE_OPTIONS"
            :content="false"
            size="sm"
            class="w-fit"
          />

          <UTabs
            v-if="pubState === 'active'"
            v-model="publishMode"
            :items="ARTICLE_PUBLISH_MODES"
            :content="false"
            size="sm"
            class="w-fit"
          />

          <UFormField
            v-if="pubState === 'active' && mode === 'schedule'"
            name="publishDateTime"
            required
          >
            <ArticlePublishDateField v-model="state.publishDateTime" />
          </UFormField>

          <div
            v-else-if="pubState === 'inactive'"
            class="flex flex-col gap-2"
          >
            <UCheckbox
              v-model="state.accessibleByLink"
              label="Доступна по ссылке"
              description="Неактивную запись можно открыть по прямой ссылке — для предпросмотра. В публичных списках её нет."
            />

            <UButton
              v-if="canCopyPreviewLink"
              class="self-start"
              variant="soft"
              color="neutral"
              size="sm"
              icon="tabler:link"
              @click.left.exact.prevent="copyPreviewLink"
            >
              Скопировать ссылку для предпросмотра
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <UCard variant="subtle">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm font-medium text-highlighted">Опубликовать:</span>

        <UButton
          v-for="channel in channelButtons"
          :key="channel.key"
          :icon="channel.icon"
          :variant="channel.variant"
          :color="channel.color"
          :aria-pressed="channel.active"
          @click.left.exact.prevent="toggleChannel(channel.key)"
        >
          {{ channel.label }}
        </UButton>

        <UButton
          icon="tabler:checks"
          :variant="allChannelsButton.variant"
          :color="allChannelsButton.color"
          :aria-pressed="allChannelsSelected"
          @click.left.exact.prevent="toggleAllChannels"
        >
          Везде
        </UButton>
      </div>

      <div
        v-if="showSocialStats"
        class="mt-4 flex flex-col gap-1 border-t border-default pt-4 text-sm"
      >
        <p class="font-medium text-highlighted tabular-nums">
          Символов в посте: {{ postCharCount }} (анонс {{ previewCharCount }} ·
          содержание {{ contentCharCount }})
        </p>

        <p
          v-if="state.publishToTelegram"
          class="tabular-nums"
          :class="isOverTelegramTarget ? 'text-warning' : 'text-muted'"
        >
          Telegram: {{ postCharCount }} / {{ telegramTarget }} ({{
            telegramHint
          }})
        </p>

        <p
          v-if="state.publishToDiscord"
          class="tabular-nums"
          :class="isOverDiscordTarget ? 'text-warning' : 'text-muted'"
        >
          Discord: {{ postCharCount }} / {{ discordTarget }} (при любом
          раскладе)
        </p>
      </div>
    </UCard>

    <UCard
      variant="subtle"
      :ui="{ body: isPreviewOpen ? undefined : 'p-0 sm:p-0' }"
    >
      <template #header>
        <button
          type="button"
          class="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
          :aria-expanded="isPreviewOpen"
          @click.left.exact.prevent="isPreviewOpen = !isPreviewOpen"
        >
          <span class="flex min-w-0 items-center gap-2">
            <h2 class="truncate text-base text-highlighted">Анонс</h2>

            <span
              v-if="!isPreviewOpen && hasPreviewText"
              class="shrink-0 text-xs text-muted"
            >
              заполнен
            </span>
          </span>

          <UIcon
            :name="isPreviewOpen ? 'tabler:chevron-up' : 'tabler:chevron-down'"
            class="size-5 shrink-0 text-muted"
          />
        </button>
      </template>

      <UFormField
        v-if="isPreviewOpen"
        name="preview"
      >
        <MarkupEditor
          v-model="state.preview"
          placeholder="Введи короткий анонс"
        />
      </UFormField>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Содержание</h2>
      </template>

      <UFormField name="content">
        <MarkupEditor
          v-model="state.content"
          placeholder="Введи тело статьи"
        />
      </UFormField>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Обложка</h2>
      </template>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
        <div
          class="relative overflow-hidden rounded-lg border border-default bg-muted"
        >
          <NuxtImg
            v-slot="{ src, isLoaded, imgAttrs }"
            :key="coverModel"
            :src="coverModel ?? ''"
            custom
          >
            <img
              v-if="isLoaded"
              v-bind="imgAttrs"
              class="aspect-video w-full object-cover"
              :src="src"
              :alt="state.title"
            />

            <img
              v-else
              class="aspect-video w-full object-cover opacity-50"
              :src="ARTICLE_FALLBACK_IMAGE"
              alt="no image"
            />
          </NuxtImg>

          <UButton
            v-if="coverModel"
            icon="tabler:trash"
            color="error"
            size="sm"
            class="absolute top-2 right-2"
            aria-label="Удалить обложку"
            @click.left.exact.prevent="coverModel = undefined"
          />
        </div>

        <UploadImage
          v-model="coverModel"
          :section="ARTICLE_IMAGE_SECTION"
          :max-size="ARTICLE_IMAGE_MAX_SIZE"
        />
      </div>
    </UCard>

    <div class="sticky bottom-0 z-20 col-span-full">
      <div
        class="flex flex-wrap items-center justify-end gap-2 border-t border-default bg-default/95 px-4 py-3 backdrop-blur"
      >
        <UButton
          variant="ghost"
          color="neutral"
          icon="tabler:x"
          class="mr-auto"
          :to="ARTICLES_ADMIN_ROUTE"
        >
          Закрыть
        </UButton>

        <UButton
          variant="soft"
          color="neutral"
          @click.left.exact.prevent="previewOpened = true"
        >
          Предпросмотр
        </UButton>

        <ArticlePreview
          v-model:open="previewOpened"
          :state="submitState"
        />

        <UButton
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click.left.exact.prevent="submitMain"
        >
          {{ mainActionLabel }}
        </UButton>
      </div>
    </div>
  </UForm>
</template>
