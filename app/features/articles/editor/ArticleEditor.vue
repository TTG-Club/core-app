<script setup lang="ts">
  import type { FormErrorEvent } from '#ui/types';

  import type {
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
    ARTICLE_POST_CHAR_TARGET_NO_IMAGE,
    ARTICLE_POST_CHAR_TARGET_WITH_IMAGE,
    ARTICLE_PUB_STATE_OPTIONS,
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
      // Нормализуем при загрузке к пустой строке. `publishToTelegram` также
      // страхуем на случай null у записей до миграции бэка.
      normalizeLoaded: (raw) => ({
        ...raw,
        preview: raw.preview ?? '',
        publishToTelegram: raw.publishToTelegram ?? false,
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

  // Желательный максимум зависит от обложки: пост с картинкой = подпись к медиа
  // (короче), без картинки = текстовый пост (длиннее). Лимит не жёсткий.
  const hasCover = computed(() => !!state.value.previewImageUrl);

  const charTarget = computed(() =>
    hasCover.value
      ? ARTICLE_POST_CHAR_TARGET_WITH_IMAGE
      : ARTICLE_POST_CHAR_TARGET_NO_IMAGE,
  );

  // Превышен желательный максимум — только подсветка, отправку не блокируем.
  const isOverCharTarget = computed(
    () => postCharCount.value > charTarget.value,
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

  function togglePublishToTelegram(): void {
    state.value.publishToTelegram = !state.value.publishToTelegram;
  }

  const schema = z.object({
    title: z.string().trim().nonempty(),
    url: z.string().trim().nonempty(),
    type: z.enum(['NEWS', 'ARTICLE']),
    draft: z.boolean(),
    active: z.boolean(),
    accessibleByLink: z.boolean(),
    publishToTelegram: z.boolean(),
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
      <UButton
        icon="tabler:brand-telegram"
        :variant="state.publishToTelegram ? 'solid' : 'soft'"
        :color="state.publishToTelegram ? 'primary' : 'neutral'"
        :aria-pressed="state.publishToTelegram"
        @click.left.exact.prevent="togglePublishToTelegram"
      >
        Опубликовать в Telegram
      </UButton>

      <div
        class="mt-4 flex flex-col gap-1 border-t border-default pt-4 text-sm"
      >
        <p
          class="font-medium tabular-nums"
          :class="isOverCharTarget ? 'text-warning' : 'text-highlighted'"
        >
          Символов в посте (анонс + содержание): {{ postCharCount }} /
          {{ charTarget }}
        </p>

        <p class="text-muted">
          {{ hasCover ? 'С картинкой' : 'Без картинки' }} — желательно до
          {{ charTarget }} символов.
        </p>

        <p class="text-muted tabular-nums">
          Анонс: {{ previewCharCount }} · Содержание: {{ contentCharCount }}
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
